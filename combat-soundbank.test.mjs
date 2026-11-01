import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VOICE_BANK,ACTOR_VOICES,FX_FILES,RUN_FEEDBACK,NEW_MONSTER_AUDIO,soundPlan,pickTake} from './combat-soundbank.js';
const manifest=JSON.parse(fs.readFileSync(new URL('./assets/audio-v14/manifest.json',import.meta.url)));
const {clips,sources}=manifest;
assert.equal(Object.keys(clips).length,89);
for(const [id,c]of Object.entries(clips)){
 assert.equal(c.syntheticSpeech,false,id);assert.ok(c.peak>0&&c.peak<.98,id+' headroom');assert.ok(c.seconds>.05&&c.seconds<=2.15,id+' duration');
 assert.ok(fs.statSync(new URL('./assets/audio-v14/'+c.file,import.meta.url)).size>1000,id);assert.ok(sources[c.pack].url.startsWith('https://'));assert.match(c.sourceSha256,/^[a-f0-9]{64}$/);
}
for(const [key,v]of Object.entries(VOICE_BANK)){
 assert.ok(v.pool.length);for(const id of v.pool){assert.equal(clips[id]?.kind,'voice',key+'/'+id);assert.ok(clips[id].seconds<=1.8,key+' concise bark');}
 assert.ok(!JSON.stringify(v).includes('Watch my blade'));
}
for(const [kind,keys]of Object.entries(ACTOR_VOICES)){assert.ok(keys.includes('attack_'+kind));for(const key of keys)assert.ok(VOICE_BANK[key],kind+'/'+key);}
const originalHashes=new Set(Object.entries(clips).filter(([id])=>!id.startsWith('v15-')).map(([,c])=>c.sourceSha256));
const newHashes=[];
for(const [kind,[normal,special]] of Object.entries(NEW_MONSTER_AUDIO)){
 for(const variant of [normal,special])for(const stage of ['windup','release','hit','miss'])for(const layer of soundPlan(kind,variant,stage))for(const id of layer.pool)assert(clips[id],id);
 for(const type of ['vo','fx'])for(let n=0;n<2;n++){const c=clips[`v15-${type}-${kind}-${n}`];assert(!originalHashes.has(c.sourceSha256));newHashes.push(c.sourceSha256);}
 assert.notDeepEqual(soundPlan(kind,normal,'release'),soundPlan(kind,special,'release'));
}
assert.equal(new Set(newHashes).size,24,'New monsters need distinct recorded takes');
const skillIds=['double_strike','smoke_blade','shield_bash','iron_oath','fireball','frost_lance'];
const successHashes=new Set(RUN_FEEDBACK.accepted.map(l=>clips[l.id].sourceSha256));
for(const [result,plan]of Object.entries(RUN_FEEDBACK))for(const layer of plan){assert.equal(clips[layer.id].kind,'fx',result+' must never speak');assert.ok(layer.gain>0&&layer.gain<.5);assert.ok(layer.delay>=0&&layer.delay<.5);assert.ok(FX_FILES.includes(layer.id));if(result==='rejected')assert(!successHashes.has(clips[layer.id].sourceSha256),'accepted/rejected use different source sounds');}
assert(!Object.keys(VOICE_BANK).some(k=>k.startsWith('run_')),'Run has no character speech');
assert.equal(new Set(skillIds.flatMap(k=>VOICE_BANK[k].pool)).size,skillIds.flatMap(k=>VOICE_BANK[k].pool).length,'skills need distinct voice takes');
for(const kind of Object.keys(ACTOR_VOICES))for(const variant of ['attack','magic-bolt','guard','focus',...skillIds,'shield','poison','web','curse','stone'])for(const stage of ['windup','release','hit','miss','cutin']){
 const plan=soundPlan(kind,variant,stage,{targetKind:'skeleton'});assert.ok(plan.length>=1&&plan.length<=2);
 assert.ok(plan.reduce((n,l)=>n+l.gain,0)<.65,'bounded mix headroom '+kind+'/'+variant+'/'+stage);
 for(const l of plan)for(const id of l.pool){assert.equal(clips[id]?.kind,'fx',kind+'/'+variant+'/'+id);assert.ok(FX_FILES.includes(id));assert.ok(l.rate>.5&&l.rate<1.5);}
}
const hit=t=>soundPlan('adventurer','attack','hit',{targetKind:t});
assert.notDeepEqual(hit('zombie'),hit('golem'));assert.notDeepEqual(hit('zombie'),hit('knight'));assert.notDeepEqual(hit('zombie'),hit('skeleton'));
assert.notDeepEqual(soundPlan('wizard','fireball','hit'),soundPlan('wizard','frost_lance','hit'));
assert.notDeepEqual(soundPlan('wizard','fireball','miss'),soundPlan('wizard','fireball','hit'));
let previous;for(let i=0;i<100;i++){const next=pickTake(['a','b','c'],previous,()=>i/100);assert.notEqual(next,previous);previous=next;}
assert.equal(pickTake(['only'],'only'),'only');
console.log('Recorded combat audio passed: 89 files, 15 actors, distinct speech-free Run feedback, distinct skills and bounded decoded headroom.');
