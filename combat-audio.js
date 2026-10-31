import {combatAudioRuntime,duckMusic} from './audio-engine.js?v=4';
const base='./assets/combat-audio/';
const cache=new Map(),active=new Set();
let voiceSource=null,voiceEpoch=0,sceneEpoch=0,cueEpoch=0,voicesOn=true;
try{voicesOn=localStorage.getItem('dungeon-voices')!=='off';}catch{/* Session-only preference when storage is unavailable. */}
export const VOICE_LINES={
  double_strike:'Watch my blade!',smoke_blade:'Vanish in the shadows!',shield_bash:'Stand and face me!',iron_oath:'By my oath, I will not fall!',fireball:'Burn before me!',frost_lance:'Be still... and freeze!',
  zombie_bite:'Join the rot!',skeleton_shield:'Bones, stand firm!',skeleton_cleave:'Break beneath my blade!',spider_web:'Caught in my web!',wraith_drain:'Your soul is mine!',golem_guard:'Stone endures!',golem_quake:'Crush them!',necro_drain:'Your power is mine!',necro_curse:'Kneel before oblivion!',
  guard_adventurer:'Not today!',guard_knight:'Hold the line!',guard_wizard:'Ward of light!',focus_adventurer:'Stay sharp.',focus_knight:'Steady my resolve.',focus_wizard:'Gather the arcane.',
};
async function buffer(file){
  const runtime=combatAudioRuntime();if(!runtime)return null;
  if(!cache.has(file))cache.set(file,fetch(base+file).then(r=>{if(!r.ok)throw Error('Audio missing '+file);return r.arrayBuffer();}).then(b=>runtime.context.decodeAudioData(b)).catch(error=>{cache.delete(file);console.warn('Combat audio fallback',file,error.message);return null;}));
  return cache.get(file);
}
function playBuffer(b,{volume=.6,rate=1,voice=false}={}){
  const runtime=combatAudioRuntime();if(!runtime||!b)return null;
  const {context,destination}=runtime,source=context.createBufferSource(),gain=context.createGain();
  source.buffer=b;source.playbackRate.value=rate;gain.gain.value=volume;source.connect(gain).connect(destination);source.start();active.add(source);
  source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();if(voiceSource===source)voiceSource=null;};
  if(voice)voiceSource=source;return source;
}
async function sample(file,volume=.45,rate=1){const epoch=sceneEpoch,cue=cueEpoch,requested=performance.now(),b=await buffer(file+'.ogg');if(epoch===sceneEpoch&&cue===cueEpoch&&performance.now()-requested<300&&combatAudioRuntime())playBuffer(b,{volume,rate});}
export function stopBattleVoice(){voiceEpoch++;if(voiceSource){try{voiceSource.stop();}catch{}voiceSource=null;}document.querySelector('.battle-voice-caption')?.remove();}
function stopAll(){sceneEpoch++;stopBattleVoice();for(const source of active){try{source.stop();}catch{}}active.clear();}
window.addEventListener('dungeon-audio-state',e=>{if(e.detail.muted)stopAll();});
window.addEventListener('dungeon-audio-scene',stopAll);
export function voicesEnabled(){return voicesOn;}
export function setVoicesEnabled(value){voicesOn=value;try{localStorage.setItem('dungeon-voices',value?'on':'off');}catch{}if(!value)stopBattleVoice();}
export async function preloadCombatAudio(kind){
  if(!combatAudioRuntime())return;
  const ids={adventurer:['double_strike','smoke_blade'],knight:['shield_bash','iron_oath'],wizard:['fireball','frost_lance'],zombie:['zombie_bite'],skeleton:['skeleton_shield','skeleton_cleave'],spider:['spider_web'],wraith:['wraith_drain'],golem:['golem_guard','golem_quake'],necromancer:['necro_drain','necro_curse']}[kind]||[];
  const speech=HERO_VOICES.has(kind)?[...ids,'guard_'+kind,'focus_'+kind]:ids;
  await Promise.all(['blade-whoosh.ogg','metal-ready.ogg','metal-impact.ogg','metal-light.ogg','body-impact.ogg','stone-impact.ogg','glass-impact.ogg',...speech.map(id=>id+'.mp3')].map(buffer));
}
const HERO_VOICES=new Set(['adventurer','knight','wizard']);
export async function playBattleVoice(id,role='hero'){
  stopBattleVoice();const epoch=voiceEpoch;
  if(!VOICE_LINES[id]||!voicesOn||!combatAudioRuntime())return;
  const b=await buffer(id+'.mp3');if(epoch!==voiceEpoch||!voicesOn||!combatAudioRuntime()||!b)return;
  duckMusic(b.duration+.1);playBuffer(b,{volume:.95,voice:true});
  const scene=document.querySelector('#scene');if(!scene)return;
  const caption=document.createElement('span');caption.className='battle-voice-caption voice-'+role;caption.textContent='“'+VOICE_LINES[id]+'”';caption.setAttribute('role','status');scene.append(caption);
  setTimeout(()=>{if(caption.isConnected)caption.remove();},b.duration*1000+150);
}
export function enemyVoice(kind,moveName){
  if(kind==='zombie')return 'zombie_bite';
  if(kind==='skeleton')return moveName.includes('โล่')?'skeleton_shield':'skeleton_cleave';
  if(kind==='spider')return 'spider_web';
  if(kind==='wraith')return 'wraith_drain';
  if(kind==='golem')return moveName.includes('เกราะ')?'golem_guard':'golem_quake';
  return moveName.includes('ดูด')?'necro_drain':'necro_curse';
}
function tone(from,to,length=.2,wave='triangle',volume=.1,delay=0){
  const rt=combatAudioRuntime();if(!rt)return;const {context:c,destination}=rt,t=c.currentTime+delay;
  const o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,to),t+length);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g).connect(destination);o.start(t);o.stop(t+length+.02);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();};
}
let noise;
function air(length=.3,low=300,high=2600,volume=.1){
  const rt=combatAudioRuntime();if(!rt)return;const {context:c,destination}=rt;
  if(!noise){noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;s.buffer=noise;s.loop=true;f.type='bandpass';f.Q.value=.7;f.frequency.setValueAtTime(low,t);f.frequency.exponentialRampToValueAtTime(high,t+length);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+length);s.connect(f).connect(g).connect(destination);s.start();s.stop(t+length+.02);active.add(s);s.onended=()=>{active.delete(s);s.disconnect();f.disconnect();g.disconnect();};
}
export function combatCue(kind,variant,stage){
  if(stage==='windup')cueEpoch++;
  if(!combatAudioRuntime())return;
  const metal=['attack','double_strike','smoke_blade','shield_bash','shield'].includes(variant)&&!['wizard','wraith','necromancer','spider','zombie','golem'].includes(kind);
  if(stage==='windup'){
    if(variant==='smoke_blade'){air(.4,1400,120,.09);sample('metal-ready',.16,1.12);}
    else if(variant==='magic-bolt'){tone(260,520,.38,'sine',.075);tone(390,780,.38,'triangle',.04);}
    else if(metal)sample('metal-ready',.22,kind==='knight'?.85:1.14);
    else if(variant==='fireball'){air(.5,120,1100,.12);tone(90,220,.5,'sawtooth',.055);}
    else if(variant==='frost_lance'){[520,780,1040].forEach((f,i)=>tone(f,f*1.3,.45,'sine',.055,i*.06));air(.45,2500,5000,.055);}
    else if(variant==='focus'){[220,330,440,660].forEach((f,i)=>tone(f,f,.55,'sine',.055,i*.09));}
    else if(variant==='guard')sample('metal-ready',.3,kind==='knight'?.8:1.1);
    else {air(.4,120,700,.075);tone(100,180,.4,'triangle',.07);}
  } else if(stage==='release') {
    if(variant==='magic-bolt'){tone(920,240,.18,'triangle',.11);air(.15,1800,3200,.06);}
    else if(metal){sample('blade-whoosh',.52,kind==='knight'?.8:1.2);if(variant==='smoke_blade')air(.22,800,120,.1);}
    else if(variant==='stone')sample('stone-impact',.45,.72);
    else air(.22,variant==='frost_lance'?3000:300,variant==='frost_lance'?5000:1600,.12);
  } else if(stage==='hit') {
    if(variant==='guard'||variant==='shield_bash'||variant==='shield'||variant==='iron_oath'){sample('metal-impact',.5,.86);tone(150,70,.3,'triangle',.15);}
    else if(variant==='stone'||kind==='golem'){sample('stone-impact',.62,.75);tone(70,28,.45,'sine',.2);}
    else if(variant==='magic-bolt'){tone(660,220,.28,'triangle',.11);tone(990,440,.23,'sine',.06);}
    else if(variant==='fireball'){air(.65,850,80,.22);tone(110,35,.5,'sine',.19);}
    else if(variant==='frost_lance'){sample('glass-impact',.6,1.3);[900,1250,1700].forEach((f,i)=>tone(f,f*.7,.22,'sine',.045,i*.04));}
    else if(variant==='curse'){tone(170,55,.65,'sawtooth',.09);tone(177,58,.65,'triangle',.07);air(.35,550,100,.075);}
    else if(variant==='web'||variant==='poison'){air(.4,1100,150,.13);tone(190,70,.28,'triangle',.09);}
    else if(metal){sample('metal-light',.4,1.1);sample('body-impact',.22,.85);}
    else if(variant==='focus'){tone(880,1320,.32,'sine',.1);}
    else {sample('body-impact',.45,.8);air(.16,500,120,.08);}
  }
}
