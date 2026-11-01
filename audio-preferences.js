export const AUDIO_SETTINGS_KEY='dungeon-audio-settings-v1';
export const AUDIO_DEFAULTS=Object.freeze({enabled:false,master:80,music:70,effects:80,voices:90,musicOn:true,effectsOn:true,voicesOn:true});
const toggles=['enabled','musicOn','effectsOn','voicesOn'],volumes=['master','music','effects','voices'];
export function normalizeAudioSettings(value={}){
 const next={...AUDIO_DEFAULTS};
 for(const key of toggles)if(typeof value?.[key]==='boolean')next[key]=value[key];
 for(const key of volumes)if(typeof value?.[key]==='number'&&Number.isFinite(value[key]))next[key]=Math.round(Math.max(0,Math.min(100,value[key])));
 return next;
}
function readSettings(){try{const raw=localStorage.getItem(AUDIO_SETTINGS_KEY);return normalizeAudioSettings(raw?JSON.parse(raw):{voicesOn:localStorage.getItem('dungeon-voices')!=='off'});}catch{return {...AUDIO_DEFAULTS};}}
let settings=readSettings();const listeners=new Set();
export const getAudioSettings=()=>({...settings});
export function updateAudioSettings(patch){
 const previous=settings;settings=normalizeAudioSettings({...settings,...patch});
 try{localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify(settings));}catch{}
 for(const listener of listeners)listener(getAudioSettings(),previous);
 return getAudioSettings();
}
export const subscribeAudioSettings=listener=>{listeners.add(listener);return ()=>listeners.delete(listener);};
export function channelGain(channel,state=settings){return (channel==='master'?state.enabled:state[channel+'On'])?state[channel]/100:0;}
export const isAudioAudible=channel=>channelGain('master')>0&&channelGain(channel)>0;
if(typeof window!=='undefined')window.addEventListener('storage',event=>{
 if(event.key!==AUDIO_SETTINGS_KEY&&event.key!==null)return;
 const previous=settings;settings=readSettings();for(const listener of listeners)listener(getAudioSettings(),previous);
});
