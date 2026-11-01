import test from 'node:test';
import assert from 'node:assert/strict';
const storage=new Map([['dungeon-voices','off']]);
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
globalThis.window=new EventTarget();
const prefs=await import('./audio-preferences.js');
test('new audio preferences retain legacy voice mute and persist independent levels across reload',async()=>{
 assert.equal(prefs.getAudioSettings().voicesOn,false);assert.equal(prefs.getAudioSettings().enabled,false);
 prefs.updateAudioSettings({enabled:true,master:55,music:15,effectsOn:false,voicesOn:true,voices:76});
 const reload=await import('./audio-preferences.js?reload');assert.deepEqual(reload.getAudioSettings(),prefs.getAudioSettings());
 assert.equal(prefs.channelGain('music'),.15);assert.equal(prefs.channelGain('effects'),0);assert(prefs.isAudioAudible('voices'));
 prefs.updateAudioSettings({voicesOn:false});assert.equal(prefs.getAudioSettings().voices,76,'mute retains chosen level');
 prefs.updateAudioSettings({voicesOn:true});assert.equal(prefs.getAudioSettings().voices,76);
});
test('invalid persisted levels are safe and cross-tab updates notify without rewriting saves',()=>{
 assert.deepEqual(prefs.normalizeAudioSettings(null),prefs.AUDIO_DEFAULTS);
 assert.equal(prefs.normalizeAudioSettings({master:999}).master,100);assert.equal(prefs.normalizeAudioSettings({music:-1}).music,0);
 assert.equal(prefs.normalizeAudioSettings({effects:NaN}).effects,prefs.AUDIO_DEFAULTS.effects);
 let calls=0;const unsubscribe=prefs.subscribeAudioSettings(()=>calls++);
 storage.set(prefs.AUDIO_SETTINGS_KEY,JSON.stringify({...prefs.AUDIO_DEFAULTS,music:23,enabled:true}));
 const event=new Event('storage');event.key=prefs.AUDIO_SETTINGS_KEY;window.dispatchEvent(event);
 assert.equal(prefs.getAudioSettings().music,23);assert.equal(calls,1);unsubscribe();
 storage.set(prefs.AUDIO_SETTINGS_KEY,'bad JSON');window.dispatchEvent(event);assert.deepEqual(prefs.getAudioSettings(),prefs.AUDIO_DEFAULTS);
});
