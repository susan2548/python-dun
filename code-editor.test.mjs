import assert from 'node:assert/strict';
import {highlightPython} from './code-editor.js';
import {SKILLS,skillAliasMap} from './tactical-engine.js';
const plain=s=>s.replace(/<span class="syntax-[a-z]+">(.*?)<\/span>/gs,'$1');
const example='# คอมเมนต์\npower = 2\nprint("ลูกไฟเวท")\nif power > 1:\n    skill("ลูกไฟเวท", power)';
const markup=highlightPython(example);
assert.ok(markup.includes('syntax-comment'));assert.ok(markup.includes('syntax-string'));assert.ok(markup.includes('syntax-number'));assert.ok(markup.includes('syntax-keyword'));assert.ok(markup.includes('syntax-builtin'));
assert.equal(plain(markup),example.replaceAll('>','&gt;'));
assert.ok(!highlightPython('print("<img src=x onerror=alert(1)>")').includes('<img'));
assert.equal(plain(highlightPython('"""line 1\n# still a string\nline 3"""')),'"""line 1\n# still a string\nline 3"""');
const aliases=skillAliasMap();
for(const s of Object.values(SKILLS).flat()){assert.equal(aliases[s.name],s.id);assert.equal(aliases[s.id],s.id);}
assert.equal(Object.keys(aliases).length,12);
console.log('Editor checks passed: Thai tokens, escaped HTML, multiline strings and all 12 skill aliases.');
