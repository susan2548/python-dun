// Development only: copy into an isolated work folder with kokoro-js@1.2.1
// installed there, then run from that folder. Writes raw/*.wav and lines.json.
// The browser game uses only the rendered MP3s; never bundle the model.
import {KokoroTTS} from 'kokoro-js';
import fs from 'node:fs/promises';
const tts=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu',progress_callback:p=>{if(p.status==='done')console.log('Loaded',p.file);}});
console.log('Model ready');
const lines=[
 ['double_strike','Watch my blade!','am_fenrir',1.1],['smoke_blade','Vanish in the shadows!','am_fenrir',1.06],
 ['shield_bash','Stand and face me!','am_michael',1.04],['iron_oath','By my oath, I will not fall!','am_michael',.98],
 ['fireball','Burn before me!','bm_george',1.08],['frost_lance','Be still... and freeze!','bm_george',1.0],
 ['zombie_bite','Join the rot!','am_puck',.93],['skeleton_shield','Bones, stand firm!','am_echo',1.12],['skeleton_cleave','Break beneath my blade!','am_echo',1.12],
 ['spider_web','Caught in my web!','af_nicole',.96],['wraith_drain','Your soul is mine!','af_nicole',.9],
 ['golem_guard','Stone endures!','am_michael',.88],['golem_quake','Crush them!','am_michael',.9],
 ['necro_drain','Your power is mine!','bm_george',.94],['necro_curse','Kneel before oblivion!','bm_george',.94],
 ['guard_adventurer','Not today!','am_fenrir',1.14],['guard_knight','Hold the line!','am_michael',1.03],['guard_wizard','Ward of light!','bm_george',1.03],
 ['focus_adventurer','Stay sharp.','am_fenrir',1.0],['focus_knight','Steady my resolve.','am_michael',.98],['focus_wizard','Gather the arcane.','bm_george',.98],
];
await fs.mkdir('raw',{recursive:true});
for(const [id,text,voice,speed] of lines){
 try {await fs.access('raw/'+id+'.wav');console.log('Exists',id);continue;}catch{}
 const audio=await tts.generate(text,{voice,speed});await audio.save('raw/'+id+'.wav');console.log('Saved',id);
}
await fs.writeFile('lines.json',JSON.stringify(lines,null,2));
