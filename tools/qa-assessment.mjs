import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {db} from '../server/db.mjs';
import {FORMS} from '../server/assessment-bank.mjs';
const base=process.env.QA_BASE||'http://localhost:8781',sql=db(),fixtureFile=new URL('../../asset-sources/assessment-qa-private.json',import.meta.url);
if(!['http://localhost:8781','https://python-dungeon-live.vercel.app'].includes(base))throw Error('Invalid QA target');
const fixtures=[],checks=[],suffix=randomBytes(5).toString('hex');
async function cleanup(f){
 for(const a of f){
  if(!/^dungeon-assessment-qa-(teacher|student|browser)-[a-f0-9]{10}@example.com$/.test(a.email))throw Error('Unsafe fixture cleanup');
  const [u]=await sql`SELECT id::text id FROM neon_auth."user" WHERE email=${a.email}`;if(!u)continue;if(a.id&&u.id!==a.id)throw Error('Changed fixture identity');const id=u.id;
  await sql.transaction([sql`DELETE FROM assessment_attempts WHERE class_id IN (SELECT id FROM assessment_classes WHERE owner_id=${id}) OR user_id=${id}`,sql`DELETE FROM assessment_enrollments WHERE class_id IN (SELECT id FROM assessment_classes WHERE owner_id=${id}) OR user_id=${id}`,sql`DELETE FROM assessment_classes WHERE owner_id=${id}`,sql`DELETE FROM assessment_teachers WHERE user_id=${id}`,sql`DELETE FROM dungeon_rankings WHERE user_id=${id}`,sql`DELETE FROM dungeon_run_clears WHERE user_id=${id}`,sql`DELETE FROM dungeon_runs WHERE user_id=${id}`,sql`DELETE FROM dungeon_clears WHERE user_id=${id}`,sql`DELETE FROM dungeon_players WHERE user_id=${id}`,sql`DELETE FROM neon_auth."user" WHERE id::text=${id}`]);
 }console.log('Removed only the reserved assessment QA identities and their data.');
}
if(process.argv.includes('--cleanup')){const f=JSON.parse(await readFile(fixtureFile,'utf8'));await cleanup(f.accounts);await unlink(fixtureFile);process.exit(0);}
async function call(path,a,data,origin=base){
 const jar=a?.jar||new Map(),r=await fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
 for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');if(pair.slice(i+1))jar.set(pair.slice(0,i),pair.slice(i+1));else jar.delete(pair.slice(0,i));}
 return {status:r.status,data:r.headers.get('content-type')?.includes('application/json')?await r.json():await r.text()};
}
const get=(a,q='')=>call('/api/assessment'+q,a);
const post=(a,data)=>call('/api/assessment',a,{...data,accountId:a.id});
async function account(label){const a={email:`dungeon-assessment-qa-${label}-${suffix}@example.com`,password:randomBytes(24).toString('base64url'),name:label==='teacher'?'ครูทดสอบระบบ':'นักเรียนทดสอบระบบ',jar:new Map()};fixtures.push(a);const r=await call('/api/auth/sign-up/email',a,{email:a.email,password:a.password,name:a.name});assert.equal(r.status,200,'signup');a.id=(await call('/api/auth/get-session',a)).data.user.id;return a;}
try{
 assert.equal((await get()).status,401);checks.push('anonymous access rejected');
 for(const file of ['/server/assessment-bank.mjs','/server/assessment-schema.sql','/.env.local'])assert.equal((await fetch(base+file)).status,404);
 const teacher=await account('teacher'),student=await account('student'),browser=await account('browser');
 await sql`INSERT INTO assessment_teachers(user_id) VALUES(${teacher.id})`;
 assert.equal((await get(student,'?view=bank')).status,403);assert.equal((await post(student,{action:'createClass',name:'Invalid'})).status,403);checks.push('student cannot access teacher keys or create classes');
 const created=await post(teacher,{action:'createClass',name:'ห้องเรียนทดลอง · Python Dungeon',mediaUrl:'https://example.com/lesson'});assert.equal(created.status,201,JSON.stringify(created));const classId=created.data.id,code=created.data.code;
 let c=(await get(teacher)).data.classes[0];assert.equal(c.pre_open,false);assert.equal(c.post_open,false);
 assert.equal((await get(student,'?view=report&id='+classId)).status,403);
 const joined=await post(student,{action:'join',code,studentCode:'QA001',fullName:'นักเรียน ตัวอย่าง'});assert.equal(joined.status,200);
 assert.equal((await post(browser,{action:'join',code,studentCode:'QA001',fullName:'ทดสอบ ซ้ำรหัส'})).status,409);checks.push('unique learner ID within class');
 assert.equal((await post(student,{action:'start',classId,phase:'pre'})).status,423);
 const update=async(preOpen,postOpen)=>{const r=await post(teacher,{action:'updateClass',classId,revision:c.revision,name:c.name,mediaUrl:c.media_url,preOpen,postOpen});assert.equal(r.status,200);c.revision=r.data.revision;};
 await update(true,true);
 assert.equal((await post(student,{action:'start',classId,phase:'post'})).status,409);
 let r=await post(student,{action:'start',classId,phase:'pre'});assert.equal(r.status,200);const pre=r.data.id;
 r=await get(student,'?view=attempt&id='+pre);assert.ok(!JSON.stringify(r.data.questions).includes('explanation'));assert.ok(r.data.questions.every(q=>!('answer' in q)));assert.equal(r.data.questions.length,24);
 assert.equal((await get(browser,'?view=attempt&id='+pre)).status,403);checks.push('private attempts and student payload omit answer keys');
 const mutationId=randomUUID();r=await post(student,{action:'draft',attemptId:pre,revision:0,mutationId,answers:{pre02:'end'}});assert.equal(r.status,200);assert.equal(r.data.revision,1);
 assert.equal((await post(student,{action:'draft',attemptId:pre,revision:0,mutationId,answers:{pre02:'end'}})).data.duplicate,true);
 assert.equal((await post(student,{action:'draft',attemptId:pre,revision:0,mutationId:randomUUID(),answers:{}})).status,409);checks.push('autosave retries same mutation and rejects stale revision');
 await update(false,true);assert.equal((await post(student,{action:'submit',attemptId:pre,revision:1,submissionId:randomUUID()})).status,423);
 await update(true,true);r=await post(student,{action:'submit',attemptId:pre,revision:1,submissionId:randomUUID(),score:24});assert.equal(r.status,200);
 assert.equal((await get(student,'?view=attempt&id='+pre)).data.attempt.score,1);checks.push('closed round preserves answers; score comes from server, ignores supplied score');
 const postId=(await post(student,{action:'start',classId,phase:'post'})).data.id;
 const answers=Object.fromEntries(FORMS.post.map(q=>[q.id,q.answer]));
 r=await post(student,{action:'draft',attemptId:postId,revision:0,mutationId:randomUUID(),answers});assert.equal(r.status,200);
 const submissionId=randomUUID();assert.equal((await post(student,{action:'submit',attemptId:postId,revision:1,submissionId})).status,200);
 assert.equal((await post(student,{action:'submit',attemptId:postId,revision:1,submissionId})).data.duplicate,true);
 assert.equal((await get(student,'?view=attempt&id='+postId)).data.attempt.score,24);
 assert.equal((await post(student,{action:'start',classId,phase:'post'})).status,409);
 assert.equal((await post(teacher,{action:'retake',classId,studentUserId:student.id})).status,200);
 assert.equal((await post(teacher,{action:'retake',classId,studentUserId:student.id})).status,409);checks.push('immutable submission and explicit one-at-a-time retake grant');
 const csv=await get(teacher,'?view=report&id='+classId+'&format=csv');assert.equal(csv.status,200);assert.ok(csv.data.includes('QA001'));assert.ok(csv.data.includes('20.00'));
 const report=(await get(teacher,'?view=report&id='+classId)).data;assert.equal(report.rows[0].pre.score,1);assert.equal(report.rows[0].post.score,24);checks.push('teacher sees own class report and CSV with /20 conversion');
 assert.equal((await call('/api/assessment',student,{action:'join',accountId:student.id,code,studentCode:'QA001',fullName:'Student'},'https://untrusted.example')).status,403);checks.push('origin protection');
 await sql.query("INSERT INTO assessment_enrollments(class_id,user_id,student_code,full_name) SELECT $1,'qa-page-'||$2||'-'||n,'PAGE'||lpad(n::text,3,'0'),'QA Pagination '||n FROM generate_series(1,25) n",[classId,suffix]);
 const second=(await get(teacher,'?view=report&id='+classId+'&page=2')).data;assert.equal(second.page,2);assert.equal(second.total,26);assert.equal(second.rows.length,6);
 const beyond=(await get(teacher,'?view=report&id='+classId+'&page=999')).data;assert.equal(beyond.page,2);
 const filtered=(await get(teacher,'?view=report&id='+classId+'&q=QA001')).data;assert.equal(filtered.total,1);assert.equal(filtered.rows[0].student_code,'QA001');checks.push('20-row server pagination, boundary clamping and committed learner search');
 await sql.query("DELETE FROM assessment_enrollments WHERE class_id=$1 AND user_id LIKE $2",[classId,'qa-page-'+suffix+'-%']);
 await update(true,false);
 if(process.env.QA_KEEP==='1')await writeFile(fixtureFile,JSON.stringify({classId,code,accounts:fixtures.map(({jar,...a})=>a)},null,2));
 console.log(JSON.stringify({passed:checks.length,target:base,checks,browserFixturesReady:process.env.QA_KEEP==='1'}));
}finally{if(process.env.QA_KEEP!=='1')await cleanup(fixtures);}
