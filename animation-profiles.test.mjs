import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_KINDS,MONSTER_KINDS,NEW_MONSTER_KINDS,idleFrame,poseFrame,motionProfile,phaseAt,motionOffset} from './animation-profiles.js';
import {NEW_MONSTER_AUDIO} from './combat-soundbank.js';
const actors=[...HERO_KINDS,...MONSTER_KINDS,...NEW_MONSTER_KINDS];

// A throttled frame rate must cross contact once, and finish after hit-stop.
for(const kind of actors)for(const variant of ['attack','fireball','double_strike','shield_bash','stone',...(NEW_MONSTER_AUDIO[kind]?.slice(0,2)||[])]){
 const p=motionProfile(kind,variant);
 for(const fps of [10,30,60,144]){
  let hits=0,applied=false,last=-1;
  for(let t=0;t<=p.duration+p.hitStop+100;t+=1000/fps){
   const phase=phaseAt(t,p.duration,p.contact,p.hitStop);assert.ok(phase>=last);last=phase;
   if(phase>=p.contact&&!applied){applied=true;hits++;}
  }
  assert.equal(hits,1);assert.equal(last,1);
 }
 assert.equal(phaseAt(p.duration*p.contact+p.hitStop/2,p.duration,p.contact,p.hitStop),p.contact);
 assert.equal(motionOffset(1,250),0);
}
for(const kind of actors){
 const frames=new Set(Array.from({length:100},(_,i)=>idleFrame(kind,i*97)));
 assert.equal(frames.size,4,kind+' needs four authored idle poses');
 for(const mode of ['idle','attack','cast','guard','focus','drink']){
  if(!HERO_KINDS.includes(kind)&&['focus','drink'].includes(mode))continue;
  for(let p=0;p<=1;p+=.01){const n=poseFrame(kind,mode,p,p*4000);assert.ok(n>=0&&n<(HERO_KINDS.includes(kind)?18:12),kind+'/'+mode+'/'+n);}
 }
 const png=fs.readFileSync(new URL('./assets/'+(NEW_MONSTER_KINDS.includes(kind)?'animation-v15':'animation-v13')+'/'+kind+'.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),HERO_KINDS.includes(kind)?1280:768);
}
assert.equal(new Set(NEW_MONSTER_KINDS.map(k=>motionProfile(k,NEW_MONSTER_AUDIO[k][0]).path)).size,6);
console.log('Animation timing passed: 15 actors, six distinct new travel paths, all pose slots, 10–144 fps and one contact.');
