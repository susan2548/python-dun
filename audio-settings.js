import {AUDIO_DEFAULTS,getAudioSettings,updateAudioSettings,subscribeAudioSettings,isAudioAudible} from './audio-preferences.js?v=1';
import {activateAudio,setMuted,currentTrackName} from './audio-engine.js?v=6';
import {playAudioPreview,stopAudioPreview} from './combat-audio.js?v=7';
const CHANNELS=[
 {id:'music',name:'ดนตรีประกอบฉาก',description:'เพลงหน้าแรก แผนที่ และการต่อสู้',icon:'♫'},
 {id:'effects',name:'เสียงเอฟเฟกต์',description:'อาวุธ เวทมนตร์ ไอเทม และผลการรันโค้ด',icon:'✧'},
 {id:'voices',name:'เสียงตัวละคร',description:'เสียงพูดและเสียงออกแรงของผู้เล่นกับมอนสเตอร์',icon:'◌'},
];
export function openAudioSettings({showModal,closeModal,classId='adventurer'}){
 let alive=true;const pending=new Set();
 const row=({id,name,description,icon},master=false)=>`<section class="audio-channel ${master?'audio-master':''}" aria-labelledby="audioLabel-${id}"><div class="audio-channel-heading"><span class="audio-channel-icon" aria-hidden="true">${icon}</span><div><h3 id="audioLabel-${id}">${name}</h3><p>${description}</p></div>${['effects','voices'].includes(id)?`<button type="button" class="audio-preview" data-preview="${id}" aria-label="ฟังตัวอย่าง${name}" title="ฟังตัวอย่าง${name}">▷ ลองเสียง</button>`:''}<label class="audio-switch"><input type="checkbox" id="audioToggle-${id}" aria-label="${master?'เปิดเสียงเกม':'เปิด'+name}"><span aria-hidden="true"></span></label></div><div class="audio-slider-line"><label class="audio-sr-only" for="audioLevel-${id}">ระดับ${master?'เสียงรวม':name}</label><input type="range" id="audioLevel-${id}" min="0" max="100" step="1"><output for="audioLevel-${id}" id="audioValue-${id}"></output></div></section>`;
 let unsubscribe=()=>{};
 showModal(`<div class="audio-settings-heading"><span class="eyebrow">THE GUILD • SOUND SETTINGS</span><h2>ตั้งค่าเสียง</h2><p>ปรับเสียงให้พอดีกับการผจญภัยของคุณ</p></div>${row({id:'master',name:'เสียงรวม',description:'ควบคุมความดังทั้งหมดของเกม',icon:'◈'},true)}<p class="audio-global-note" id="audioGlobalNote"></p><div class="audio-channel-list">${CHANNELS.map(c=>row(c)).join('')}</div><div class="audio-settings-footer"><p id="audioSettingsStatus" role="status">บันทึกอัตโนมัติบนเครื่องนี้</p><div class="modal-actions"><button type="button" class="btn ghost small" id="audioReset">คืนค่าระดับเสียง</button><button type="button" class="btn" id="audioDone">เสร็จสิ้น</button></div></div>`,{onClose:()=>{alive=false;unsubscribe();stopAudioPreview();}});
 const dialog=document.querySelector('.modal-backdrop .modal');dialog.classList.add('audio-settings-modal');
 const $=selector=>dialog.querySelector(selector);
 function paint(){
  if(!alive)return;const state=getAudioSettings();
  for(const id of ['master',...CHANNELS.map(c=>c.id)]){
   const enabled=id==='master'?state.enabled:state[id+'On'],range=$('#audioLevel-'+id);
   $('#audioToggle-'+id).checked=enabled;range.value=state[id];range.setAttribute('aria-valuetext',state[id]+' เปอร์เซ็นต์');range.style.setProperty('--audio-fill',state[id]+'%');
   $('#audioValue-'+id).value=state[id]+'%';range.closest('.audio-channel').classList.toggle('channel-muted',!enabled||state[id]===0);
  }
  $('#audioGlobalNote').textContent=!state.enabled?'เสียงเกมปิดอยู่ • เปิดสวิตช์เสียงรวมเพื่อฟัง':state.master===0?'ระดับเสียงรวมอยู่ที่ 0% • เพิ่มระดับเพื่อฟัง':'เพลงฉากปัจจุบัน: '+currentTrackName();
  for(const button of dialog.querySelectorAll('[data-preview]'))button.disabled=!isAudioAudible(button.dataset.preview)||pending.has(button.dataset.preview);
 }
 unsubscribe=subscribeAudioSettings(paint);paint();
 for(const id of ['master',...CHANNELS.map(c=>c.id)]){
  $('#audioToggle-'+id).onchange=async event=>{
   try{if(id==='master')await setMuted(!event.target.checked);else updateAudioSettings({[id+'On']:event.target.checked});$('#audioSettingsStatus').textContent='จำค่าเสียงบนเครื่องนี้แล้ว';}
   catch{$('#audioSettingsStatus').textContent='ยังเปิดเสียงไม่ได้ ลองเปิดสวิตช์อีกครั้ง';}paint();
  };
  $('#audioLevel-'+id).oninput=event=>{updateAudioSettings({[id]:Number(event.target.value)});$('#audioSettingsStatus').textContent='จำค่าเสียงบนเครื่องนี้แล้ว';};
 }
 for(const button of dialog.querySelectorAll('[data-preview]'))button.onclick=async()=>{
  const channel=button.dataset.preview;pending.add(channel);paint();$('#audioSettingsStatus').textContent='กำลังเตรียมเสียงตัวอย่าง…';
  try{await activateAudio();const played=await playAudioPreview(channel,classId);if(alive)$('#audioSettingsStatus').textContent=played?'กำลังเล่นเสียงตัวอย่างตามระดับที่เลือก':'ยังเล่นเสียงตัวอย่างไม่ได้ ลองอีกครั้ง';}
  catch{if(alive)$('#audioSettingsStatus').textContent='โหลดเสียงตัวอย่างไม่ได้ ลองอีกครั้ง';}
  finally{pending.delete(channel);paint();}
 };
 $('#audioReset').onclick=()=>{updateAudioSettings({...AUDIO_DEFAULTS,enabled:getAudioSettings().enabled});$('#audioSettingsStatus').textContent='คืนค่าระดับเสียงแล้ว • สวิตช์เสียงรวมยังคงเดิม';};
 $('#audioDone').onclick=closeModal;
 if(getAudioSettings().enabled)activateAudio().catch(()=>{if(alive)$('#audioSettingsStatus').textContent='เปิดสวิตช์เสียงรวมอีกครั้งเพื่อเริ่มเสียง';});
}
