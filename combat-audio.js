import {combatAudioRuntime,duckMusic} from './audio-engine.js?v=4';
import {AUDIO_ROOT,VOICE_BANK,ACTOR_VOICES,FX_FILES,soundPlan,pickTake} from './combat-soundbank.js?v=2';
const cache=new Map(),active=new Set(),lastTake=new Map();
let voiceSource=null,voiceEpoch=0,sceneEpoch=0,cueEpoch=0,voicesOn=true,lastBark=-Infinity;
try{voicesOn=localStorage.getItem('dungeon-voices')!=='off';}catch{}
const stats={effects:0,voices:0,dropped:0,failures:0};
export function audioDiagnostics(){return {...stats,active:active.size,cached:cache.size};}
export async function loadCombatBuffer(id){
 const runtime=combatAudioRuntime();if(!runtime)return null;
 if(!cache.has(id))cache.set(id,fetch(AUDIO_ROOT+id+'.mp3').then(r=>{if(!r.ok)throw Error('Missing recording '+id);return r.arrayBuffer();}).then(b=>runtime.context.decodeAudioData(b)).catch(error=>{cache.delete(id);stats.failures++;console.warn('Combat recording unavailable',id,error.message);return null;}));
 return cache.get(id);
}
function playBuffer(b,{gain=.5,rate=1,voice=false,role='hero'}={}){
 const rt=combatAudioRuntime();if(!rt||!b)return null;
 // Keep short tails, cap effect overlap, and keep speech in one separate slot.
 const fx=[...active].filter(s=>s!==voiceSource);if(!voice&&fx.length>=8){try{fx[0].stop();}catch{}}
 const c=rt.context,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=gain;
 let pan;if(c.createStereoPanner){pan=c.createStereoPanner();pan.pan.value=role==='enemy'?.13:-.13;s.connect(g).connect(pan).connect(rt.destination);}else s.connect(g).connect(rt.destination);
 s.onended=()=>{active.delete(s);s.disconnect();g.disconnect();pan?.disconnect();if(voiceSource===s)voiceSource=null;};
 active.add(s);if(voice)voiceSource=s;s.start();return s;
}
export function stopBattleVoice(){voiceEpoch++;if(voiceSource){try{voiceSource.stop();}catch{}voiceSource=null;}document.querySelector('.battle-voice-caption')?.remove();}
function stopAll(){sceneEpoch++;cueEpoch++;stopBattleVoice();for(const s of active){try{s.stop();}catch{}}active.clear();}
window.addEventListener('dungeon-audio-state',e=>{if(e.detail.muted)stopAll();});
window.addEventListener('dungeon-audio-scene',stopAll);
export function voicesEnabled(){return voicesOn;}
export function setVoicesEnabled(value){voicesOn=Boolean(value);try{localStorage.setItem('dungeon-voices',value?'on':'off');}catch{}if(!value)stopBattleVoice();}
export async function preloadCombatAudio(kind){
 if(!combatAudioRuntime())return;
 const speech=(ACTOR_VOICES[kind]||[]).flatMap(key=>VOICE_BANK[key].pool);
 await Promise.all([...new Set([...FX_FILES,...speech])].map(loadCombatBuffer));
}
export async function playBattleVoice(id,role='hero',{chance=1}={}){
 const entry=VOICE_BANK[id];if(!entry||!voicesOn||!combatAudioRuntime()||Math.random()>chance)return;
 const bark=id.startsWith('attack_');if(bark&&performance.now()-lastBark<850)return;
 stopBattleVoice();const epoch=voiceEpoch,requested=performance.now(),take=pickTake(entry.pool,lastTake.get(id));lastTake.set(id,take);
 const b=await loadCombatBuffer(take);if(epoch!==voiceEpoch||!voicesOn||!combatAudioRuntime()||!b)return;
 if(performance.now()-requested>600){stats.dropped++;return;}
 const rate=entry.rate||1;
 // Brief normal efforts sit under the mix; only voiced skill/utility calls
 // duck music, avoiding a volume pump on every normal sword swing.
 if(entry.caption)duckMusic(b.duration/rate+.10);
 playBuffer(b,{gain:entry.gain??.82,rate,voice:true,role});stats.voices++;lastBark=performance.now();
 if(!entry.caption)return;
 const scene=document.querySelector('#scene');if(!scene)return;
 const caption=document.createElement('span');caption.className='battle-voice-caption voice-'+role;caption.textContent=entry.caption;caption.setAttribute('role','status');scene.append(caption);
 setTimeout(()=>caption.remove(),b.duration/rate*1000+100);
}
export function enemyVoice(kind,name){
 if(kind==='zombie')return 'zombie_bite';if(kind==='skeleton')return name.includes('โล่')?'skeleton_shield':'skeleton_cleave';if(kind==='spider')return 'spider_web';if(kind==='wraith')return 'wraith_drain';if(kind==='golem')return name.includes('เกราะ')?'golem_guard':'golem_quake';return name.includes('ดูด')?'necro_drain':'necro_curse';
}
export function combatCue(kind,variant,stage,options={}){
 if(stage==='windup'||stage==='cutin')cueEpoch++;
 if(!combatAudioRuntime())return;
 const epoch=sceneEpoch,cue=cueEpoch,requested=performance.now();
 for(const layer of soundPlan(kind,variant,stage,options)){
  const key=layer.pool.join('/'),id=pickTake(layer.pool,lastTake.get(key));lastTake.set(key,id);
  loadCombatBuffer(id).then(b=>{
   if(!b||epoch!==sceneEpoch||cue!==cueEpoch||!combatAudioRuntime())return;
   if(performance.now()-requested>300){stats.dropped++;return;}
   playBuffer(b,{gain:layer.gain,rate:layer.rate*(1+(Math.random()*2-1)*layer.spread),role:options.role||'hero'});stats.effects++;
  });
 }
}
