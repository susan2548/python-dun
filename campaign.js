// One room teaches one topic or a small, related topic family.
export const CAMPAIGN_VERSION=2;
export const LEVELS=[
 {name:'บ่อน้ำผลึก',topic:'ตัวแปรและค่าตัวเลข',lesson:'ตั้งชื่อตัวแปร เก็บค่า และเปลี่ยนค่าก่อนนำไปใช้',groups:[3],kind:'slime',enemy:'สไลม์แกนผลึก',scene:'crystal-well',hp:62,atk:12,skill:'เมือกกัดกร่อน',icon:'poison',description:'เทิร์นคู่พ่นกรด • พิษ 45% นาน 2 เทิร์น ครั้งละ 3 HP',music:0},
 {name:'ประตูเสียงสะท้อน',topic:'print() และคอมเมนต์',lesson:'แสดงผลตามลำดับ และอธิบายโค้ดด้วยคอมเมนต์',groups:[0,1,2],kind:'zombie',enemy:'ซอมบี้ผู้เฝ้าประตู',scene:'entrance',hp:70,atk:13,skill:'กัดแพร่เชื้อ',icon:'poison',description:'เทิร์นคู่กัดหนักขึ้น • พิษ 60% นาน 2 เทิร์น ครั้งละ 4 HP',music:0},
 {name:'คลังสมบัติลวงตา',topic:'สตริงและตัวดำเนินการ',lesson:'เก็บข้อความ ต่อสตริง และคำนวณจากตัวแปร',groups:[4,5],kind:'mimic',enemy:'หีบมิมิคจอมลวง',scene:'treasure-vault',hp:82,atk:14,skill:'เหรียญลวงตา',icon:'blind',description:'เทิร์นคู่พ่นเหรียญลวง • ตาพร่า 65% นาน 2 เทิร์น ลดความแม่นยำ 25%',music:1},
 {name:'สุสานแห่งรายการ',topic:'list — รายการข้อมูล',lesson:'สร้าง list อ่านดัชนี และแก้ไขสมาชิก',groups:[6],kind:'spider',enemy:'แมงมุมพิษ',scene:'crypt',hp:94,atk:15,skill:'ใยพิษพันธนาการ',icon:'web',description:'เทิร์นคู่พ่นใย • พิษ 65% / ติดใย 70% / ตาพร่า 40% นาน 2 เทิร์น',music:2},
 {name:'วิหารแมลงทอง',topic:'tuple และ set',lesson:'แยกข้อมูลลำดับคงที่ออกจากชุดข้อมูลไม่ซ้ำ',groups:[7,8],kind:'scarab',enemy:'ด้วงตราผนึก',scene:'scarab-sanctum',hp:106,atk:16,skill:'พายุทรายทอง',icon:'stone',description:'เทิร์นคู่กางเกราะลดดาเมจครั้งถัดไป 45% และทรายบังตา 50% นาน 1 เทิร์น',music:1,bleedImmune:true},
 {name:'โถงสองทาง',topic:'if / elif / else — เงื่อนไข',lesson:'ตรวจเงื่อนไขและเลือกแขนงที่ควรทำงาน',groups:[9],kind:'skeleton',enemy:'โครงกระดูกพิทักษ์ทาง',scene:'hall',hp:120,atk:17,skill:'โล่กระดูก / ดาบสะบั้น',icon:'shield',description:'เทิร์นคู่ตั้งเกราะ 45% • เทิร์นคี่หลังจากนั้นฟันหนัก +8 • ไม่ติดเลือดไหล',music:1,bleedImmune:true},
 {name:'หอระฆังวนกาล',topic:'for — วนซ้ำตามจำนวน',lesson:'วนสมาชิกหรือ range() แล้วสะสมผลก่อนโจมตี',groups:[10],kind:'bat',enemy:'ค้างคาวระฆังรัตติกาล',scene:'bell-tower',hp:134,atk:18,skill:'คลื่นเสียงกรีดวิญญาณ',icon:'curse',description:'เทิร์นคู่กรีดคลื่นเสียง • ตาพร่า 55% นาน 2 เทิร์น และดูด 1 MP เมื่อโจมตีโดน',music:3},
 {name:'ถ้ำกาลไม่สิ้น',topic:'while — วนซ้ำตามเงื่อนไข',lesson:'เปลี่ยนค่าทุกครั้งและกำหนดจุดหยุดลูป',groups:[11],kind:'wraith',enemy:'ภูตเงาผู้วนเวียน',scene:'cavern',hp:150,atk:19,skill:'ดูดมานาและวิญญาณ',icon:'curse',description:'เทิร์นคู่ดูด 2 MP และฟื้นตัวเอง 8 HP เมื่อโจมตีโดน',music:3},
 {name:'ลานหิมะคาถา',topic:'ฟังก์ชันและพารามิเตอร์',lesson:'ประกาศ def รับค่า และ return ผลจากข้อมูลที่ส่งเข้าไป',groups:[12,13],kind:'icewolf',enemy:'หมาป่าเขี้ยวเหมันต์',scene:'frost-court',hp:167,atk:20,skill:'ลมหายใจเยือกแข็ง',icon:'frost',description:'เทิร์นคู่พ่นน้ำแข็ง • เยือกแข็ง 65% นาน 2 เทิร์น ลดพลังโจมตี 25%',music:4},
 {name:'หอสมุดโมดูล',topic:'โมดูล math',lesson:'import math และเรียกฟังก์ชันด้วยชื่อโมดูล',groups:[14],kind:'golem',enemy:'โกเลมผู้รักษาคัมภีร์',scene:'library',hp:185,atk:22,skill:'สะสมพลัง / แผ่นดินแยก',icon:'stone',description:'เทิร์นคี่ตั้งเกราะ • เทิร์นคู่ทุบหนัก +12 • ไม่เลือดไหล และติดไฟยากขึ้น',music:4,bleedImmune:true,burnResistance:.6},
 {name:'โรงหล่อจักรกล',topic:'class, object และเมธอด',lesson:'สร้างคลาส แยกสถานะของ object และเรียกเมธอดผ่าน self',groups:[15,16],kind:'sentinel',enemy:'เซนทิเนลตาจักรกล',scene:'clockwork-forge',hp:208,atk:24,skill:'ลำแสงแกนกลาง',icon:'fireball',description:'เทิร์นคู่ยิงลำแสง • เผาไหม้ 50% นาน 2 เทิร์น ครั้งละ 4 HP • ไม่เลือดไหล',music:4,bleedImmune:true},
 {name:'บัลลังก์ข้อผิดพลาด',topic:'try / except — รับมือข้อผิดพลาด',lesson:'ทดลองคำสั่งที่ผิดและดักชนิดข้อผิดพลาดให้ตรง',groups:[17],kind:'necromancer',enemy:'เนโครแมนเซอร์',scene:'throne',hp:235,atk:26,skill:'คำสาปมรณะ',icon:'curse',description:'สลับดูด 2 MP กับคำสาป +10 ดาเมจ • พิษ 55% นาน 2 เทิร์น',music:5},
];
export const TOPIC_TO_FLOOR=Object.fromEntries(LEVELS.flatMap((l,i)=>l.groups.map(g=>[g,i])));
export function countCleared(save){return save.stars.filter(n=>n>0).length;}
export function updateFrontier(save){save.cleared=save.stars.findIndex(n=>!n);if(save.cleared<0)save.cleared=LEVELS.length;return save.cleared;}
export function nextFloorAfterClear(save,index){
 if(index<LEVELS.length-1&&index<save.cleared)return index+1;
 return save.cleared<LEVELS.length?save.cleared:null;
}
export function migrateCampaign(save){
 if(save.campaignVersion===CAMPAIGN_VERSION)return false;
 const oldCleared=Math.max(0,Math.min(6,Number(save.cleared)||0)),oldStars=save.stars||[],stars=Array(LEVELS.length).fill(0);
 for(let f=0;f<oldCleared;f++)for(let g=0;g<3;g++){const i=TOPIC_TO_FLOOR[f*3+g];stars[i]=Math.max(stars[i],oldStars[f]||1);}
 const b=save.activeBattle;
 if(b&&Number.isInteger(b.level)&&b.level>=0&&b.level<6){
  const oldFloor=b.level,oldPhase=b.phase||0,topic=oldFloor*3+oldPhase%3,level=TOPIC_TO_FLOOR[topic];
  // Keep the exact unfinished legacy prompt. New questions follow this room's topic.
  b.migratedLegacyChallenge=topic+1;b.level=level;b.phase=0;b.answeredQuestions=0;b.rune='';b.code='';
  b.enemyHp=Math.max(1,Math.round((b.enemyHp/(b.maxEnemyHp||b.enemyHp||1))*LEVELS[level].hp));b.maxEnemyHp=LEVELS[level].hp;
  delete b.question;
 }
 save.stars=stars;delete save.questionDecks;save.campaignVersion=CAMPAIGN_VERSION;updateFrontier(save);return true;
}
