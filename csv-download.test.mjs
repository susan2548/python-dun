import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadCsv} from './assessment-client.js';
test('CSV download retains Thai bytes and exactly one UTF-8 BOM through a real Fetch response',async()=>{
 const originalDocument=globalThis.document,create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 let output,link;
 globalThis.document={createElement:()=>link={click(){this.clicked=true;}}};
 URL.createObjectURL=blob=>{output=blob;return 'blob:csv-qa';};URL.revokeObjectURL=()=>{};
 const csv='"รหัสนักเรียน","ชื่อ–นามสกุล","คะแนน"\r\n"00123","นักเรียน ทดสอบ",24\r\n';
 try{
  for(const bom of ['', '\uFEFF']){
   await downloadCsv('scores.csv',new Response(bom+csv,{headers:{'Content-Type':'text/csv; charset=utf-8'}}));
   const bytes=new Uint8Array(await output.arrayBuffer());
   assert.deepEqual([...bytes.slice(0,3)],[239,187,191]);
   assert.equal(new TextDecoder().decode(bytes),csv);assert.ok(!new TextDecoder().decode(bytes.slice(3)).startsWith('\uFEFF'));
   assert.equal(link.download,'scores.csv');assert.equal(link.clicked,true);assert.equal(output.type,'text/csv;charset=utf-8');
  }
 }finally{globalThis.document=originalDocument;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});
