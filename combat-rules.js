// Pure combat rules shared by the game and balance checks.
export const MONSTERS = [
  { hp: 62, atk: 14, skill: 'กัดแพร่เชื้อ', icon: 'poison', description: 'เทิร์นคู่กัดแรงขึ้น • ถ้าโดน มีโอกาสติดพิษ 60% (4 HP / 2 เทิร์น)' },
  { hp: 90, atk: 17, skill: 'โล่กระดูก / ดาบสะบั้น', icon: 'shield', description: 'เทิร์นคู่ตั้งเกราะลดดาเมจครั้งถัดไป 45% ก่อนฟันหนัก • ไม่ติดเลือดไหล' },
  { hp: 120, atk: 18, skill: 'ใยพิษพันธนาการ', icon: 'web', description: 'เทิร์นคู่: พิษ 70% / ใยลดดาเมจ 75% / ตาพร่า 50% นาน 2 เทิร์น' },
  { hp: 154, atk: 20, skill: 'ดูดมานาและวิญญาณ', icon: 'curse', description: 'เทิร์นคู่: ถ้าโจมตีโดน ดูด 3 MP และฟื้นเลือดตนเอง 10 HP' },
  { hp: 190, atk: 23, skill: 'สะสมพลัง / แผ่นดินแยก', icon: 'stone', description: 'เทิร์นคี่ตั้งเกราะ เทิร์นคู่ทุบหนัก +12 • ไม่เลือดไหล และติดไฟยากขึ้น' },
  { hp: 235, atk: 26, skill: 'คำสาปมรณะ', icon: 'curse', description: 'สลับดูด 2 MP กับคำสาป +10 ดาเมจ • ถ้าโดน โอกาสติดพิษ 55% นาน 2 เทิร์น' },
];
export function enemyIntent(level, turn) {
  const m = MONSTERS[level], even = turn % 2 === 0;
  let move = { name: 'โจมตี', damage: m.atk, icon: 'attack' };
  if (level === 0 && even) move = { name: m.skill, damage: m.atk + 4, poison: 4, icon: 'poison' };
  if (level === 1 && even) move = { name: 'โล่กระดูกโต้กลับ', damage: m.atk - 3, shield: true, icon: 'shield' };
  if (level === 1 && !even && turn > 1) move = { name: 'ดาบสะบั้น', damage: m.atk + 8, icon: 'attack' };
  if (level === 2 && even) move = { name: m.skill, damage: m.atk - 3, web: true, poison: 3, icon: 'web' };
  if (level === 3 && even) move = { name: m.skill, damage: m.atk + 3, drain: 3, heal: 10, icon: 'curse' };
  if (level === 4) move = even ? { name: 'แผ่นดินแยก', damage: m.atk + 12, icon: 'stone' } : { name: 'เกราะหินสะสมพลัง', damage: m.atk - 8, shield: true, icon: 'shield' };
  if (level === 5) move = even ? { name: m.skill, damage: m.atk + 10, poison: 5, icon: 'curse' } : { name: 'ดูดวิญญาณ', damage: m.atk, drain: 2, icon: 'curse' };
  return move;
}
export function attackDamage(classId, level, bonus, power, skill, web = false, guarded = false) {
  const atk = {adventurer:10, knight:11, wizard:8}[classId];
  const extra = skill ? {adventurer:18, knight:12, wizard:25}[classId] : 0;
  return Math.max(1, Math.round((atk + bonus + 6 + level * 6 + (power - 1) * 4 + extra) * (web ? .75 : 1) * (guarded ? .8 : 1)));
}
export function incomingDamage(amount, classId, guard) {
  return Math.max(1, Math.ceil(amount * (classId === 'knight' ? .85 : 1) * (guard ? .4 : 1)));
}
