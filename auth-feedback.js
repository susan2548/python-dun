export const MAIN_SITE='https://python-dungeon-live.vercel.app';
const statusOf=error=>Number(error?.status??error?.statusCode)||0;
const codeOf=error=>String(error?.code||'').toLowerCase();
export function needsMainSite(error){return statusOf(error)===403&&codeOf(error)!=='email_not_confirmed';}
// Fixed public copy only; do not expose provider details or submitted values.
export function authErrorMessage(error,mode='login'){
 const status=statusOf(error),code=codeOf(error);
 if(code==='email_not_confirmed')return 'กรุณายืนยันอีเมลตามขั้นตอนของระบบก่อนเข้าสู่ระบบ';
 if(status===429)return 'ลองเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่ (429)';
 if(needsMainSite(error))return 'การยืนยันบัญชีบนหน้าเว็บนี้ถูกปฏิเสธ กรุณากด “เปิดเว็บหลัก” ด้านล่างแล้วลองใหม่ (403)';
 if(status>=500)return 'ระบบยืนยันบัญชีขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง โดยยังไม่ต้องเปลี่ยนรหัสผ่าน';
 if(mode==='reset')return 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาส่งรหัสใหม่แล้วลองอีกครั้ง';
 if(mode==='register')return 'สร้างบัญชีไม่สำเร็จ อีเมลอาจถูกใช้แล้ว ลองเข้าสู่ระบบหรือกู้รหัสผ่าน';
 if(status===401||code==='invalid_credentials')return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่';
 return 'ยังติดต่อระบบบัญชีไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง';
}
