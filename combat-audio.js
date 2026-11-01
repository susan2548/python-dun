import {combatAudioRuntime,duckMusic} from './audio-engine.js?v=6';
import {getAudioSettings,updateAudioSettings,subscribeAudioSettings,isAudioAudible} from './audio-preferences.js?v=1';
import {AUDIO_ROOT,VOICE_BANK,ACTOR_VOICES,FX_FILES,RUN_FEEDBACK,soundPlan,pickTake} from './combat-soundbank.js?v=4';
const cache=new Map(),active=new Set(),lastTake=new Map();
let voiceSource=null,voiceEpoch=0,sceneEpoch=0,cueEpoch=0,effectsEpoch=0,lastBark=-Infinity,previewEpoch=0,previewSource=null,previewChannel=null;
const stats={effects:0,voices:0,dropped:0,failures:0,runAccepted:0,runRejected:0};
const reversedBuffers=new WeakMap();
export function audioDiagnostics(){return {...stats,active:active.size,cached:cache.size};}
export async function loadCombatBuffer(id){
 const runtime=combatAudioRuntime();if(!runtime)return null;
 if(!cache.has(id))cache.set(id,fetch(AUDIO_ROOT+id+'.mp3').then(r=>{if(!r.ok)throw Error('Missing recording '+id);return r.arrayBuffer();}).then(b=>runtime.context.decodeAudioData(b)).catch(error=>{cache.delete(id);stats.failures++;console.warn('Combat recording unavailable',id,error.message);return null;}));
 return cache.get(id);
}
function playBuffer(b,{gain=.5,rate=1,voice=false,role='hero',delay=0,reverse=false}={}){
 const channel=voice?'voices':'effects',rt=combatAudioRuntime(channel);if(!rt||!b||!isAudioAudible(channel))return null;
 // Keep short tails, cap effect overlap, and keep speech in one separate slot.
 const fx=[...active].filter(s=>s!==voiceSource);if(!voice&&fx.length>=8){try{fx[0].stop();}catch{}}
 const c=rt.context,s=c.createBufferSource(),g=c.createGain();
 if(reverse){if(!reversedBuffers.has(b)){const copy=c.createBuffer(b.numberOfChannels,b.length,b.sampleRate);for(let i=0;i<b.numberOfChannels;i++)copy.getChannelData(i).set(b.getChannelData(i).slice().reverse());reversedBuffers.set(b,copy);}b=reversedBuffers.get(b);}
 s.buffer=b;s.playbackRate.value=rate;g.gain.value=gain;
 let pan;if(c.createStereoPanner){pan=c.createStereoPanner();pan.pan.value=role==='enemy'?.13:-.13;s.connect(g).connect(pan).connect(rt.destination);}else s.connect(g).connect(rt.destination);
 s.onended=()=>{active.delete(s);s.disconnect();g.disconnect();pan?.disconnect();if(voiceSource===s)voiceSource=null;};
 active.add(s);if(voice)voiceSource=s;s.start(c.currentTime+delay);return s;
}
export function stopBattleVoice(){voiceEpoch++;if(voiceSource){try{voiceSource.stop();}catch{}voiceSource=null;}document.querySelector('.battle-voice-caption')?.remove();}
function stopAll(){sceneEpoch++;cueEpoch++;stopAudioPreview();stopBattleVoice();for(const s of active){try{s.stop();}catch{}}active.clear();}
window.addEventListener('dungeon-audio-state',e=>{if(e.detail.muted)stopAll();});
window.addEventListener('dungeon-audio-scene',stopAll);
export function voicesEnabled(){const s=getAudioSettings();return s.voicesOn&&s.voices>0;}
export function setVoicesEnabled(value){updateAudioSettings({voicesOn:Boolean(value)});}
subscribeAudioSettings((state,previous)=>{
 if(!state.enabled||state.master===0){stopAll();return;}
 if((previous.voicesOn&&!state.voicesOn)||(previous.voices>0&&state.voices===0)){if(previewChannel==='voices')stopAudioPreview();stopBattleVoice();}
 if((previous.effectsOn&&!state.effectsOn)||(previous.effects>0&&state.effects===0)){effectsEpoch++;cueEpoch++;if(previewChannel==='effects')stopAudioPreview();for(const source of active)if(source!==voiceSource){try{source.stop();}catch{}}}
});
export function stopAudioPreview(){previewEpoch++;previewChannel=null;if(previewSource){try{previewSource.stop();}catch{}previewSource=null;}}
export async function playAudioPreview(channel,classId='adventurer'){
 stopAudioPreview();if(!isAudioAudible(channel)||!combatAudioRuntime())return false;
 previewChannel=channel;
 const epoch=previewEpoch,voice=channel==='voices',entry=VOICE_BANK['attack_'+classId]||VOICE_BANK.attack_adventurer;
 const b=await loadCombatBuffer(voice?entry.pool[0]:'charge');
 if(epoch!==previewEpoch||!isAudioAudible(channel)||!b)return false;
 if(voice){stopBattleVoice();duckMusic(b.duration+.1);}
 previewSource=playBuffer(b,{gain:voice?(entry.gain??.65):.44,voice,rate:1});return !!previewSource;
}
export async function preloadCombatAudio(kind){
 if(!combatAudioRuntime())return;
 const speech=(ACTOR_VOICES[kind]||[]).flatMap(key=>VOICE_BANK[key].pool);
 await Promise.all([...new Set([...FX_FILES,...speech])].map(loadCombatBuffer));
}
export async function playBattleVoice(id,role='hero',{chance=1}={}){
 const entry=VOICE_BANK[id];if(!entry||!voicesEnabled()||!isAudioAudible('voices')||!combatAudioRuntime()||Math.random()>chance)return;
 const bark=id.startsWith('attack_');if(bark&&performance.now()-lastBark<850)return;
 stopBattleVoice();const epoch=voiceEpoch,requested=performance.now(),take=pickTake(entry.pool,lastTake.get(id));lastTake.set(id,take);
 const b=await loadCombatBuffer(take);if(epoch!==voiceEpoch||!voicesEnabled()||!isAudioAudible('voices')||!combatAudioRuntime()||!b)return;
 if(performance.now()-requested>600){stats.dropped++;return;}
 const rate=entry.rate||1;
 // Brief normal efforts sit under the mix; only voiced skill/utility calls
 // duck music, avoiding a volume pump on every normal sword swing.
 if(entry.caption)duckMusic(b.duration/rate+.10);
 playBuffer(b,{gain:entry.gain??.82,rate,voice:true,role});stats.voices++;lastBark=performance.now();
 if(!entry.caption)return b.duration/rate;
 const scene=document.querySelector('#scene');if(!scene)return;
 const caption=document.createElement('span');caption.className='battle-voice-caption voice-'+role;caption.textContent=entry.caption;caption.setAttribute('role','status');scene.append(caption);
 setTimeout(()=>caption.remove(),b.duration/rate*1000+100);
 return b.duration/rate;
}
// Validation owns this cue: never celebrate before Python, action mode and MP
// checks pass. These recorded effects bypass the separate character-voice switch.
export async function playRunFeedback(accepted){
 if(!combatAudioRuntime()||!isAudioAudible('effects'))return;
 const epoch=sceneEpoch,audioEpoch=effectsEpoch,requested=performance.now(),plan=RUN_FEEDBACK[accepted?'accepted':'rejected'];
 const buffers=await Promise.all(plan.map(l=>loadCombatBuffer(l.id)));
 if(epoch!==sceneEpoch||audioEpoch!==effectsEpoch||!combatAudioRuntime()||!isAudioAudible('effects')||performance.now()-requested>500)return;
 let duration=0,played=false;
 plan.forEach((layer,i)=>{const b=buffers[i];if(!b)return;playBuffer(b,layer);stats.effects++;played=true;duration=Math.max(duration,layer.delay+b.duration/layer.rate);});
 if(played){stats[accepted?'runAccepted':'runRejected']++;await new Promise(resolve=>setTimeout(resolve,Math.min(1100,duration*1000+30)));}
}
export function enemyVoice(kind,name){
 if(kind==='zombie')return 'zombie_bite';if(kind==='skeleton')return name.includes('โล่')?'skeleton_shield':'skeleton_cleave';if(kind==='spider')return 'spider_web';if(kind==='wraith')return 'wraith_drain';if(kind==='golem')return name.includes('เกราะ')?'golem_guard':'golem_quake';return name.includes('ดูด')?'necro_drain':'necro_curse';
}
export function combatCue(kind,variant,stage,options={}){
 if(stage==='windup'||stage==='cutin')cueEpoch++;
 if(!combatAudioRuntime()||!isAudioAudible('effects'))return;
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
