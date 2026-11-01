// Real-service integration QA. Only creates and removes its own reserved fixtures.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {db} from '../server/db.mjs';
const base=process.env.QA_BASE||'http://localhost:8781';
if(!['http://localhost:8781','https://python-dungeon-live.vercel.app'].includes(base))throw Error('Unapproved QA target');
const fixtures=[],checks=[],suffix=randomBytes(5).toString('hex');
async function call(path,{jar,method='GET',data}={}){
 const r=await fetch(base+path,{method,headers:{Origin:base,...(jar?{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
 for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');if(!pair.slice(i+1))jar?.delete(pair.slice(0,i));else jar?.set(pair.slice(0,i),pair.slice(i+1));}
 return {status:r.status,data:await r.json()};
}
async function account(label){
 const a={jar:new Map(),email:`dungeon-v19-api-${label}-${suffix}@example.com`,password:randomBytes(24).toString('base64url'),name:'QA v19 '+label+' '+suffix};fixtures.push(a);
 let r=await call('/api/auth/sign-up/email',{jar:a.jar,method:'POST',data:{email:a.email,password:a.password,name:a.name}});assert.equal(r.status,200,'signup');a.id=r.data.user?.id;
 r=await call('/api/auth/get-session',{jar:a.jar});assert.equal(r.status,200);a.id=r.data.user.id;
 r=await call('/api/player',{jar:a.jar});assert.equal(r.status,200);assert.equal(r.data.accountId,a.id);
 r=await call('/api/player',{jar:a.jar,method:'PATCH',data:{accountId:a.id,nickname:a.name}});assert.equal(r.status,200);
 return a;
}
function save(stars=Array(12).fill(0),ms=18000,runId=randomUUID()){
 return {classId:'wizard',campaignVersion:2,runId,timingVersion:1,playTimeMs:ms,cleared:stars.findIndex(s=>!s)<0?12:stars.findIndex(s=>!s),stars,gold:30,potions:2,manaPotions:2,attackBonus:0,hpBonus:0,activeBattle:null};
}
function clear(floor,s){return {id:randomUUID(),floor,classId:'wizard',answers:3,mistakes:0,enemyHp:0,runId:s.runId,elapsedMs:s.playTimeMs,timed:true};}
async function put(a,s,clears=[],extra={}){return call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:a.revision||0,mutationId:randomUUID(),save:s,clears,...extra}});}
try{
 assert.equal((await call('/api/player')).status,401);checks.push('anonymous save rejected');
 for(const file of ['/.env.local','/server/db.mjs','/tools/qa-cloud.mjs'])assert.equal((await fetch(base+file)).status,404);
 checks.push('server files and credentials not public');
 const slow=await account('slow'),fast=await account('fast'),partial=await account('live');
 const fullSlow=save(Array(12).fill(3),200000),fullFast=save(Array(12).fill(3),100000),part=save([3,...Array(11).fill(0)]);
 for(const [a,s] of [[slow,fullSlow],[fast,fullFast],[partial,part]]){
  const events=s.stars.flatMap((star,i)=>star?[clear(i,s)]:[]),r=await put(a,s,events);assert.equal(r.status,200,JSON.stringify(r.data));a.revision=r.data.revision;
 }
 const board=(await call('/api/ranking')).data;
 const ours=board.rows.filter(r=>r.nickname.includes(suffix));assert.equal(ours.length,3);
 assert.equal(ours[0].nickname,fast.name);assert.equal(ours[1].nickname,slow.name);assert.equal(Number(ours[0].duration_ms),100000);assert.equal(Number(ours[1].duration_ms),200000);
 assert.equal(ours[2].stars,3);assert.equal(ours[2].floors_cleared,1);assert.equal(ours[2].completed_at,null);checks.push('live ongoing learner + equal-star finishers sorted by duration');
 assert(!JSON.stringify(board).includes('@'));for(const a of fixtures)assert(!JSON.stringify(board).includes(a.id));checks.push('public response omits email and user IDs');
 let r=await put(partial,part,[],{accountId:fast.id});assert.equal(r.status,403);checks.push('cross-account mismatch rejected');
 r=await put(partial,part,[],{revision:0});assert.equal(r.status,409);checks.push('stale revision conflict');
 r=await put(partial,{...part,playTimeMs:-1});assert.equal(r.status,400);checks.push('invalid duration rejected');
 const mutationId=randomUUID();r=await put(partial,part,[],{mutationId});assert.equal(r.status,200);
 const repeated=await put(partial,part,[],{mutationId});assert.equal(repeated.data.duplicate,true);partial.revision=r.data.revision;checks.push('lost-ack replay is idempotent');
 const reset=save();r=await put(fast,reset);assert.equal(r.status,200);fast.revision=r.data.revision;
 assert.equal((await call('/api/ranking')).data.rows.find(r=>r.nickname===fast.name).stars,36);checks.push('new run preserves completed best rank');
 const player=await call('/api/player',{jar:fast.jar});assert.equal(player.data.save.runId,reset.runId);assert.equal(Number(player.data.best.duration_ms),100000);checks.push('private cloud save and best duration restored');
 const logout=await call('/api/auth/sign-out',{jar:fast.jar,method:'POST',data:{}});assert.equal(logout.status,200);fast.jar.clear();assert.equal((await call('/api/player',{jar:fast.jar})).status,401);
 r=await call('/api/auth/sign-in/email',{jar:fast.jar,method:'POST',data:{email:fast.email,password:fast.password}});assert.equal(r.status,200);assert.equal((await call('/api/player',{jar:fast.jar})).data.accountId,fast.id);checks.push('logout and login retain account save');
 console.log(JSON.stringify({passed:checks.length,target:base,checks}));
}finally{
 const sql=db();
 for(const a of fixtures){
  if(!/^dungeon-v19-api-(slow|fast|live)-[a-f0-9]{10}@example.com$/.test(a.email))throw Error('Unsafe fixture cleanup');
  const [owned]=await sql`SELECT id::text AS id FROM neon_auth."user" WHERE email=${a.email}`;
  if(!owned)continue;
  if(a.id&&owned.id!==a.id)throw Error('Fixture identity changed');const id=owned.id;
  await sql.transaction([sql`DELETE FROM dungeon_rankings WHERE user_id=${id}`,sql`DELETE FROM dungeon_run_clears WHERE user_id=${id}`,sql`DELETE FROM dungeon_runs WHERE user_id=${id}`,sql`DELETE FROM dungeon_clears WHERE user_id=${id}`,sql`DELETE FROM dungeon_players WHERE user_id=${id}`,sql`DELETE FROM neon_auth."user" WHERE id::text=${id}`]);
 }
 console.log('Removed only this run’s QA identities and ranking rows.');
}
