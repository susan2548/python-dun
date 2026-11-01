import test from 'node:test';
import assert from 'node:assert/strict';
import {CloudSaveQueue} from './cloud-save.js';
import {validateSave,validateClears,nickname} from './server/player-policy.mjs';
const snapshot=()=>({classId:'wizard',campaignVersion:2,stars:Array(12).fill(0),cleared:0,gold:30,potions:2,manaPotions:2,attackBonus:0,hpBonus:0,shopStock:{floor:0,potion:2,mana:3}});
test('lost response retries identical mutation, then flushes later changes',async()=>{
 const calls=[];let fail=true;
 const q=new CloudSaveQueue({accountId:'a',revision:4,send:async job=>{calls.push(structuredClone(job));if(fail){fail=false;throw Error('offline');}return {revision:job.revision+1};}});
 q.stage({gold:30});assert.equal(await q.flush(),false);q.stage({gold:55});assert.equal(await q.flush(),true);
 assert.equal(calls[0].mutationId,calls[1].mutationId);assert.equal(calls[1].revision,4);assert.equal(calls[2].revision,5);assert.equal(calls[2].save.gold,55);assert.equal(q.revision,6);
});
test('concurrent edits and victory events are not dropped during an in-flight save',async()=>{
 let release;const calls=[];const q=new CloudSaveQueue({accountId:'a',send:async job=>{calls.push(structuredClone(job));if(calls.length===1)await new Promise(r=>release=r);return {revision:job.revision+1};}});
 q.stage({stars:0});const pending=q.flush();q.addClear({id:'e1'});q.stage({stars:3});release();await pending;
 assert.equal(calls.length,2);assert.deepEqual(calls[1].clears,[{id:'e1'}]);assert.equal(q.clears.length,0);
});
test('conflicts and account changes block writes rather than overwrite',async()=>{
 let n=0;const q=new CloudSaveQueue({accountId:'a',send:async()=>{n++;throw Object.assign(Error('conflict'),{status:409});}});
 q.stage({gold:20});await q.flush();q.stage({gold:30});await q.flush();assert.equal(n,1);assert.equal(q.blocked,true);
});
test('server validates progress, nickname and mandatory three answers',()=>{
 const s=snapshot();assert.deepEqual(validateSave({...s,userId:'forged'}),s);assert.equal(validateSave(s).shopStock.potion,2);
 assert.throws(()=>validateSave({...s,stars:[...Array(11).fill(0),7]}));assert.throws(()=>validateSave({...s,cleared:12}));
 assert.throws(()=>nickname('someone@example.com'));assert.throws(()=>nickname('<script>'));assert.equal(nickname(' นักโค้ด '),'นักโค้ด');
 const e={id:crypto.randomUUID(),floor:0,classId:'wizard',answers:3,mistakes:1,enemyHp:0};
 s.stars[0]=2;s.cleared=1;assert.equal(validateClears([e],s)[0].stars,2);assert.throws(()=>validateClears([{...e,answers:2}],s));assert.throws(()=>validateClears([{...e,enemyHp:1}],s));
 assert.equal(validateClears([e],snapshot())[0].stars,2,'queued past victory survives a new-game snapshot');
});
