import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VOICE_BANK,ACTOR_VOICES,FX_FILES,soundPlan,pickTake} from './combat-soundbank.js';
const manifest=JSON.parse(fs.readFileSync(new URL('./assets/audio-v14/manifest.json',import.meta.url)));
const {clips,sources}=manifest;
assert.equal(Object.keys(clips).length,62);
for(const [id,c]of Object.entries(clips)){
 assert.equal(c.syntheticSpeech,false,id);assert.ok(c.peak>0&&c.peak<.98,id+' headroom');assert.ok(c.seconds>.05&&c.seconds<=2.15,id+' duration');
 assert.ok(fs.statSync(new URL('./assets/audio-v14/'+c.file,import.meta.url)).size>1000,id);assert.ok(sources[c.pack].url.startsWith('https://'));assert.match(c.sourceSha256,/^[a-f0-9]{64}$/);
}
for(const [key,v]of Object.entries(VOICE_BANK)){
 assert.ok(v.pool.length);for(const id of v.pool){assert.equal(clips[id]?.kind,'voice',key+'/'+id);assert.ok(clips[id].seconds<=1.8,key+' concise bark');}
 assert.ok(!JSON.stringify(v).includes('Watch my blade'));
}
for(const [kind,keys]of Object.entries(ACTOR_VOICES)){assert.ok(keys.includes('attack_'+kind));for(const key of keys)assert.ok(VOICE_BANK[key],kind+'/'+key);}
const skillIds=['double_strike','smoke_blade','shield_bash','iron_oath','fireball','frost_lance'];
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
console.log('Recorded combat audio passed: 62 files, 9 actors, distinct skill voices, hit materials, misses, no immediate repeats, bounded mix and decoded headroom.');
