import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_KINDS,MONSTER_KINDS,idleFrame,poseFrame,motionProfile,phaseAt,motionOffset} from './animation-profiles.js';

// A throttled frame rate must cross contact once, and finish after hit-stop.
for(const kind of [...HERO_KINDS,...MONSTER_KINDS])for(const variant of ['attack','fireball','double_strike','shield_bash','stone']){
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
for(const kind of [...HERO_KINDS,...MONSTER_KINDS]){
 const frames=new Set(Array.from({length:100},(_,i)=>idleFrame(kind,i*97)));
 assert.equal(frames.size,4,kind+' needs four authored idle poses');
 for(const mode of ['idle','attack','cast','guard','focus','drink']){
  if(!HERO_KINDS.includes(kind)&&['focus','drink'].includes(mode))continue;
  for(let p=0;p<=1;p+=.01){const n=poseFrame(kind,mode,p,p*4000);assert.ok(n>=0&&n<(HERO_KINDS.includes(kind)?18:12),kind+'/'+mode+'/'+n);}
 }
 const png=fs.readFileSync(new URL('./assets/animation-v13/'+kind+'.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),HERO_KINDS.includes(kind)?1280:768);
}
const voices=JSON.parse(fs.readFileSync(new URL('./assets/combat-audio/voices.json',import.meta.url)));
assert.equal(Object.keys(voices).length,21);
assert.equal(new Set(Object.values(voices).map(v=>v.text)).size,21);
for(const [id,v]of Object.entries(voices)){
 assert.equal(v.synthetic,true);assert.ok(fs.statSync(new URL('./assets/combat-audio/'+v.file,import.meta.url)).size>10000,id);
}
console.log('Animation timing: 9 actors, four idle frames, all pose slots, 10–144 fps, one contact, planted return; 21 distinct voiced lines/assets passed.');
