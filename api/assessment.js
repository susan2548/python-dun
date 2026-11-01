import {randomUUID,randomInt} from 'node:crypto';
import {db} from '../server/db.mjs';
import {requireUser} from '../server/auth.mjs';
import {body,fail,requireOrigin,noStore,json,handleError} from '../server/http.mjs';
import {uuid,revision,text,mediaUrl,csvCell,stamp} from '../server/assessment-policy.mjs';
import {FORMS,FORM_VERSION,UNITS,formFor,publicQuestions,cleanAnswers,gradeAnswers} from '../server/assessment-bank.mjs';
const shuffled=values=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
function checked(result){if(!result.error)return result;const messages={archived:'ห้องนี้ถูกลบหรือไม่พบรหัสห้อง ติดต่อครูเพื่อกู้คืนห้อง',removed:'คุณถูกนำออกจากห้องนี้แล้ว ให้ครูเพิ่มกลับก่อนจึงเข้าได้',not_enrolled:'เข้าห้องเรียนก่อนเริ่มสอบ',closed:'ครูปิดรับข้อสอบรอบนี้ คำตอบที่บันทึกแล้วยังอยู่',pre_required:'ส่งแบบทดสอบก่อนเรียนก่อนเริ่มหลังเรียน',limit:'ใช้สิทธิ์สอบครบแล้ว หากสอบแก้ตัวให้ติดต่อครู',forbidden:'เข้าถึงรายการนี้ไม่ได้',submitted:'ข้อสอบนี้ส่งแล้ว แก้คำตอบไม่ได้',conflict:'คำตอบเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดคำตอบล่าสุดก่อนทำต่อ'};throw fail(['forbidden','removed','archived'].includes(result.error)?403:result.error==='closed'?423:409,messages[result.error]||'ทำรายการไม่ได้');}
async function ownedClass(sql,id,user){const [c]=await sql`SELECT * FROM assessment_classes WHERE id=${uuid(id)} AND owner_id=${user.id}`;if(!c)throw fail(403,'ดูแลได้เฉพาะห้องเรียนของคุณ');return c;}
async function report(sql,classId,{page=1,query='',all=false,removed=false}={}){
 const [count]=await sql`SELECT count(*)::int n FROM assessment_enrollments WHERE class_id=${classId} AND (removed_at IS NOT NULL)=${removed} AND position(lower(${query}) in lower(student_code||' '||full_name))>0`;
 page=Math.max(1,Math.min(Math.ceil(count.n/20)||1,page));
 const students=await sql`SELECT user_id,student_code,full_name,post_limit,joined_at,removed_at FROM assessment_enrollments WHERE class_id=${classId} AND (removed_at IS NOT NULL)=${removed} AND position(lower(${query}) in lower(student_code||' '||full_name))>0 ORDER BY student_code,full_name LIMIT ${all?null:20} OFFSET ${all?0:(page-1)*20}`;
 const ids=students.map(s=>s.user_id);
 const attempts=await sql`SELECT id,user_id,phase,attempt_no,form_version,score,maximum,unit_scores,stars_snapshot,started_at,submitted_at FROM assessment_attempts WHERE class_id=${classId} AND user_id=ANY(${ids}::text[]) ORDER BY attempt_no`;
 const clears=await sql`SELECT user_id,floor,stars FROM dungeon_clears WHERE user_id=ANY(${ids}::text[]) AND campaign=2`;
 const [summary]=await sql`SELECT (SELECT count(*)::int FROM assessment_enrollments WHERE class_id=${classId} AND removed_at IS NULL) students,(SELECT count(*)::int FROM assessment_enrollments WHERE class_id=${classId} AND removed_at IS NOT NULL) removed,count(*) FILTER(WHERE phase='pre')::int pre,count(*) FILTER(WHERE phase='post')::int post,round(avg(score) FILTER(WHERE phase='post'),1) average FROM assessment_attempts a JOIN assessment_enrollments e USING(class_id,user_id) WHERE a.class_id=${classId} AND e.removed_at IS NULL AND attempt_no=1 AND submitted_at IS NOT NULL`;
 const rows=students.map(s=>{
  const all=attempts.filter(a=>a.user_id===s.user_id),pre=all.find(a=>a.phase==='pre'&&a.submitted_at)||null,posts=all.filter(a=>a.phase==='post'&&a.submitted_at),post=posts[0]||null;
  const currentStars=Array(12).fill(0);for(const c of clears.filter(c=>c.user_id===s.user_id))currentStars[c.floor]=c.stars;
  return {...s,pre,post,bestPost:posts.length?Math.max(...posts.map(a=>a.score)):null,retakes:Math.max(0,posts.length-1),inProgress:all.filter(a=>!a.submitted_at).map(a=>a.phase),stars:post?.stars_snapshot||currentStars,currentStars,attempts:all.map(({user_id,...a})=>a)};
 });return {rows,total:count.n,page,pageSize:20,summary,removed};
}
export default async function handler(req,res){
 noStore(res);
 try{
  if(!['GET','POST','PATCH'].includes(req.method))throw fail(405,'คำสั่งไม่ถูกต้อง');
  if(req.method!=='GET')requireOrigin(req);
  const user=await requireUser(req,res),sql=db(),url=new URL(req.url,'https://local');
  const [teacher]=await sql`SELECT user_id FROM assessment_teachers WHERE user_id=${user.id}`;
  const needTeacher=()=>{if(!teacher)throw fail(403,'หน้านี้สำหรับบัญชีครูที่ได้รับสิทธิ์เท่านั้น');};
  if(req.method==='GET'){
   const view=url.searchParams.get('view')||'home';
   if(view==='bank'){needTeacher();return json(res,200,{version:FORM_VERSION,units:UNITS,forms:FORMS});}
   if(view==='report'){
    needTeacher();const c=await ownedClass(sql,url.searchParams.get('id'),user),all=url.searchParams.get('format')==='csv';
    const result=await report(sql,c.id,{all,removed:url.searchParams.get('removed')==='1',page:Math.max(1,Math.floor(Number(url.searchParams.get('page'))||1)),query:all?'':(url.searchParams.get('q')||'').trim().slice(0,80)}),rows=result.rows;
    if(url.searchParams.get('format')==='csv'){
     const lines=[['รหัสนักเรียน','ชื่อ–นามสกุล','ห้องเรียน','ก่อนเรียน /24','ชุดก่อนเรียน รุ่น','หลังเรียนครั้งแรก /24','ชุดหลังเรียน รุ่น','เพิ่มขึ้น /24','หลังเรียนครั้งแรก /20','หลังเรียนดีที่สุด /24','สอบแก้ตัวแล้ว','ดาว ณ ส่งหลังเรียน /36','ดาวปัจจุบัน /36',...Array.from({length:12},(_,i)=>'ดาวด่าน '+(i+1)),'ส่งก่อนเรียน','ส่งหลังเรียน']];
     for(const r of rows)lines.push([r.student_code,r.full_name,c.name,r.pre?.score,r.pre?.form_version,r.post?.score,r.post?.form_version,r.pre&&r.post?r.post.score-r.pre.score:'',r.post?(r.post.score/24*20).toFixed(2):'',r.bestPost,r.retakes,r.post?r.stars.reduce((a,b)=>a+b,0):'',r.currentStars.reduce((a,b)=>a+b,0),...r.stars,stamp(r.pre?.submitted_at),stamp(r.post?.submitted_at)]);
     res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="python-dungeon-scores.csv"');res.statusCode=200;return res.end('\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n'));
    }return json(res,200,{class:c,...result});
   }
   if(view==='attempt'||view==='review'){
    const [a]=await sql`SELECT * FROM assessment_attempts WHERE id=${uuid(url.searchParams.get('id'))}`;
    if(!a)throw fail(404,'ไม่พบข้อสอบนี้');
    if(view==='review'){needTeacher();await ownedClass(sql,a.class_id,user);}else if(a.user_id!==user.id)throw fail(403,'ข้อสอบนี้เป็นของผู้เรียนอีกบัญชี');
    if(![1,2].includes(a.form_version))throw fail(503,'รุ่นข้อสอบนี้ต้องให้ครูตรวจสอบ');
    const [c]=await sql`SELECT id,name,pre_open,post_open,archived_at FROM assessment_classes WHERE id=${a.class_id}`;
    if(view==='attempt'){const [e]=await sql`SELECT removed_at FROM assessment_enrollments WHERE class_id=${a.class_id} AND user_id=${user.id}`;if(c.archived_at||!e||e.removed_at)throw fail(403,'ห้องนี้ถูกลบหรือคุณถูกนำออกจากห้องแล้ว ติดต่อครูเพื่อกู้คืน');}
    const {last_mutation,submission_id,user_id,...safe}=a;
    return json(res,200,{attempt:safe,class:c,questions:publicQuestions(a.phase,a.question_order,a.choice_order,a.form_version),...(view==='review'?{key:formFor(a.phase,a.form_version)}:{})});
   }
   if(view!=='home')throw fail(404,'ไม่พบหน้าข้อมูล');
   const memberships=await sql`SELECT c.id,c.name,c.media_url,c.pre_open,c.post_open,e.student_code,e.full_name,e.post_limit FROM assessment_enrollments e JOIN assessment_classes c ON c.id=e.class_id WHERE e.user_id=${user.id} AND e.removed_at IS NULL AND c.archived_at IS NULL ORDER BY c.created_at DESC`;
   const attempts=await sql`SELECT a.id,a.class_id,a.phase,a.attempt_no,a.score,a.maximum,a.unit_scores,a.stars_snapshot,a.started_at,a.submitted_at FROM assessment_attempts a JOIN assessment_enrollments e USING(class_id,user_id) JOIN assessment_classes c ON c.id=a.class_id WHERE a.user_id=${user.id} AND e.removed_at IS NULL AND c.archived_at IS NULL ORDER BY a.attempt_no`;
   const classes=teacher?await sql`SELECT c.*,count(e.user_id) FILTER(WHERE e.removed_at IS NULL)::int AS students FROM assessment_classes c LEFT JOIN assessment_enrollments e ON e.class_id=c.id WHERE c.owner_id=${user.id} GROUP BY c.id ORDER BY c.created_at DESC`:[];
   const clears=await sql`SELECT floor,stars FROM dungeon_clears WHERE user_id=${user.id} AND campaign=2 ORDER BY floor`;
   return json(res,200,{user:{id:user.id,name:user.name||'',email:user.email||'',teacher:!!teacher},memberships,attempts,classes,gameClears:clears,units:UNITS,formVersion:FORM_VERSION});
  }
  const data=await body(req);if(data.accountId!==user.id)throw fail(403,'บัญชีเปลี่ยน กรุณาเข้าสู่ระบบใหม่');
  if(data.action==='createClass'){
   needTeacher();const name=text(data.name,'ชื่อห้องเรียน',3,80),media=mediaUrl(data.mediaUrl),id=randomUUID(),code=randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
   await sql`INSERT INTO assessment_classes(id,owner_id,name,join_code,media_url) VALUES(${id},${user.id},${name},${code},${media})`;
   return json(res,201,{id,code});
  }
  if(data.action==='updateClass'){
   needTeacher();const c=await ownedClass(sql,data.classId,user),rev=revision(data.revision);
   if(typeof data.preOpen!=='boolean'||typeof data.postOpen!=='boolean')throw fail(400,'สถานะรอบสอบไม่ถูกต้อง');
   const name=text(data.name,'ชื่อห้องเรียน',3,80),media=mediaUrl(data.mediaUrl);
   const rows=await sql`UPDATE assessment_classes SET name=${name},media_url=${media},pre_open=${data.preOpen},post_open=${data.postOpen},revision=revision+1 WHERE id=${c.id} AND revision=${rev} AND archived_at IS NULL RETURNING revision`;
   if(!rows.length)throw fail(409,'ข้อมูลห้องเรียนเปลี่ยนแล้ว โหลดข้อมูลล่าสุดก่อนแก้ไข');return json(res,200,rows[0]);
  }
  if(data.action==='join'){
   const code=text(data.code,'รหัสเข้าห้อง',8,8).toUpperCase(),studentCode=text(data.studentCode,'รหัสนักเรียน',2,30),fullName=text(data.fullName,'ชื่อ–นามสกุล',3,100);
   const [r]=await sql`SELECT assessment_join(${user.id},${code},${studentCode},${fullName}) result`;
   return json(res,200,checked(r.result));
  }
  if(data.action==='start'){
   const classId=uuid(data.classId),phase=data.phase;if(!['pre','post'].includes(phase))throw fail(400,'ประเภทข้อสอบไม่ถูกต้อง');
   const order=UNITS.flatMap((_,unit)=>shuffled(FORMS[phase].filter(q=>q.unit===unit).map(q=>q.id))),choices={};
   for(const q of FORMS[phase])if(q.choices)choices[q.id]=shuffled(q.choices.map(c=>c.id));
   const [row]=await sql`SELECT assessment_start(${user.id},${classId},${phase},${randomUUID()},${JSON.stringify(order)}::jsonb,${JSON.stringify(choices)}::jsonb,${FORM_VERSION}) AS result`;
   return json(res,200,checked(row.result));
  }
  if(data.action==='draft'){
   const id=uuid(data.attemptId),rev=revision(data.revision),mutation=uuid(data.mutationId);
   const [a]=await sql`SELECT phase,form_version FROM assessment_attempts WHERE id=${id} AND user_id=${user.id}`;if(!a)throw fail(403,'เข้าถึงข้อสอบนี้ไม่ได้');
   let answers;try{answers=cleanAnswers(a.phase,data.answers,a.form_version);}catch{throw fail(400,'คำตอบมีรูปแบบไม่ถูกต้อง');}
   const [row]=await sql`SELECT assessment_save(${user.id},${id},${rev},${JSON.stringify(answers)}::jsonb,${mutation}) AS result`;
   return json(res,200,checked(row.result));
  }
  if(data.action==='submit'){
   const id=uuid(data.attemptId),rev=revision(data.revision),submission=uuid(data.submissionId);
   const [a]=await sql`SELECT phase,answers,revision,form_version FROM assessment_attempts WHERE id=${id} AND user_id=${user.id}`;if(!a)throw fail(403,'เข้าถึงข้อสอบนี้ไม่ได้');
   if(a.revision!==rev)throw fail(409,'คำตอบเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดคำตอบล่าสุด');
   const grade=gradeAnswers(a.phase,a.answers,a.form_version);
   const [row]=await sql`SELECT assessment_submit(${user.id},${id},${rev},${submission},${JSON.stringify(grade)}::jsonb) AS result`;
   return json(res,200,checked(row.result));
  }
  if(['archiveClass','restoreClass'].includes(data.action)){
   needTeacher();const c=await ownedClass(sql,data.classId,user),rev=revision(data.revision),archive=data.action==='archiveClass';
   const rows=await sql`UPDATE assessment_classes SET archived_at=CASE WHEN ${archive} THEN now() ELSE NULL END,pre_open=false,post_open=false,revision=revision+1 WHERE id=${c.id} AND revision=${rev} AND (archived_at IS NULL)=${archive} RETURNING revision`;
   if(!rows.length)throw fail(409,'สถานะห้องเปลี่ยนแล้ว โหลดข้อมูลล่าสุดก่อนทำรายการ');return json(res,200,rows[0]);
  }
  if(['removeStudent','restoreStudent'].includes(data.action)){
   needTeacher();const c=await ownedClass(sql,data.classId,user),uid=text(data.studentUserId,'ผู้เรียน',1,100),remove=data.action==='removeStudent';
   const rows=await sql`UPDATE assessment_enrollments SET removed_at=CASE WHEN ${remove} THEN now() ELSE NULL END WHERE class_id=${c.id} AND user_id=${uid} AND EXISTS(SELECT 1 FROM assessment_classes WHERE id=${c.id} AND archived_at IS NULL) AND (removed_at IS NULL)=${remove} RETURNING user_id`;
   if(!rows.length)throw fail(409,'รายชื่อเปลี่ยนหรือห้องถูกลบแล้ว โหลดข้อมูลล่าสุดก่อนทำรายการ');return json(res,200,{done:true});
  }
  if(data.action==='retake'){
   needTeacher();const c=await ownedClass(sql,data.classId,user),uid=text(data.studentUserId,'ผู้เรียน',1,100);
   const [row]=await sql`UPDATE assessment_enrollments e SET post_limit=post_limit+1 WHERE class_id=${c.id} AND user_id=${uid} AND e.removed_at IS NULL AND EXISTS(SELECT 1 FROM assessment_classes WHERE id=e.class_id AND archived_at IS NULL) AND post_limit<20 AND post_limit=(SELECT count(*) FROM assessment_attempts a WHERE a.class_id=e.class_id AND a.user_id=e.user_id AND a.phase='post' AND a.submitted_at IS NOT NULL) RETURNING post_limit`;
   if(!row)throw fail(409,'มีสิทธิ์สอบที่ยังไม่ได้ใช้ หรือยังไม่ได้ส่งหลังเรียนครั้งแรก');return json(res,200,row);
  }
  if(data.action==='editStudent'){
   needTeacher();const c=await ownedClass(sql,data.classId,user),uid=text(data.studentUserId,'ผู้เรียน',1,100),name=text(data.fullName,'ชื่อ–นามสกุล',3,100),code=text(data.studentCode,'รหัสนักเรียน',2,30);
   const rows=await sql`UPDATE assessment_enrollments SET full_name=${name},student_code=${code} WHERE class_id=${c.id} AND user_id=${uid} AND removed_at IS NULL AND EXISTS(SELECT 1 FROM assessment_classes WHERE id=${c.id} AND archived_at IS NULL) RETURNING student_code`;
   if(!rows.length)throw fail(404,'ไม่พบผู้เรียนในห้องนี้');return json(res,200,rows[0]);
  }
  throw fail(400,'ไม่พบคำสั่งนี้');
 }catch(error){if(error.code==='23505')return json(res,409,{error:'รหัสนักเรียนนี้ถูกใช้ในห้องแล้ว ให้ครูตรวจสอบรายชื่อ'});handleError(res,error);}
}
