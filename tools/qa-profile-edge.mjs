import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE_URL||'http://localhost:8781',jar=new Map();
const file=new URL('../../asset-sources/cloud-qa-fixtures.json',import.meta.url),fixture=JSON.parse(await readFile(file,'utf8'));
async function api(path,data,origin=base){
 const r=await fetch(base+path,{method:data?'POST':'GET',headers:{origin,cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return {status:r.status,data:await r.json()};
}
const email='dungeon-api-qa-edge-'+randomBytes(5).toString('hex')+'@example.com';
let r=await api('/api/auth/sign-up/email',{email,password:randomBytes(24).toString('base64url'),name:'QA edge'});assert.equal(r.status,200);
const session=(await api('/api/auth/get-session')).data,id=session.user.id;fixture.ids.push(id);await writeFile(file,JSON.stringify(fixture,null,2));
const player=(await api('/api/player')).data;assert.equal(player.nickname,null);
const save={classId:null,campaignVersion:2,stars:Array(12).fill(0),cleared:0,gold:30,potions:2,manaPotions:2,attackBonus:0,hpBonus:0};
const clears=Array.from({length:12},(_,floor)=>({id:randomUUID(),floor,classId:'wizard',answers:3,mistakes:0,enemyHp:0}));
const data={accountId:id,revision:0,mutationId:randomUUID(),save,clears};
async function mutate(method,data,origin=base){const response=await fetch(base+'/api/player',{method,headers:{origin,cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:response.status,data:await response.json()};}
assert.equal((await mutate('PUT',data,'https://untrusted.example')).status,403);
r=await mutate('PUT',data);assert.equal(r.status,200);assert.equal(r.data.rankedCount,12,'historical pending clears survive current-run reset');
const before=(await api('/api/ranking')).data.total;
r=await mutate('PATCH',{accountId:id,nickname:'QA ชื่อภายหลัง'});assert.equal(r.status,200);
let ranking=(await api('/api/ranking')).data;assert.equal(ranking.total,before+1);assert(ranking.rows.some(x=>x.nickname==='QA ชื่อภายหลัง'&&x.stars===36));
assert.equal((await mutate('PATCH',{accountId:id,nickname:'QA เปลี่ยนชื่อ'})).status,200);
ranking=(await api('/api/ranking')).data;assert.equal(ranking.total,before+1);assert(ranking.rows.some(x=>x.nickname==='QA เปลี่ยนชื่อ'));
const result={passed:4,checks:['exact-origin protection','queued victory survives reset','late nickname creates eligible ranking','nickname change preserves one entry']};
await writeFile(new URL('../../asset-sources/cloud-profile-edge-qa.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
