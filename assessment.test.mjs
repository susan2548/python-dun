import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMS,UNITS,publicQuestions,cleanAnswers,gradeAnswers} from './server/assessment-bank.mjs';
import {csvCell,mediaUrl,uuid,revision} from './server/assessment-policy.mjs';
test('parallel assessment forms have 24 unique questions, 12 choices and 12 code fills, matched unit coverage',()=>{
 assert.equal(UNITS.length,6);
 for(const phase of ['pre','post']){
  const bank=FORMS[phase];assert.equal(bank.length,24);assert.equal(new Set(bank.map(q=>q.id)).size,24);
  assert.equal(bank.filter(q=>q.type==='choice').length,12);assert.equal(bank.filter(q=>q.type==='fill').length,12);
  assert.deepEqual(UNITS.map((_,i)=>bank.filter(q=>q.unit===i).length),[2,4,4,6,4,4]);
  for(const q of bank){assert.ok(q.answer);assert.ok(q.explanation);if(q.choices)assert.ok(q.choices.some(c=>c.id===q.answer));}
 }
});
test('student payload strips keys, explanations and matching rules even after question/option shuffle',()=>{
 for(const phase of ['pre','post']){
  const order=FORMS[phase].map(q=>q.id).reverse(),choices=Object.fromEntries(FORMS[phase].filter(q=>q.choices).map(q=>[q.id,q.choices.map(c=>c.id).reverse()]));
  const student=publicQuestions(phase,order,choices);
  assert.deepEqual(student.map(q=>q.id),order);
  for(const q of student){assert.ok(!('answer' in q));assert.ok(!('explanation' in q));assert.ok(!('kind' in q));if(q.choices)assert.deepEqual(q.choices.map(c=>c.id),choices[q.id]);}
 }
});
test('grading is deterministic, bounded, case-sensitive, and does not execute code',()=>{
 for(const phase of ['pre','post']){
  assert.equal(gradeAnswers(phase,{}).score,0);
  const correct=Object.fromEntries(FORMS[phase].map(q=>[q.id,q.answer]));
  const grade=gradeAnswers(phase,correct);assert.equal(grade.score,24);assert.equal(grade.byUnit.reduce((s,u)=>s+u.score,0),24);
  const fills=FORMS[phase].filter(q=>q.type==='fill');
  for(const q of fills){assert.equal(gradeAnswers(phase,{[q.id]:' '+q.answer+' '}).score,1);assert.equal(gradeAnswers(phase,{[q.id]:'__import__("os").system("danger")'}).score,0);}
  const token=fills.find(q=>q.answer==='ValueError');assert.equal(gradeAnswers(phase,{[token.id]:'valueerror'}).score,0);
 }
});
test('answers reject extra ids, non-string payloads, invalid choices and oversized inputs',()=>{
 assert.throws(()=>cleanAnswers('pre',{unknown:'1'}));assert.throws(()=>cleanAnswers('pre',[]));assert.throws(()=>cleanAnswers('pre',{pre02:1}));assert.throws(()=>cleanAnswers('pre',{pre01:'99'}));assert.throws(()=>cleanAnswers('pre',{pre02:'a'.repeat(161)}));
 assert.deepEqual(cleanAnswers('pre',{pre01:'',pre02:' end '}),{pre01:'',pre02:'end'});
});
test('teacher CSV protects formulas while retaining a legitimate negative numeric gain',()=>{
 for(const v of ['=SUM(1,2)','+cmd','-danger','@x',' \t=cmd'])assert.ok(csvCell(v).startsWith('"\''));
 assert.equal(csvCell(-2),'"-2"');assert.equal(csvCell('a"b'),'"a""b"');
});
test('class links and identity/revision syntax are restricted',()=>{
 assert.equal(mediaUrl(''),'');assert.equal(mediaUrl('https://example.com/lesson'),'https://example.com/lesson');
 for(const link of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.throws(()=>mediaUrl(link));
 assert.throws(()=>uuid('a-b'));assert.throws(()=>revision(-1));assert.throws(()=>revision(1.5));
});
