import assert from 'node:assert/strict';
import {CLASSES,migrateClassBalance,BALANCE_VERSION} from './hero-classes.js';
import {attackDamage,incomingDamage,MONSTERS} from './combat-rules.js';
import {SKILLS,heroDamage,enemyDamage} from './tactical-engine.js';
import {ensureLessonProgress,recordCorrectAnswer,enemyHpFloor,canClaimVictory} from './lesson-progress.js';

// Role separation must hold at every floor/power, not just on the roster.
for(let floor=0;floor<6;floor++) for(let power=1;power<=3;power++) {
  const hit=id=>attackDamage(id,floor,0,power,false);
  assert(hit('adventurer')>=hit('knight')*1.25,'Physical specialist should keep a material damage advantage');
  assert(hit('knight')>hit('wizard'),'Mage basic attacks remain the weakest');
  assert(hit('wizard')+SKILLS.wizard[0].bonus>hit('adventurer'),'Mana should buy stronger direct spell damage');
  assert.equal(attackDamage('wizard',floor,0,power,true),hit('wizard')+SKILLS.wizard[0].bonus,'Preview and live skill share the same bonus');
  assert(heroDamage(hit('adventurer'),{},true)>hit('adventurer'));
}
assert(CLASSES.knight.hp>CLASSES.adventurer.hp && CLASSES.adventurer.hp>CLASSES.wizard.hp);
assert(CLASSES.wizard.mp>=2*CLASSES.adventurer.mp);
assert(CLASSES.adventurer.mp>CLASSES.knight.mp);
assert(CLASSES.wizard.mp/SKILLS.wizard[0].mp===8);
assert(enemyDamage(40,{}, {},true)<enemyDamage(40,{}, {},false));
assert(incomingDamage(40,'knight',false)<incomingDamage(40,'adventurer',false));

// Existing saves retain resource fraction, injuries, progress and purchases.
const old={classId:'wizard',cleared:4,gold:91,attackBonus:2,hpBonus:15,expedition:{hp:43,mp:5,maxHp:97,maxMp:12},activeBattle:null};
migrateClassBalance(old);assert.equal(old.expedition.mp,10);assert.equal(old.expedition.maxMp,24);
assert.equal(old.expedition.hp,43);assert.equal(old.gold,91);assert.equal(old.cleared,4);assert.equal(old.attackBonus,2);
const once=JSON.stringify(old);migrateClassBalance(old);assert.equal(JSON.stringify(old),once,'Reload cannot repeatedly replenish MP');
const active={classId:'knight',hpBonus:0,expedition:{hp:120,mp:10,maxHp:145,maxMp:10},activeBattle:{hp:80,mp:5,maxHp:145,maxMp:10,phase:2,turn:4,enemyHp:1,heroStatuses:{poison:{turns:2,power:4}},rng:7}};
migrateClassBalance(active);assert.equal(active.activeBattle.mp,4);assert.equal(active.activeBattle.maxMp,8);
assert.equal(active.expedition.hp,80);assert.equal(active.expedition.mp,4);assert.equal(active.activeBattle.enemyHp,1);assert.equal(active.activeBattle.rng,7);
assert.equal(active.activeBattle.heroStatuses.poison.turns,2);assert.equal(active.balanceVersion,BALANCE_VERSION);
const exhausted={classId:'wizard',expedition:{hp:0,mp:0,maxHp:82,maxMp:12}};
migrateClassBalance(exhausted);assert.equal(exhausted.expedition.hp,0);assert.equal(exhausted.expedition.mp,0);

// A large hit or a DOT/utility turn cannot bypass any of the three lessons.
const gate=ensureLessonProgress({phase:0,enemyHp:MONSTERS[0].hp});
for(let question=0;question<2;question++) {
  gate.phase=question;recordCorrectAnswer(gate);
  gate.enemyHp=Math.max(enemyHpFloor(gate),gate.enemyHp-999);
  assert.equal(gate.enemyHp,1);assert.equal(canClaimVictory(gate),false);
}
gate.phase=2; // two answers accepted; third has not been submitted.
gate.enemyHp=Math.max(enemyHpFloor(gate),gate.enemyHp-5); // burn during guard/focus/potion/error counter.
assert.equal(gate.enemyHp,1);assert.equal(canClaimVictory(gate),false);
recordCorrectAnswer(gate);gate.enemyHp=Math.max(enemyHpFloor(gate),gate.enemyHp-1);
assert.equal(canClaimVictory(gate),true);assert.equal(gate.answeredQuestions,3);
const tough=ensureLessonProgress({phase:2,enemyHp:200});recordCorrectAnswer(tough);
tough.enemyHp-=10;assert.equal(canClaimVictory(tough),false,'Third correct answer does not force a kill');
tough.phase=3;recordCorrectAnswer(tough);assert.equal(tough.answeredQuestions,4);assert.equal(canClaimVictory(tough),false);
const oldThird=ensureLessonProgress({phase:2,enemyHp:1});assert.equal(oldThird.answeredQuestions,2);assert.equal(enemyHpFloor(oldThird),1);
const oldRepeat=ensureLessonProgress({phase:4,enemyHp:1});assert.equal(oldRepeat.answeredQuestions,4);assert.equal(enemyHpFloor(oldRepeat),0);
const afterThree=ensureLessonProgress({phase:3,enemyHp:1});
afterThree.enemyHp=Math.max(enemyHpFloor(afterThree),afterThree.enemyHp-5);
assert.equal(canClaimVictory(afterThree),true,'Status/utility kills work once all required answers really passed');
console.log('Class balance / learning gates passed: all floors, damage roles, mana, idempotent save migration, DOT/utility lock and extra questions.');
