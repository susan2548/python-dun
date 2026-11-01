import test from 'node:test';
import assert from 'node:assert/strict';
import {MAIN_SITE,authErrorMessage,needsMainSite} from './auth-feedback.js';
test('a forbidden deployment is not reported as a wrong password',()=>{
 const error={status:403,code:'feature_not_supported'};
 assert.ok(needsMainSite(error));assert.match(authErrorMessage(error),/403/);assert.match(authErrorMessage(error),/เปิดเว็บหลัก/);
 assert.ok(!authErrorMessage(error).includes('รหัสผ่านไม่ถูกต้อง'));assert.equal(MAIN_SITE,'https://python-dungeon-live.vercel.app');
});
test('credential rejection remains generic without exposing email existence',()=>{
 assert.match(authErrorMessage({status:401,code:'invalid_credentials'}),/อีเมลหรือรหัสผ่านไม่ถูกต้อง/);
 assert.equal(needsMainSite({status:401}),false);
});
test('rate limits, verification, outages and network errors have different recovery instructions',()=>{
 assert.match(authErrorMessage({status:429}),/รอสักครู่/);assert.match(authErrorMessage({status:503}),/ขัดข้องชั่วคราว/);
 assert.match(authErrorMessage(new TypeError('Failed to fetch')),/การเชื่อมต่อ/);
 assert.match(authErrorMessage({status:403,code:'email_not_confirmed'}),/ยืนยันอีเมล/);
 assert.equal(needsMainSite({status:403,code:'email_not_confirmed'}),false);
});
test('provider details and submitted values never appear in public auth errors',()=>{
 for(const status of [0,401,403,429,500,503])assert.ok(!authErrorMessage({status,message:'PRIVATE_PASSWORD_OR_SESSION_TOKEN',body:{secret:'PRIVATE_VALUE'}}).includes('PRIVATE_'));
 assert.match(authErrorMessage({status:400},'reset'),/รหัสยืนยัน/);assert.match(authErrorMessage({status:409},'register'),/สร้างบัญชี/);
});
