import assert from 'node:assert/strict';
import {MONSTERS,enemyIntent,attackDamage,incomingDamage} from './combat-rules.js';
// Regression checks for distinct skills, resource pressure, guard and recovery.
assert.equal(new Set(MONSTERS.map(x=>x.skill)).size,12);
assert.equal(new Set(MONSTERS.map(x=>x.kind)).size,12);
assert.equal(new Set(MONSTERS.map(x=>x.scene)).size,12);
assert.equal(enemyIntent(0,2).poison,3);
assert.equal(enemyIntent(5,2).shield,true);
assert.equal(enemyIntent(3,2).web,true);
assert.equal(enemyIntent(7,2).drain,2);
assert.equal(enemyIntent(7,2).heal,8);
assert.equal(enemyIntent(9,2).damage,34);
assert.equal(enemyIntent(11,2).poison,5);
for(const level of [0,2,4,6,8,10])assert.notDeepEqual(enemyIntent(level,1),enemyIntent(level,2));
assert.equal(new Set([0,2,4,6,8,10].map(i=>enemyIntent(i,2).variant)).size,6);
for(const id of ['adventurer','knight','wizard']) for(let level=0;level<MONSTERS.length;level++) {
 const normal=attackDamage(id,level,0,2,false);
 assert(attackDamage(id,level,0,2,true)>normal,'Skill must improve damage');
 assert(attackDamage(id,level,0,2,false,true)<normal,'Web must weaken next attack');
 assert(attackDamage(id,level,0,2,false,false,true)<normal,'Guard has an offensive cost');
 assert(incomingDamage(MONSTERS[level].atk,id,true)<incomingDamage(MONSTERS[level].atk,id,false));
}
assert(incomingDamage(24,'knight',false)<incomingDamage(24,'wizard',false));
// Normal attacks alone cannot erase every enemy within the three lesson turns.
for(let level=0;level<MONSTERS.length;level++) {
 const total=[1,2,1].reduce((sum,p)=>sum+attackDamage('wizard',level,0,p,false),0);
 assert(total<MONSTERS[level].hp);
}
console.log('Combat checks passed: 12 distinct room/monster/skill identities, guard/web costs and damage scaling.');
