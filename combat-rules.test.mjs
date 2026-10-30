import assert from 'node:assert/strict';
import {MONSTERS,enemyIntent,attackDamage,incomingDamage} from './combat-rules.js';
// Regression checks for distinct skills, resource pressure, guard and recovery.
assert.equal(new Set(MONSTERS.map(x=>x.skill)).size,6);
assert.equal(enemyIntent(0,2).poison,4);
assert.equal(enemyIntent(1,2).shield,true);
assert.equal(enemyIntent(2,2).web,true);
assert.equal(enemyIntent(3,2).drain,3);
assert.equal(enemyIntent(3,2).heal,10);
assert.equal(enemyIntent(4,2).damage,33);
assert.equal(enemyIntent(5,2).poison,5);
for(const id of ['adventurer','knight','wizard']) for(let level=0;level<6;level++) {
 const normal=attackDamage(id,level,0,2,false);
 assert(attackDamage(id,level,0,2,true)>normal,'Skill must improve damage');
 assert(attackDamage(id,level,0,2,false,true)<normal,'Web must weaken next attack');
 assert(attackDamage(id,level,0,2,false,false,true)<normal,'Guard has an offensive cost');
 assert(incomingDamage(MONSTERS[level].atk,id,true)<incomingDamage(MONSTERS[level].atk,id,false));
}
assert(incomingDamage(24,'knight',false)<incomingDamage(24,'wizard',false));
// Normal attacks alone cannot erase every enemy within the three lesson turns.
for(let level=0;level<6;level++) {
 const total=[1,2,1].reduce((sum,p)=>sum+attackDamage('wizard',level,0,p,false),0);
 assert(total<MONSTERS[level].hp);
}
console.log('Combat checks passed: all six monster identities, guard/web costs, damage scaling and skill advantage.');
