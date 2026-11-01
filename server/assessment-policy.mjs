import {fail} from './http.mjs';
export function uuid(value){if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value))throw fail(400,'หมายเลขรายการไม่ถูกต้อง');return value;}
export function revision(value){if(!Number.isSafeInteger(value)||value<0)throw fail(400,'รุ่นข้อมูลไม่ถูกต้อง');return value;}
export function text(value,label,min=1,max=80){if(typeof value!=='string')throw fail(400,'กรอก'+label);const t=value.normalize('NFC').trim();if(t.length<min||t.length>max||/[<>\p{Cc}\p{Cf}]/u.test(t))throw fail(400,label+'ต้องยาว '+min+'–'+max+' ตัวอักษร');return t;}
export function mediaUrl(value){if(!value)return '';try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw Error();return u.href;}catch{throw fail(400,'ลิงก์สื่อการสอนต้องขึ้นต้นด้วย https://');}}
export function csvCell(value){let s=String(value??'');if(typeof value!=='number'&&/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export const stamp=value=>value?new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(value)):'';
