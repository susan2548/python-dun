// Real service QA. Run against disposable local API; records are explicitly QA.
// Credentials/cookies stay in memory. Output contains counts and fixture IDs only.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {db} from '../server/db.mjs';
const base='http://localhost:8781',suffix=randomBytes(5).toString('hex'),ids=[],checks=[];
async function call(path,{jar,method='GET',data}={}){
 const r=await fetch(base+path,{method,headers:{origin:base,...(jar?{cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],at=pair.indexOf('=');jar?.set(pair.slice(0,at),pair.slice(at+1));}
 const json=await r.json();return {status:r.status,data:json};
}
async function account(label){
 const jar=new Map(),email=`dungeon-api-qa-${label}-${suffix}@example.com`,password=randomBytes(24).toString('base64url');
 const r=await call('/api/auth/sign-up/email',{jar,method:'POST',data:{email,password,name:'QA '+label}});assert.equal(r.status,200,'signup');
 const session=await call('/api/auth/get-session',{jar});assert.equal(session.status,200);assert(session.data.user?.id);const id=session.data.user.id;ids.push(id);
 const p=await call('/api/player',{jar});assert.equal(p.status,200);assert.equal(p.data.accountId,id);assert.equal(p.data.save,null);
 const nick=await call('/api/player',{jar,method:'PATCH',data:{accountId:id,nickname:'QA นักโค้ด '+label}});assert.equal(nick.status,200);
 return {jar,id,password,email};
}
function save(stars=Array(12).fill(0),classId='wizard'){return {classId,campaignVersion:2,cleared:stars.findIndex(s=>!s)<0?12:stars.findIndex(s=>!s),stars,gold:30,potions:2,manaPotions:2,attackBonus:0,hpBonus:0,activeBattle:null,expedition:{hp:82,mp:24,maxHp:82,maxMp:24},shopStock:{floor:0,potion:2,mana:3}};}
function clear(floor,mistakes=0){return {id:randomUUID(),floor,classId:'wizard',answers:3,mistakes,enemyHp:0};}
const fixturesFile=new URL('../../asset-sources/cloud-qa-fixtures.json',import.meta.url);
try{
 assert.equal((await call('/api/player')).status,401);checks.push('unauthenticated save rejected');
 const a=await account('A'),b=await account('B');
 const initial={accountId:a.id,revision:0,mutationId:randomUUID(),save:save()};
 let r=await call('/api/player',{jar:a.jar,method:'PUT',data:initial});assert.equal(r.status,200);assert.equal(r.data.revision,1);
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:initial});assert.equal(r.data.duplicate,true);assert.equal(r.data.revision,1);
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:{...initial,mutationId:randomUUID()}});assert.equal(r.status,409);checks.push('revision conflicts and duplicate/lost-ACK retries');
 r=await call('/api/player',{jar:b.jar,method:'PUT',data:{...initial,revision:0,mutationId:randomUUID()}});assert.equal(r.status,403);
 r=await call('/api/player?userId='+a.id,{jar:b.jar});assert.equal(r.data.accountId,b.id);assert.equal(r.data.save,null);checks.push('two accounts isolated, forged owner rejected');
 const full=save(Array(12).fill(3));
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:1,mutationId:randomUUID(),save:full,clears:[]}});assert.equal(r.status,200);
 assert.equal((await call('/api/ranking')).data.total,0);checks.push('imported stars alone do not qualify');
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:2,mutationId:randomUUID(),save:full,clears:[{...clear(0),answers:2}]}});assert.equal(r.status,400);checks.push('less than three accepted answers rejected');
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:2,mutationId:randomUUID(),save:full,clears:Array.from({length:11},(_,i)=>clear(i))}});assert.equal(r.status,200);assert.equal(r.data.rankedCount,11);
 assert.equal((await call('/api/ranking')).data.total,0);
 const finalClear=clear(11);r=await call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:3,mutationId:randomUUID(),save:full,clears:[finalClear,finalClear]}});assert.equal(r.status,200);assert.equal(r.data.rankedCount,12);
 r=await call('/api/ranking');assert.equal(r.data.total,1);assert.equal(r.data.rows[0].stars,36);assert(!JSON.stringify(r.data).includes(a.id));assert(!JSON.stringify(r.data).includes('@'));checks.push('12 distinct clears qualify once; public response omits identity/email');
 r=await call('/api/player',{jar:a.jar,method:'PUT',data:{accountId:a.id,revision:4,mutationId:randomUUID(),save:save(),clears:[]}});assert.equal(r.status,200);assert.equal((await call('/api/ranking')).data.rows[0].stars,36);checks.push('new game retains best historic rank');
 r=await call('/api/auth/sign-out',{jar:a.jar,method:'POST',data:{}});assert.equal(r.status,200);a.jar.clear();assert.equal((await call('/api/player',{jar:a.jar})).status,401);
 r=await call('/api/auth/sign-in/email',{jar:a.jar,method:'POST',data:{email:a.email,password:a.password}});assert.equal(r.status,200);r=await call('/api/player',{jar:a.jar});assert.equal(r.data.accountId,a.id);assert.equal(r.data.revision,5);checks.push('logout rejects private requests; login restores cloud save');
 const sql=db();
 // Three more local QA rows exercise Rank 1–4 and fixed ranking order. Never
 // ship these names as example players; clean these IDs before public release.
 for(const [name,stars]of [['B',24],['C',30],['D',27]]){
  const id=name==='B'?b.id:randomUUID();if(name!=='B')ids.push(id);
  await sql`INSERT INTO dungeon_players(user_id,nickname) VALUES(${id},${'QA นักโค้ด '+name}) ON CONFLICT DO NOTHING`;
  const grades=Array.from({length:12},(_,i)=>i<stars-24?3:2);
  if(stars===24)grades.fill(2);
  const results=grades.map((star,i)=>({...clear(i,star===3?0:1),stars:star}));
  const [{revision}]=await sql`SELECT revision FROM dungeon_players WHERE user_id=${id}`;
  await sql`SELECT dungeon_save_player(${id},${revision},${JSON.stringify(save(grades))}::jsonb,${JSON.stringify(results)}::jsonb,${randomUUID()})`;
 }
 const ranking=(await call('/api/ranking?page=999')).data;assert.equal(ranking.page,1);assert.equal(ranking.total,4);assert.deepEqual(ranking.rows.map(x=>x.stars),[36,30,27,24]);assert.deepEqual(ranking.rows.map(x=>x.rank),[1,2,3,4]);checks.push('four-place ranking, star ordering, pagination clamps');
 await writeFile(fixturesFile,JSON.stringify({ids,checks,passed:checks.length},null,2));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}catch(error){await writeFile(fixturesFile,JSON.stringify({ids,checks,error:error.message},null,2));throw error;}
