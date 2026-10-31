import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {QUESTION_TEMPLATES} from './question-bank.js';
import {solutionFor} from './tools/question-fixtures.mjs';
import {skillAliasMap} from './tactical-engine.js';
const source=fs.readFileSync(new URL('./python-worker.mjs',import.meta.url),'utf8');
const blocks=[...source.matchAll(/py\.runPythonAsync\(`([\s\S]*?)`\)/g)].map(m=>Function('return `'+m[1]+'`;')());
const prelude=blocks.find(s=>s.includes('skill_aliases =')),legacy=blocks.find(s=>s.includes('cid = challenge_number'));
assert(prelude&&legacy);
const cases=[];
for(const t of QUESTION_TEMPLATES)for(const seed of [.01,.49,.99]){
 const q={id:t.id,...t.build(()=>seed)};
 for(const skill of [null,'fireball','ลูกไฟเวท'])for(const rune of ['', 'SEAL-Q7'])cases.push({id:t.id+' '+seed+' '+skill+' '+rune,check:q.check,code:solutionFor(q,{skill,rune}),rune,ok:true});
 cases.push({id:t.id+' bare constant',check:q.check,code:`attack(${q.check.power||2})`,ok:false});
 cases.push({id:t.id+' duplicate action',check:q.check,code:solutionFor(q)+'\nattack(1)',ok:false});
}
const find=id=>{const t=QUESTION_TEMPLATES.find(t=>t.id.endsWith(id));return {id:t.id,...t.build(()=>.49)};};
for(const [id,code] of [
 ['comment-number','print("# not a comment")\nattack(2)'],
 ['for-sum','total = 0\nfor value in []:\n    total += 1\ntotal = 3\nattack(total)'],
 ['while-add','charge = 0\nwhile False:\n    charge += 1\ncharge = 2\nattack(charge)'],
 ['function-parameters','def boost(base, bonus):\n    return 3\nattack(boost(1, 2))'],
 ['method-state','class Hero:\n    power = 2\n    def strike(self):\n        unused = self.power\n        return 2\nhero = Hero()\nattack(hero.strike())'],
 ['class-constructor','class Hero:\n    power = 2\n    def __init__(self, power):\n        pass\nhero = Hero(2)\nattack(hero.power)'],
 ['while-add','charge = 0\nwhile True:\n    charge += 1\nattack(charge)'],
]){const q=find(id);cases.push({id:q.id+' bypass',check:q.check,code,ok:false});}
const result=spawnSync('python',['-X','utf8','tools/validate-questions.py'],{input:JSON.stringify({prelude,legacy,aliases:JSON.stringify(skillAliasMap()),cases}),encoding:'utf8',timeout:30000,maxBuffer:4e6});
if(result.stderr)process.stderr.write(result.stderr);
const report=JSON.parse(result.stdout||'{}');console.log(JSON.stringify(report,null,2));assert.equal(result.status,0);
