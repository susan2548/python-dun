let accountId;
export {toast} from './ui-dialog.js?v=1';
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const when=s=>s?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(s)):'ยังไม่ส่ง';
export function setAccount(id){accountId=id;}
export async function api(query='',data){
 let response;try{response=await fetch('/api/assessment'+query,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),...(data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,accountId})}:{})});}catch{throw Object.assign(Error('เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง'),{status:0});}
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'ทำรายการไม่สำเร็จ'),{status:response.status});return result;
}
export function errorBox(error){return `<div class="notice danger" role="alert">${esc(error.message||error)}${error.status===401?' · <a href="/game?return=/assessment#login">เข้าสู่ระบบอีกครั้ง</a>':''}</div>`;}
export function download(name,value,type='application/json'){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function downloadCsv(name,response){
 // Response.text() consumes a UTF-8 BOM. Preserve bytes so Excel detects Thai.
 const bytes=new Uint8Array(await response.arrayBuffer());
 const hasBom=bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf;
 download(name,new Blob(hasBom?[bytes]:[new Uint8Array([0xef,0xbb,0xbf]),bytes]),'text/csv;charset=utf-8');
}
export function localRead(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
export function localWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
let fieldSequence=0;
export function validateForm(form){
 form.querySelectorAll('.field-validation').forEach(el=>el.remove());
 let first;
 for(const input of form.querySelectorAll('input,select,textarea')){
  input.removeAttribute('aria-invalid');input.removeAttribute('aria-errormessage');
  if(input.disabled||input.validity.valid)continue;
  const label=input.labels?.[0],labelText=label&&[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
  if(labelText)input.setAttribute('aria-label',labelText);
  const message=document.createElement('small');message.className='field-validation';message.id='fieldError'+(++fieldSequence);
  message.textContent=input.validity.valueMissing?'กรอกข้อมูลช่องนี้ก่อน':input.validity.typeMismatch?'กรอกลิงก์ให้ถูกต้อง เช่น https://example.com':input.validity.tooShort?'กรอกอย่างน้อย '+input.minLength+' ตัวอักษร':'ตรวจข้อมูลและความยาวอีกครั้ง';
  input.after(message);input.setAttribute('aria-invalid','true');input.setAttribute('aria-errormessage',message.id);first||=input;
 }
 first?.focus();return !first;
}
