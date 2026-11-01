import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const live=[],made=[];
const gain=()=>({gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){return this;},disconnect(){}});
class Context {currentTime=0;destination={};createGain(){return gain();}createBufferSource(){return {connect(){return this;},disconnect(){},start(){},stop(){queueMicrotask(()=>this.onended?.());},playbackRate:{value:1}};}decodeAudioData(){return Promise.resolve({duration:.02});}resume(){return Promise.resolve();}}
class Media {constructor(src){this.src=src;this.dataset={};this.paused=true;made.push(this);}play(){this.paused=false;queueMicrotask(()=>this.onplaying?.());return Promise.resolve();}pause(){this.paused=true;}removeAttribute(name){if(name==='src')this.src='';}load(){}remove(){const i=live.indexOf(this);if(i>=0)live.splice(i,1);}}
globalThis.window=Object.assign(new EventTarget(),{AudioContext:Context});globalThis.Audio=Media;globalThis.document={querySelector(){return null;},body:{append(node){live.push(node);}}};
const {setMuted,switchTrack,currentTrackName}=await import('./audio-engine.js?v=6');
test('licensed menu recordings replace the synthesizer and preserve the original full loop',()=>{const entries=JSON.parse(readFileSync(new URL('./assets/audio/menu-music-v18.json',import.meta.url)));assert.equal(entries.length,2);assert.notEqual(entries[0].sourceSha256,entries[1].sourceSha256);for(const t of entries){const file=readFileSync(new URL('./assets/audio/'+t.file,import.meta.url));assert.equal(file.subarray(0,4).toString(),'OggS');assert(t.seconds>60);assert(t.bytes<3000000);assert(['CC0-1.0','CC-BY-3.0'].includes(t.license));assert(t.source.startsWith('https://opengameart.org/content/'));}});
test('one recording owns music across intro, map, rapid changes, old callbacks and mute',async()=>{await setMuted(false);assert.equal(live.length,1);const intro=live[0];assert.match(intro.src,/guild-overture/);assert.equal(intro.loop,true);assert.match(currentTrackName(),/symphony/);switchTrack('intro');assert.equal(live[0],intro,'roster rerender cannot restart the song');const lateFailure=intro.onerror;switchTrack('map');assert.equal(live.length,1);assert(intro.paused);assert.match(live[0].src,/atlas-exploration/);const map=live[0];lateFailure();assert.equal(live[0],map,'retired audio callback cannot revive an old song');for(let n=0;n<12;n++)switchTrack(n%2?'map':'intro');assert.equal(live.length,1);assert.match(live[0].src,/atlas-exploration/);switchTrack('floor0');assert.match(live[0].src,/ruins-battle/);assert.equal(live.length,1);await setMuted(true);assert.equal(live.length,0);assert(made.every(a=>a.paused));switchTrack('intro');assert.equal(live.length,0,'scene changes while muted do not start media');});


test('volume updates preserve track position and isolate music, effects and speech buses',async()=>{
 const {updateAudioSettings,isAudioAudible}=await import('./audio-preferences.js?v=1');
 const {combatAudioRuntime,duckMusic}=await import('./audio-engine.js?v=6');
 await setMuted(false);const song=live[0];song.currentTime=17;
 updateAudioSettings({master:100,music:100});const full=song.volume;
 updateAudioSettings({music:50});assert.equal(song.volume,full*.5);assert.equal(live[0],song);assert.equal(song.currentTime,17);
 updateAudioSettings({effectsOn:false,voicesOn:true,voices:100});assert(!isAudioAudible('effects'));assert(isAudioAudible('voices'));
 assert.notEqual(combatAudioRuntime().destination,combatAudioRuntime('voices').destination);
 assert.equal(combatAudioRuntime().destination.gain.value,0);assert.equal(combatAudioRuntime('voices').destination.gain.value,.7);
 updateAudioSettings({music:0});duckMusic(.01);await new Promise(resolve=>setTimeout(resolve,50));assert.equal(song.volume,0,'duck/fade callback must retain latest zero music level');
 updateAudioSettings({music:70,master:0});assert.equal(song.volume,0);assert(!isAudioAudible('voices'));
 await setMuted(true);assert.equal(live.length,0);
});

test('recorded samples honour isolated channels and cancel late playback after close',async()=>{
 const {updateAudioSettings}=await import('./audio-preferences.js?v=1');
 const {playAudioPreview,stopAudioPreview,audioDiagnostics}=await import('./combat-audio.js?v=7');
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
 try{
  updateAudioSettings({master:100,music:0,effectsOn:false,voicesOn:true,voices:100});await setMuted(false);
  assert.equal(await playAudioPreview('voices','adventurer'),true,'voices work with effects muted');
  updateAudioSettings({voices:25});assert.equal(audioDiagnostics().active,1,'adjusting speech with effects muted must not stop the speech sample');
  updateAudioSettings({voicesOn:false,effectsOn:true});await Promise.resolve();assert.equal(audioDiagnostics().active,0);
  assert.equal(await playAudioPreview('effects'),true,'effects work with voices muted');
  updateAudioSettings({effectsOn:false});await Promise.resolve();assert.equal(audioDiagnostics().active,0);
  let finish;globalThis.fetch=()=>new Promise(resolve=>finish=resolve);updateAudioSettings({voicesOn:true});
  const pending=playAudioPreview('voices','wizard');stopAudioPreview();finish({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
  assert.equal(await pending,false);assert.equal(audioDiagnostics().active,0);
 }finally{stopAudioPreview();await setMuted(true);globalThis.fetch=originalFetch;}
});

test('a rejected audio unlock can retry on the next gesture without losing music',async()=>{
 const {activateAudio}=await import('./audio-engine.js?v=6');
 const originalResume=Context.prototype.resume;let blocked=true;
 Context.prototype.resume=()=>blocked?Promise.reject(Error('autoplay blocked')):Promise.resolve();
 try{
  await assert.rejects(setMuted(false),/autoplay blocked/);assert.equal(live.length,0);
  blocked=false;assert.equal(await activateAudio(),true);assert.equal(live.length,1);
 }finally{Context.prototype.resume=originalResume;await setMuted(true);}
});
