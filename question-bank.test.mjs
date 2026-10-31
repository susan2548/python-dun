import assert from 'node:assert/strict';
import {QUESTION_TEMPLATES,drawQuestion,assignNextQuestion,ensureBattleQuestion} from './question-bank.js';
import {CHALLENGES} from './curriculum.js';
import {LEVELS,TOPIC_TO_FLOOR,migrateCampaign,updateFrontier,nextFloorAfterClear} from './campaign.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
assert.equal(QUESTION_TEMPLATES.length,100);
assert.equal(new Set(QUESTION_TEMPLATES.map(t=>t.id)).size,100);
for(let floor=0;floor<LEVELS.length;floor++){
 const save={},r=rng(412+floor),count=QUESTION_TEMPLATES.filter(t=>t.floor===floor).length;let questions=Array.from({length:count},()=>drawQuestion(save,floor,r));
 assert(count>=8);assert.equal(new Set(questions.map(q=>q.id)).size,count);
 assert(questions.every(q=>LEVELS[floor].groups.includes(q.group)));
 const groupCount=LEVELS[floor].groups.length;assert.equal(new Set(questions.slice(0,groupCount).map(q=>q.group)).size,groupCount);
 assert.equal(save.questionDecks[floor].cycle,0);assert.notEqual(drawQuestion(save,floor,r).id,questions.at(-1).id);assert.equal(save.questionDecks[floor].cycle,1);
 const a={level:floor,rng:12345},oldRng=a.rng;assignNextQuestion(save,a,r);
 const before=JSON.stringify(save),q=a.question;assert.equal(ensureBattleQuestion(save,a,()=>{throw Error('reroll');}),q);assert.equal(JSON.stringify(save),before);assert.equal(a.rng,oldRng);
 const reloaded=JSON.parse(JSON.stringify(a));assert.deepEqual(ensureBattleQuestion(save,reloaded),q);
 assert(!('solution' in q||'answer' in q));
 for(const group of LEVELS[floor].groups){
  const old={},b={level:floor,phase:0,migratedLegacyChallenge:group+1};const migrated=ensureBattleQuestion(old,b,rng(4));
  assert.equal(migrated.prompt,CHALLENGES[Math.floor(group/3)][group%3].prompt);
  assert.equal(migrated.check.legacyChallenge,group+1);
  assert.equal(ensureBattleQuestion(old,b,()=>{throw Error('migration twice');}),migrated);
  assert(!old.questionDecks[floor].queues[group].includes(migrated.id));
 }
 for(const bad of [{questionDecks:[]},{questionDecks:{[floor]:{version:1,queues:[[],[],[]],nextGroup:12}}}])assert.equal(drawQuestion(bad,floor,r).floor,floor);
}
const orders=Array.from({length:6},(_,i)=>{const s={},r=rng(i+42);return Array.from({length:12},()=>drawQuestion(s,0,r).id).join(',');});assert(new Set(orders).size>1);
for(let oldFloor=0;oldFloor<6;oldFloor++)for(let phase=0;phase<6;phase++){
 const save={cleared:oldFloor,stars:Array(6).fill(3),gold:99,expedition:{hp:42,mp:2},activeBattle:{level:oldFloor,phase,hp:42,mp:2,enemyHp:20,maxEnemyHp:100,turn:8,rng:12345,heroStatuses:{poison:{turns:2,power:4}}}};
 migrateCampaign(save);const b=save.activeBattle;assert.equal(b.level,TOPIC_TO_FLOOR[oldFloor*3+phase%3]);assert.equal(b.hp,42);assert.equal(b.mp,2);assert.equal(b.rng,12345);assert.equal(b.turn,8);assert.equal(save.gold,99);assert.equal(save.stars.length,12);
 const q=ensureBattleQuestion(save,b);assert.equal(q.check.legacyChallenge,oldFloor*3+phase%3+1);assert.equal(b.phase,0);assert.equal(b.answeredQuestions,0);
 const snapshot=JSON.stringify(save);assert.equal(migrateCampaign(save),false);assert.equal(JSON.stringify(save),snapshot);
}
const moved={stars:[0,3,3,0]};assert.equal(updateFrontier(moved),0);moved.stars[0]=2;assert.equal(updateFrontier(moved),3);
assert.equal(nextFloorAfterClear({cleared:1},0),1);assert.equal(nextFloorAfterClear({cleared:12},0),1);assert.equal(nextFloorAfterClear({cleared:0},2),0);assert.equal(nextFloorAfterClear({cleared:10},11),10);assert.equal(nextFloorAfterClear({cleared:12},11),null);
console.log('100 templates; 12 nonrepeating topic decks, campaign migration and reload checks passed');
