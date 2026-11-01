import test from 'node:test';
import assert from 'node:assert/strict';
import {ActivePlayClock,normalizeTiming,formatDuration} from './play-clock.js';
import {RankingLiveFeed} from './ranking-live.js';
import {validateSave,validateClears} from './server/player-policy.mjs';
test('active clock excludes hidden/ranking time, reload gaps and other runs/accounts',()=>{
 let now=0;const clock=new ActivePlayClock(()=>now),save={runId:'one',playTimeMs:0};
 clock.sample(save,true,'account-a:one');now=1000;clock.sample(save,true,'account-a:one');
 now=2000;clock.sample(save,false,'account-a:one');now=100000;clock.sample(save,false,'account-a:one');
 assert.equal(save.playTimeMs,2000);clock.sample(save,true,'account-a:one');now+=5000;clock.sample(save,false,'account-a:one');assert.equal(save.playTimeMs,7000);
 const other={runId:'two',playTimeMs:0};now+=1000;clock.sample(other,true,'account-b:two');assert.equal(other.playTimeMs,0);
 clock.reset();now+=900000;clock.sample(other,true,'account-b:two');assert.equal(other.playTimeMs,0);
 assert.equal(normalizeTiming({playTimeMs:0,timingVersion:1},{classId:'wizard'}).timingVersion,0);
 assert.equal(normalizeTiming({playTimeMs:0,timingVersion:1},null).timingVersion,1);
 assert.equal(formatDuration(3661000),'01:01:01');assert.equal(formatDuration(null),'ไม่มีข้อมูลเดิม');
});
test('live feed ignores late replies and prevents overlapping requests',async()=>{
 let resolve;let calls=0,paint=0;const feed=new RankingLiveFeed({load:()=>{calls++;return new Promise(r=>resolve=r);},onData:()=>paint++,onError:()=>assert.fail(),schedule:()=>0,cancel:()=>{}});
 const pending=feed.refresh();await feed.refresh();assert.equal(calls,1);feed.stop();resolve({rows:[]});await pending;assert.equal(paint,0);
});
test('live feed retries failure, pauses when hidden and recovers without discarding prior rows',async()=>{
 let visible=true,fail=false,callback,success=0,errors=0,cancelled=0;
 const feed=new RankingLiveFeed({active:()=>visible,load:async()=>{if(fail)throw Error('offline');return {};},onData:()=>success++,onError:()=>errors++,schedule:fn=>{callback=fn;return 1;},cancel:()=>cancelled++});
 await feed.refresh();assert.equal(success,1);fail=true;await callback();assert.equal(errors,1);assert.equal(success,1);
 visible=false;feed.pause();await feed.refresh();assert.equal(errors,1);assert.ok(cancelled>0);
 visible=true;fail=false;await feed.refresh();assert.equal(success,2);feed.stop();
});
test('time validation rejects malformed clocks and preserves old queued receipts',()=>{
 const s={campaignVersion:2,classId:'wizard',stars:Array(12).fill(0),cleared:0,gold:30,potions:2,manaPotions:2,attackBonus:0,hpBonus:0,runId:'11111111-1111-4111-8111-111111111111',playTimeMs:12000,timingVersion:1};
 assert.equal(validateSave(s).playTimeMs,12000);
 for(const bad of [-1,Infinity,1.5,315360000001])assert.throws(()=>validateSave({...s,playTimeMs:bad}));
 const old={id:crypto.randomUUID(),floor:0,classId:'wizard',answers:3,mistakes:0,enemyHp:0};
 assert.equal(validateClears([old])[0].stars,3);assert.equal(validateClears([{...old,runId:s.runId,elapsedMs:12000,timed:true}])[0].timed,true);
 assert.throws(()=>validateClears([{...old,runId:s.runId,elapsedMs:-1,timed:true}]));
});
