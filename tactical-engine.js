// Turn rules have no DOM or audio dependencies. RNG state is part of the save.
import {LEVELS} from './campaign.js?v=1';
export const SKILLS = {
  adventurer: [
    {id:'double_strike',name:'ฟันสองจังหวะ',mp:3,cd:2,bonus:15,status:'bleed',chance:.45,turns:2,power:4,icon:'double_strike',description:'ฟันแรงขึ้น • เลือดไหล 45% นาน 2 เทิร์น (โครงกระดูก/โกเลมต้านทาน)'},
    {id:'smoke_blade',name:'คมมีดม่านควัน',mp:3,cd:3,bonus:4,status:'blind',chance:.8,turns:2,icon:'blind',description:'ลดความแม่นยำศัตรู 25% • โอกาส 80% นาน 2 เทิร์น'},
  ],
  knight: [
    {id:'shield_bash',name:'กระแทกโล่',mp:3,cd:2,bonus:10,guard:true,status:'blind',chance:.3,turns:1,icon:'shield_bash',description:'โจมตีและกันดาเมจสวน 60% • มึนตา 30% นาน 1 เทิร์น'},
    {id:'iron_oath',name:'คำสัตย์เหล็กกล้า',mp:4,cd:3,bonus:5,fortify:true,icon:'shield',description:'โจมตีและเกราะเหล็ก 2 เทิร์น ลดดาเมจเข้าอีก 25%'},
  ],
  wizard: [
    {id:'fireball',name:'ลูกไฟเวท',mp:3,cd:0,bonus:24,status:'burn',chance:.55,turns:2,power:5,icon:'fireball',description:'ไม่มีคูลดาวน์ • ดาเมจเวท +24 • เผาไหม้ 55% นาน 2 เทิร์น'},
    {id:'frost_lance',name:'หอกเหมันต์',mp:4,cd:3,bonus:20,status:'chill',chance:.7,turns:2,icon:'frost',description:'ดาเมจเวท +20 • เยือกแข็ง 70% นาน 2 เทิร์น ลดพลังโจมตีศัตรู 25%'},
  ],
};
export const STATUS = {
  poison:{name:'พิษ',icon:'poison',text:'เสีย HP ตอนเริ่มเทิร์นของตัวเอง'},
  burn:{name:'เผาไหม้',icon:'fireball',text:'เสีย HP ตอนเริ่มเทิร์นของตัวเอง'},
  bleed:{name:'เลือดไหล',icon:'bleed',text:'เสีย HP ตอนเริ่มเทิร์นของตัวเอง'},
  blind:{name:'ตาพร่า',icon:'blind',text:'ความแม่นยำลดลง 25%'},
  chill:{name:'เยือกแข็ง',icon:'frost',text:'พลังโจมตีลดลง 25%'},
  web:{name:'ติดใย',icon:'web',text:'พลังโจมตีลดลง 25%'},
  fortified:{name:'เกราะเหล็ก',icon:'shield',text:'รับความเสียหายเบาลง 25%'},
  guard:{name:'ป้องกัน',icon:'shield',text:'ลดดาเมจศัตรูครั้งถัดไป 60%'},
  focused:{name:'สมาธิ',icon:'focus',text:'โจมตีในเทิร์นถัดไปแรงขึ้น 30% หมดเมื่อใช้เทิร์น แม้พลาดหรือเลือกป้องกัน/ยา'},
};
export const POTION_HP=20, POTION_MP=3;
export function prepareItemTurn(statuses) {
  consumeFocus(statuses,'item');
  expireActionStatuses(statuses);
  addStatus(statuses,'guard',1);
}
// UI names and executable aliases share one registry. English saves remain valid.
export function skillAliasMap() {
  return Object.fromEntries(Object.values(SKILLS).flat().flatMap(s=>[[s.id,s.id],[s.name,s.id]]));
}
export function ensureTactics(b) {
  b.heroStatuses ??= {}; b.enemyStatuses ??= {}; b.cooldowns ??= {};
  b.command ??= 'attack'; b.selectedSkill ??= null;
  b.rng ??= ((Date.now() ^ (b.level+1)*2654435761)>>>0)||1;
  if(b.poison>0) {addStatus(b.heroStatuses,'poison',b.poison,b.poisonDamage||4);b.poison=0;}
  if(b.web>0) {addStatus(b.heroStatuses,'web',b.web);b.web=0;}
  b.stance=false;
  return b;
}
export function random(b) {
  let n=b.rng>>>0; n^=n<<13;n^=n>>>17;n^=n<<5;b.rng=n>>>0;return b.rng/4294967296;
}
export function chance(b,probability) {return random(b)<probability;}
export function accuracy(classId,statuses,enemy=false) {
  const base=enemy?.9:{adventurer:.96,knight:.94,wizard:.95}[classId];
  return Math.max(.4,base-(statuses.blind?.turns>0?.25:0));
}
export function addStatus(statuses,id,turns,power=0) {
  statuses[id]={turns:Math.max(turns,statuses[id]?.turns||0),power};
}
export function statusChance(skill,level) {
  if(skill.status==='bleed' && LEVELS[level]?.bleedImmune) return 0;
  if(skill.status==='burn') return (skill.chance||0)*(LEVELS[level]?.burnResistance??1);
  return skill.chance||0;
}
export function attemptStatus(b,statuses,id,turns,power,probability) {
  if(!chance(b,probability)) return false;
  addStatus(statuses,id,turns,power);return true;
}
export function tickDots(statuses) {
  const hits=[];
  for(const id of ['poison','burn','bleed']) {
    const s=statuses[id];if(!s)continue;
    hits.push({id,damage:s.power});
    if(--s.turns<=0)delete statuses[id];
  }
  return hits;
}
export function expireActionStatuses(statuses,skip=[]) {
  for(const id of ['blind','chill','web','fortified']) if(!skip.includes(id)&&statuses[id] && --statuses[id].turns<=0)delete statuses[id];
}
export function advanceCooldowns(b,used=null) {
  for(const id of Object.keys(b.cooldowns)) if(id!==used)b.cooldowns[id]=Math.max(0,b.cooldowns[id]-1);
}
export function consumeFocus(statuses,command) {
  const focused=!!statuses.focused;
  if(command!=='focus')delete statuses.focused;
  return focused&&['attack','skill'].includes(command);
}
export function skillFor(classId,id) {return SKILLS[classId].find(s=>s.id===id)||SKILLS[classId][0];}
export function normalizeSkill(b,classId) {
  if(!SKILLS[classId].some(s=>s.id===b.selectedSkill))b.selectedSkill=SKILLS[classId][0].id;
  return skillFor(classId,b.selectedSkill);
}
export function heroDamage(base,statuses,focused) {
  return Math.max(1,Math.round(base*(statuses.web?.turns>0?.75:1)*(statuses.chill?.turns>0?.75:1)*(focused?1.3:1)));
}
export function enemyDamage(base,heroStatuses,enemyStatuses,knight=false) {
  return Math.max(1,Math.ceil(base*(knight?.85:1)*(heroStatuses.guard?.turns>0?.4:1)*(heroStatuses.fortified?.turns>0?.75:1)*(enemyStatuses.chill?.turns>0?.75:1)));
}
