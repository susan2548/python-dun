import {fail} from './http.mjs';
const roles=['adventurer','knight','wizard'];
export function nickname(value){
  if(typeof value!=='string')throw fail(400,'กรอกชื่อในเกม');
  const text=value.normalize('NFC').trim();
  if(text.length<2||text.length>24||/[<>@\p{Cc}\p{Cf}]/u.test(text))throw fail(400,'ชื่อในเกมต้องยาว 2–24 ตัวอักษร และไม่มีอีเมลหรือเครื่องหมาย < >');
  return text;
}
export function validateSave(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value).length>170000)throw fail(400,'ข้อมูลเซฟไม่ถูกต้อง');
  if(value.campaignVersion!==2||!(value.classId===null||roles.includes(value.classId)))throw fail(400,'รุ่นเซฟหรืออาชีพไม่ถูกต้อง');
  if(!Array.isArray(value.stars)||value.stars.length!==12||!value.stars.every(s=>Number.isInteger(s)&&s>=0&&s<=3))throw fail(400,'ข้อมูลดาวไม่ถูกต้อง');
  for(const key of ['gold','potions','manaPotions','attackBonus','hpBonus'])if(!Number.isSafeInteger(value[key])||value[key]<0||value[key]>1000000)throw fail(400,'ข้อมูลทรัพยากรไม่ถูกต้อง');
  const cleared=value.stars.findIndex(s=>s===0);
  if(value.cleared!==(cleared<0?12:cleared))throw fail(400,'ความคืบหน้าไม่ตรงกับด่านที่ผ่าน');
  if(value.activeBattle){const b=value.activeBattle;if(!Number.isInteger(b.level)||b.level<0||b.level>11||!Number.isFinite(b.hp)||!Number.isFinite(b.mp)||b.hp<0||b.mp<0)throw fail(400,'ข้อมูลการต่อสู้ไม่ถูกต้อง');}
  // Exclude accidental browser/account fields. Identity always comes from the session.
  if(value.runId!==undefined&&!/^[-a-f0-9]{36}$/i.test(value.runId))throw fail(400,'หมายเลขรอบไม่ถูกต้อง');
  if(value.playTimeMs!==undefined&&(!Number.isSafeInteger(value.playTimeMs)||value.playTimeMs<0||value.playTimeMs>315360000000))throw fail(400,'เวลาเล่นไม่ถูกต้อง');
  if(value.timingVersion!==undefined&&![0,1].includes(value.timingVersion))throw fail(400,'รุ่นเวลาไม่ถูกต้อง');
  const keys=['classId','cleared','stars','campaignVersion','balanceVersion','gold','potions','manaPotions','expedition','activeBattle','attackBonus','hpBonus','questionDecks','runId','shopStock','shopTier','playTimeMs','timingVersion'];
  return Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
}
export function validateClears(values){
  if(!Array.isArray(values)||values.length>24)throw fail(400,'รายการผลการเล่นไม่ถูกต้อง');
  return values.map(v=>{
    if(!v||!/^[-a-f0-9]{36}$/i.test(v.id)||!Number.isInteger(v.floor)||v.floor<0||v.floor>11||!roles.includes(v.classId)||!Number.isSafeInteger(v.answers)||v.answers<3||v.answers>10000||!Number.isSafeInteger(v.mistakes)||v.mistakes<0||v.mistakes>100000||v.enemyHp!==0)throw fail(400,'ผลการผ่านด่านไม่ครบตามเงื่อนไข');
    const stars=v.mistakes===0?3:v.mistakes<=2?2:1;
    // A queued victory precedes a possible New Game snapshot. Its historical
    // grade remains valid even when the current run's stars have been reset.
    if(v.runId!==undefined&&!/^[-a-f0-9]{36}$/i.test(v.runId))throw fail(400,'รอบของผลการเล่นไม่ถูกต้อง');
    if(v.elapsedMs!==undefined&&(!Number.isSafeInteger(v.elapsedMs)||v.elapsedMs<0||v.elapsedMs>315360000000))throw fail(400,'เวลาของผลการเล่นไม่ถูกต้อง');
    return {id:v.id,floor:v.floor,classId:v.classId,stars,answers:v.answers,mistakes:v.mistakes,...(v.runId?{runId:v.runId,elapsedMs:v.elapsedMs??0,timed:v.timed===true&&v.elapsedMs>0}:{})};
  });
}
