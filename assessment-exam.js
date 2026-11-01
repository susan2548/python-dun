import {tokenCode,tokenChoices,bindTokens} from './assessment-tokens.js?v=1';
import {CloudSaveQueue} from './cloud-save.js?v=1';
import {$,esc,when,api,errorBox,download,localRead,localWrite} from './assessment-client.js?v=1';
import {showModal,closeModal} from './ui-dialog.js?v=1';
let flush=async()=>true;
export const flushExam=()=>flush();
const labels={pending:'มีคำตอบใหม่ รอบันทึก…',syncing:'กำลังบันทึกบนบัญชี…',saved:'✓ บันทึกบนบัญชีแล้ว',offline:'เชื่อมต่อไม่ได้ · คำตอบยังอยู่บนเครื่องนี้',conflict:'มีคำตอบใหม่จากอีกหน้าต่าง · หยุดบันทึกเพื่อป้องกันข้อมูลทับกัน',expired:'บัญชีหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',invalid:'ข้อมูลคำตอบต้องตรวจสอบ'};
export async function mountExam({id,home}){
 const result=await api('?view=attempt&id='+encodeURIComponent(id)),a=result.attempt,questions=result.questions,c=result.class,phase=a.phase==='pre'?'ก่อนเรียน':'หลังเรียน';
 const key='python-dungeon-assessment:'+home.user.id+':'+a.id;
 if(a.submitted_at){try{localStorage.removeItem(key);}catch{}renderResult(a,c,home);return;}
 let answers=structuredClone(a.answers),index=0,queue,timer,meta={revision:a.revision,dirty:false},state='saved',locked=false,expired=false,storageAvailable=true,allowLeave=false;
 const cached=localRead(key),usable=cached&&(cached.meta?.dirty||Date.now()-cached.updatedAt<72*60*60*1000);
 // An uncertain acknowledgement must retry its original mutation, never overwrite a newer revision.
 if(usable&&cached.meta?.dirty&&cached.meta.revision!==a.revision&&!cached.meta.job){
  $('#portal').innerHTML=`<section class="panel result-paper"><h1>พบคำตอบจากอีกหน้าต่าง</h1><p>คำตอบบนบัญชีเปลี่ยนแล้ว จึงยังไม่นำฉบับค้างบนเครื่องไปทับ</p><div class="actions"><button class="btn ghost" id="backupDraft">ดาวน์โหลดฉบับบนเครื่อง</button><button class="btn" id="useServerDraft">ใช้คำตอบล่าสุดบนบัญชี</button></div></section>`;
  $('#backupDraft').onclick=()=>download('assessment-local-backup.json',JSON.stringify(cached.answers,null,2));
  $('#useServerDraft').onclick=()=>{localWrite(key+':backup',cached);localStorage.removeItem(key);location.reload();};return;
 }
 const stash=()=>{storageAvailable=localWrite(key,{answers,meta,updatedAt:Date.now()});};
 queue=new CloudSaveQueue({accountId:home.user.id,revision:a.revision,
  send:job=>api('',{action:'draft',attemptId:a.id,revision:job.revision,mutationId:job.mutationId,answers:job.save.answers}),
  onState:next=>{state=next;paintStatus();if(queue?.blocked&&$('#examQuestion')?.firstElementChild)paintQuestion();},onMeta:next=>{meta=next;stash();}
 });
 if(usable&&cached.meta?.dirty){answers=cached.answers;queue.job=cached.meta.job||null;queue.stage({answers});}
 if(usable&&cached.submissionId)localWrite(key,{...cached,answers,meta,updatedAt:Date.now()});
 flush=async()=>{clearTimeout(timer);return queue.flush();};
 function paintStatus(){
  const target=$('#examSave');if(!target)return;
  target.dataset.state=state;target.innerHTML=`<span role="status">${esc(labels[state])}</span>${!storageAvailable?'<br><span>พื้นที่เก็บบนเครื่องใช้ไม่ได้ รอ “บันทึกบนบัญชีแล้ว” ก่อนออก</span>':''}${['offline','conflict','expired','invalid'].includes(state)?'<br><button class="text-btn" id="saveAgain">'+(queue.blocked?'ดาวน์โหลดคำตอบ':'ลองบันทึกอีกครั้ง')+'</button>':''}${state==='conflict'?'<br><button class="text-btn" id="resolveExamConflict">โหลดฉบับบนบัญชี</button>':''}${state==='expired'?'<br><a href="/game?return=/assessment#login">เข้าสู่ระบบอีกครั้ง</a>':''}`;
  $('#saveAgain')?.addEventListener('click',()=>queue.blocked?download('assessment-local-backup.json',JSON.stringify(answers,null,2)):flush());
  $('#resolveExamConflict')?.addEventListener('click',()=>{showModal('<h2>โหลดฉบับบนบัญชี?</h2><p>ฉบับค้างบนเครื่องจะเก็บเป็นสำเนาไว้ก่อน คำตอบจากหน้าต่างอื่นจะเป็นฉบับหลัก</p><div class="modal-actions"><button class="btn" id="confirmServerDraft">ใช้ฉบับบนบัญชี</button><button class="btn ghost" data-close>ยกเลิก</button></div>');$('#confirmServerDraft').onclick=()=>{localWrite(key+':backup',{answers,meta,updatedAt:Date.now()});localStorage.removeItem(key);allowLeave=true;location.reload();};});
 }
 function answered(){return questions.filter(q=>answers[q.id]?.trim()).length;}
 function paintProgress(){
  $('#answeredCount').textContent=answered();$('#examProgress').style.width=answered()/questions.length*100+'%';
  document.querySelectorAll('[data-question]').forEach((b,i)=>{b.classList.toggle('answered',!!answers[questions[i].id]?.trim());b.setAttribute('aria-current',String(index===i));b.setAttribute('aria-label',`ข้อ ${i+1}${answers[questions[i].id]?.trim()?' ตอบแล้ว':' ยังไม่ตอบ'}${index===i?' ข้อปัจจุบัน':''}`);});
 }
 function changed(q,value){
  if(locked||expired||queue.blocked)return;
  answers[q.id]=value;queue.stage({answers});clearTimeout(timer);timer=setTimeout(()=>queue.flush(),600);paintProgress();
 }
 function paintQuestion(focus=false){
  const q=questions[index];
  $('#examQuestion').innerHTML=`<div class="exam-card"><div class="exam-unit">หน่วย ${q.unit+1} · ${esc(home.units[q.unit])}</div><h2 id="questionHeading" tabindex="-1"><span class="muted">${index+1}.</span> ${esc(q.prompt)}</h2>${q.type==='code-choice'?tokenCode(q,answers[q.id],locked||expired||queue.blocked):q.code?`<pre class="exam-code"><code>${esc(q.code)}</code></pre>`:''}${q.type==='code-choice'?tokenChoices(q,answers[q.id],locked||expired||queue.blocked):q.type==='choice'?`<fieldset aria-labelledby="questionHeading"><legend>เลือกคำตอบที่ถูกต้องเพียงข้อเดียว</legend>${q.choices.map((choice,i)=>`<label class="answer-choice"><input type="radio" name="answer" value="${choice.id}" ${answers[q.id]===choice.id?'checked':''} ${locked||expired||queue.blocked?'disabled':''}><span><span class="tiny">${['ก','ข','ค','ง'][i]}.</span>${esc(choice.text)}</span></label>`).join('')}</fieldset>`:`<label class="field" for="fillAnswer">เติมโค้ดแทน ____<input class="answer-input" id="fillAnswer" type="text" value="${esc(answers[q.id]||'')}" maxlength="160" autocomplete="off" autocapitalize="off" spellcheck="false" ${locked||expired||queue.blocked?'disabled':''} aria-describedby="fillHelp"></label><p class="help" id="fillHelp">เติมเฉพาะคำ ตัวเลข หรือตัวดำเนินการที่หายไป ไม่ต้องเขียนโปรแกรมทั้งบรรทัด · ตัวพิมพ์เล็ก–ใหญ่มีผล</p>`}<div class="exam-navigation"><button class="btn ghost" id="previousQuestion" ${index===0?'disabled':''}>← ข้อก่อนหน้า</button><button class="btn" id="nextQuestion">${index===questions.length-1?'ตรวจทานคำตอบ':'ข้อถัดไป →'}</button></div></div>`;
  document.querySelectorAll('[name=answer]').forEach(input=>input.onchange=()=>changed(q,input.value));
  if(q.type==='code-choice')bindTokens($('#examQuestion'),q,{value:answers[q.id]||'',disabled:locked||expired||queue.blocked,onChange:value=>changed(q,value)});
  const fill=$('#fillAnswer');if(fill){fill.oninput=e=>{if(!e.isComposing)changed(q,fill.value);};fill.oncompositionend=()=>changed(q,fill.value);}
  $('#previousQuestion').onclick=()=>go(index-1);$('#nextQuestion').onclick=()=>index===questions.length-1?review():go(index+1);
  paintProgress();if(focus)$('#questionHeading').focus({preventScroll:true});
 }
 function go(i){index=i;paintQuestion(true);$('#examQuestion').scrollIntoView({behavior:'instant',block:'start'});}
 function review(){
  if(locked)return;
  const missing=questions.map((q,i)=>!answers[q.id]?.trim()?i:null).filter(i=>i!==null);
  showModal(`<span class="inscription">REVIEW YOUR CHRONICLE</span><h2>ตรวจทานก่อนส่ง</h2><p>ตอบแล้ว <strong>${answered()} / ${questions.length} ข้อ</strong></p>${missing.length?`<div class="notice warning">ยังไม่ตอบ ${missing.length} ข้อ · ข้อว่างจะได้ 0 คะแนน แต่ส่งได้</div><div class="question-grid">${missing.map(i=>`<button class="question-dot" data-missing="${i}" aria-label="กลับไปข้อ ${i+1}">${i+1}</button>`).join('')}</div>`:'<p class="notice">ตอบครบทุกข้อแล้ว พร้อมส่งตรวจ</p>'}<p class="help">ส่งแล้วจะแก้คำตอบชุดนี้ไม่ได้ ระบบจะตรวจคำตอบที่บันทึกบนบัญชีเท่านั้น</p><div id="submitError"></div><div class="modal-actions"><button class="btn gold" id="submitExam">ยืนยันส่งแบบ${phase}</button><button class="btn ghost" data-close>กลับไปตรวจคำตอบ</button></div>`);
  document.querySelectorAll('[data-missing]').forEach(b=>b.onclick=()=>{closeModal();go(Number(b.dataset.missing));});
  $('#submitExam').onclick=submit;
 }
 async function submit(){
  if(locked)return;locked=true;paintQuestion();const b=$('#submitExam');b.disabled=true;b.textContent='กำลังบันทึกและส่ง…';
  try{
   if(!await flush())throw Error('ยังบันทึกคำตอบไม่สำเร็จ กรุณาจัดการสถานะการบันทึกก่อนส่ง');
   const saved=localRead(key)||{},submissionId=saved.submissionId||crypto.randomUUID();localWrite(key,{...saved,submissionId,updatedAt:Date.now()});
   await api('',{action:'submit',attemptId:a.id,revision:queue.revision,submissionId});
   localStorage.removeItem(key);location.reload();
  }catch(error){
   // A timeout may be a lost acknowledgement. Check before allowing a repeat.
   if(!error.status){try{const latest=await api('?view=attempt&id='+a.id);if(latest.attempt.submitted_at){localStorage.removeItem(key);location.reload();return;}}catch{}}
   if($('#submitError')){$('#submitError').innerHTML=errorBox(error);b.disabled=false;b.textContent='ลองส่งอีกครั้ง';}locked=false;paintStatus();paintQuestion();
  }
 }
 document.title=`แบบ${phase} — Python Dungeon`;
 $('#portal').innerHTML=`<div class="exam-heading"><div><span class="inscription">${a.phase==='pre'?'BEFORE THE JOURNEY':'AFTER THE JOURNEY'}</span><h1>แบบทดสอบ${phase}</h1><p>${esc(c.name)} · ครั้งที่ ${a.attempt_no} · 24 ข้อ · ชุดรุ่น ${a.form_version}</p></div><div class="save-status" id="examSave"></div></div>${!c[a.phase+'_open']?'<div class="notice warning">ครูปิดรอบนี้แล้ว ยังบันทึกและเปิดคำตอบค้างได้ รอครูเปิดรอบอีกครั้งจึงส่งได้</div>':''}<div class="exam-layout"><div id="examQuestion"></div><aside class="exam-sidebar" aria-label="ความคืบหน้าข้อสอบ"><h2>สมุดคำตอบ</h2><p class="muted">ตอบแล้ว <strong id="answeredCount">0</strong> / 24 ข้อ</p><div class="exam-progress" aria-hidden="true"><span id="examProgress"></span></div><div class="question-grid">${questions.map((_,i)=>`<button class="question-dot" data-question="${i}">${i+1}</button>`).join('')}</div><p class="help">เขียว = ตอบแล้ว · ขอบทอง = ข้อปัจจุบัน<br>ข้ามข้อและกลับมาแก้ได้ก่อนส่ง</p><button class="btn gold" id="reviewExam">ตรวจทานและส่ง</button><a class="text-btn" style="display:block;margin-top:12px" href="/assessment?class=${c.id}">กลับห้องเรียน</a><p class="help">ทำด้วยตนเอง ไม่ต้องใช้คำสั่งโจมตีจากเกม ไม่มีการหักคะแนนจากเวลาที่ใช้</p></aside></div>`;
 document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>go(Number(b.dataset.question)));
 $('#reviewExam').onclick=review;paintQuestion();paintStatus();
 if(queue.latest||queue.job)queue.flush();
 window.addEventListener('online',()=>queue.flush());
 window.addEventListener('beforeunload',e=>{if(!allowLeave&&(queue.latest||queue.job)){e.preventDefault();e.returnValue='';}});
 document.addEventListener('click',async e=>{
  const anchor=e.target.closest('a[href]');if(!anchor||anchor.target==='_blank'||anchor.origin!==location.origin||e.ctrlKey||e.metaKey||e.shiftKey)return;
  if(queue.latest||queue.job){e.preventDefault();if(await flush())location.assign(anchor.href);else{showModal('<h2>คำตอบยังอยู่บนเครื่องนี้</h2><p>ยังส่งขึ้นบัญชีไม่ได้ เก็บสำเนาไว้ได้ และลองบันทึกใหม่เมื่อเชื่อมต่อแล้ว</p><div class="modal-actions"><button class="btn ghost" id="downloadPending">ดาวน์โหลดคำตอบ</button><button class="btn" data-close>กลับไปลองบันทึก</button></div>');$('#downloadPending').onclick=()=>download('assessment-local-backup.json',JSON.stringify(answers,null,2));}}
 });
 window.addEventListener('storage',e=>{if(e.key==='python-dungeon-rpg-v1:last-user'){const next=localRead(e.key);if(next?.id!==home.user.id){expired=true;queue.blocked=true;state='expired';paintStatus();paintQuestion();}}});
}
function renderResult(a,c,home){
 const phase=a.phase==='pre'?'ก่อนเรียน':'หลังเรียน';
 document.title='ผล'+phase+' — Python Dungeon';
 $('#portal').innerHTML=`<section class="panel result-paper"><span class="inscription">CHRONICLE SEALED</span><h1>บันทึกผล${phase}แล้ว</h1><p class="muted">${esc(c.name)} · ครั้งที่ ${a.attempt_no}<br>ส่งเมื่อ ${when(a.submitted_at)}</p><div class="result-big">${a.score}<small> / ${a.maximum} คะแนน</small></div><p>${a.phase==='pre'?'นี่คือจุดเริ่มต้น ใช้ผลนี้วางแผนฝึกและเรียนต่อกับครู':'ผลนี้แสดงความเข้าใจหลังเรียน ครูจะพิจารณาร่วมกับหลักฐานการฝึกและการปฏิบัติ'}</p><ul class="unit-list">${a.unit_scores.map(u=>`<li><span>${u.unit+1}. ${esc(u.name)}</span><strong>${u.score} / ${u.maximum}</strong></li>`).join('')}</ul>${a.phase==='post'?`<p class="notice">ดาวเกม ณ ส่งครั้งนี้: ★ ${(a.stars_snapshot||[]).reduce((s,n)=>s+n,0)} / 36 · เก็บแยกจากคะแนนสอบ</p>`:''}<p class="help">ส่งแล้วแก้คำตอบไม่ได้ ${a.attempt_no>1?'การสอบครั้งนี้ไม่แทนผลครั้งแรก':''} · เฉลยอยู่กับครูเพื่อใช้ทบทวนในชั้นเรียน</p><div class="actions"><a class="btn" href="/assessment?class=${c.id}">กลับห้องเรียน →</a><a class="btn ghost" href="/game">เข้าเกม</a></div></section>`;
}
