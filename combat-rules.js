// Pure combat rules shared by the game and balance checks.
import {CLASSES} from './hero-classes.js?v=1';
import {SKILLS} from './tactical-engine.js?v=4';
import {LEVELS} from './campaign.js?v=1';
export const MONSTERS=LEVELS;
export function enemyIntent(level, turn) {
  const m = MONSTERS[level], even = turn % 2 === 0,kind=m.kind;
  let move = { name: 'โจมตี', damage: m.atk, icon: 'attack' };
  if (kind==='zombie' && even) move = { name: m.skill, damage: m.atk + 4, poison: 4, poisonChance:.6, icon: 'poison' };
  if (kind==='skeleton' && even) move = { name: 'โล่กระดูกโต้กลับ', damage: m.atk - 3, shield: true, icon: 'shield' };
  if (kind==='skeleton' && !even && turn > 1) move = { name: 'ดาบสะบั้น', damage: m.atk + 8, icon: 'attack' };
  if (kind==='spider' && even) move = { name: m.skill, damage: m.atk - 3, web: true, poison: 3, poisonChance:.65, icon: 'web' };
  if (kind==='wraith' && even) move = { name: m.skill, damage: m.atk + 3, drain: 2, heal: 8, icon: 'curse' };
  if (kind==='golem') move = even ? { name: 'แผ่นดินแยก', damage: m.atk + 12, icon: 'stone' } : { name: 'เกราะหินสะสมพลัง', damage: m.atk - 8, shield: true, icon: 'shield' };
  if (kind==='necromancer') move = even ? { name: m.skill, damage: m.atk + 10, poison: 5, poisonChance:.55, icon: 'curse' } : { name: 'ดูดวิญญาณ', damage: m.atk, drain: 2, icon: 'curse' };
  const newMoves={
   slime:['acid-lunge','acid-fountain',{damage:m.atk+3,poison:3,poisonChance:.45}],
   mimic:['chest-bite','coin-storm',{damage:m.atk+2,statuses:[{id:'blind',chance:.65,turns:2}]}],
   scarab:['mandible-ram','sandstorm',{damage:m.atk-2,shield:true,statuses:[{id:'blind',chance:.5,turns:1}]}],
   bat:['wing-dive','sonic-cry',{damage:m.atk+2,drain:1,statuses:[{id:'blind',chance:.55,turns:2}]}],
   icewolf:['ice-pounce','frost-breath',{damage:m.atk+4,statuses:[{id:'chill',chance:.65,turns:2}]}],
   sentinel:['gear-slash','core-laser',{damage:m.atk+6,statuses:[{id:'burn',chance:.5,turns:2,power:4}]}],
  }[kind];
  if(newMoves)move=even?{name:m.skill,damage:m.atk,icon:m.icon,variant:newMoves[1],voice:kind+'_skill',...newMoves[2]}:{name:'โจมตี',damage:m.atk,icon:'attack',variant:newMoves[0],voice:'attack_'+kind};
  return move;
}
export function attackDamage(classId, level, bonus, power, skill, web = false, guarded = false) {
  const {atk,attackGrowth} = CLASSES[classId];
  const extra = skill ? SKILLS[classId][0].bonus : 0;
  return Math.max(1, Math.round((atk + bonus + 6 + Math.floor(level/2) * attackGrowth + (power - 1) * 4 + extra) * (web ? .75 : 1) * (guarded ? .8 : 1)));
}
export function incomingDamage(amount, classId, guard) {
  return Math.max(1, Math.ceil(amount * (classId === 'knight' ? .85 : 1) * (guard ? .4 : 1)));
}
