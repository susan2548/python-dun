import {CloudSaveQueue} from './cloud-save.js?v=1';
const ROOT='python-dungeon-rpg-v1',META=ROOT+':meta:',LAST=ROOT+':last-user';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const states={guest:'ฝึกบนเครื่องนี้',loading:'กำลังตรวจบัญชี…',pending:'รอบันทึก',syncing:'กำลังบันทึก…',saved:'บันทึกบนบัญชีแล้ว',offline:'เชื่อมต่อไม่ได้ • เก็บบนเครื่องแล้ว',expired:'กรุณาเข้าสู่ระบบอีกครั้ง',conflict:'มีเซฟใหม่จากอีกหน้าต่าง',invalid:'ข้อมูลเซฟต้องตรวจสอบ'};
let hooks,user=null,profile=null,queue=null,status='loading',ready=false,timer,authClient,transition=false,viewGeneration=0;
const listeners=new Set();
export const learner={
 get key(){return user?ROOT+':'+user.id:ROOT;},get user(){return user;},get ready(){return ready;},
 canPlay(){return ready&&!transition&&!queue?.blocked;},
 save(snapshot){if(!user||!queue)return;queue.stage(snapshot);clearTimeout(timer);timer=setTimeout(()=>queue.flush(),700);},
 recordVictory(battle,classId){if(user&&queue)queue.addClear({id:crypto.randomUUID(),floor:battle.level,classId,answers:battle.answeredQuestions,mistakes:battle.mistakes,enemyHp:0});},
 openAccount,openDashboard,
 refresh:paintAccount,
};
function announce(next){status=next;paintAccount();for(const listener of listeners)listener();}
function paintAccount(){
 const b=$('#accountBtn');if(b){b.textContent=user?(profile?.nickname||'บัญชีผู้เรียน'):'เข้าสู่ระบบ';b.disabled=!ready||transition;}
 if($('#startBtn'))$('#startBtn').disabled=!learner.canPlay();
 if($('#rankingBtn'))$('#rankingBtn').disabled=!ready||transition;
 const s=$('#syncStatus');if(s){s.textContent=states[status];s.dataset.state=status;}
 if($('#dashboardSync'))$('#dashboardSync').textContent=states[status];
 const recover=$('#syncRetry');if(recover){recover.hidden=!['offline','expired','conflict','invalid'].includes(status);recover.textContent=['conflict','invalid'].includes(status)?'จัดการเซฟ':status==='expired'?'เข้าสู่ระบบอีกครั้ง':'ลองบันทึกอีกครั้ง';}
}
async function api(path,options={}){
 let response;try{response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...options,headers:{'Content-Type':'application/json',...options.headers}});}catch{throw Error('การเชื่อมต่อขัดข้อง กรุณาลองอีกครั้ง');}
 let data;try{data=await response.json();}catch{throw Error('ระบบผู้เรียนยังไม่พร้อม กรุณาลองอีกครั้ง');}
 if(!response.ok)throw Object.assign(new Error(data.error||'เชื่อมต่อไม่ได้'),{status:response.status});return data;
}
async function auth(){return authClient??=import('./vendor/neon-auth.js').then(({createAuthClient})=>createAuthClient(undefined,{fetchOptions:{timeout:15000}}));}
function setQueue(revision,pending=[]){
 const owner=user.id;let instance;
 instance=new CloudSaveQueue({accountId:owner,revision,clears:pending,
  send:job=>api('/api/player',{method:'PUT',body:JSON.stringify(job)}),
  onState:state=>{if(user?.id===owner&&queue===instance)announce(state);},onMeta:meta=>localStorage.setItem(META+owner,JSON.stringify(meta)),
 });
 queue=instance;
}
export async function mountLearners(callbacks){
 hooks=callbacks;
 $('#accountBtn').onclick=openAccount;$('#rankingBtn').onclick=()=>openDashboard();
 $('#syncRetry').onclick=()=>status==='expired'?openAccount():['conflict','invalid'].includes(status)?resolveConflict():queue?.flush();
 try{
  const session=await api('/api/auth/get-session');
  if(session?.user)await activate(session.user);
  else announce('guest');
 }catch{announce('offline');}
 finally{ready=true;paintAccount();if(location.hash.startsWith('#ranking')&&!$('.modal-backdrop'))openDashboard(Number(new URLSearchParams(location.hash.split('?')[1]||'').get('page'))||1);}
 window.addEventListener('online',()=>queue?.flush());
 window.addEventListener('storage',e=>{
  if(e.key===LAST&&user?.id!==read(LAST)?.id){queue&&(queue.blocked=true);announce('expired');}
 });
}
async function activate(nextUser,{nickname:chosen}={}){
 transition=true;paintAccount();
 const remote=await api('/api/player');
 if(remote.accountId!==nextUser.id)throw Error('บัญชีเปลี่ยนระหว่างโหลด กรุณาเข้าสู่ระบบใหม่');
 const local=read(ROOT+':'+nextUser.id),meta=read(META+nextUser.id,{});
 user=nextUser;profile=remote;localStorage.setItem(LAST,JSON.stringify({id:user.id}));
 const useLocal=local&&meta.dirty&&meta.revision===remote.revision;
 setQueue(remote.revision,useLocal?meta.clears||[]:[]);
 if(useLocal&&meta.job)queue.job=meta.job;
 hooks.onIdentity(useLocal?local:remote.save);
 announce('saved');ready=true;transition=false;paintAccount();
 if(chosen&&!profile.nickname){await saveNickname(chosen);}
 if(local&&meta.dirty&&meta.revision!==remote.revision){await resolveConflict({local,remote,meta});return;}
 if(useLocal){queue.stage(local);queue.flush();}
 if(!remote.save&&!useLocal){
  const guest=read(ROOT);
  if(guest?.classId)offerImport(guest);
  else {hooks.persist();if(!profile.nickname)openNickname();}
 }
}
function offerImport(guest){
 hooks.showModal(`<span class="eyebrow">YOUR JOURNEY</span><h2>ใช้ความคืบหน้าบนเครื่องนี้?</h2><p>บัญชีนี้ยังไม่มีเซฟ เลือกเริ่มใหม่หรือคัดลอกเซฟที่เคยฝึกบนเครื่องนี้เข้าบัญชีของคุณ</p><p class="muted">ผลเก่าจะเก็บไว้เล่นต่อได้ ส่วนอันดับเริ่มนับด่านที่ผ่านขณะล็อกอิน</p><div class="modal-actions"><button class="btn" id="importGuest">ใช้เซฟบนเครื่องนี้</button><button class="btn ghost" id="startAccountFresh">เริ่มใหม่ในบัญชีนี้</button></div>`);
 $('#importGuest').onclick=()=>{hooks.onIdentity(guest);hooks.persist();hooks.closeModal();if(!profile.nickname)openNickname();};
 $('#startAccountFresh').onclick=()=>{hooks.persist();hooks.closeModal();if(!profile.nickname)openNickname();};
}
async function saveNickname(name){profile={...profile,...await api('/api/player',{method:'PATCH',body:JSON.stringify({accountId:user.id,nickname:name})})};paintAccount();}
function openNickname(){
 hooks.showModal(`<span class="eyebrow">ADVENTURER NAME</span><h2>ชื่อของคุณบนตารางอันดับ</h2><form novalidate id="nicknameForm"><label class="account-field" for="nickname">ชื่อในเกม<input id="nickname" name="nickname" maxlength="24" autocomplete="nickname" value="${esc(profile?.nickname||'')}" aria-describedby="nameHelp nameError"></label><p id="nameHelp">2–24 ตัวอักษร ใช้ชื่อเล่นได้ ชื่อนี้จะแสดงเมื่อคุณจบครบ 12 ด่าน อีเมลจะไม่แสดงบนตาราง</p><p class="account-error" id="nameError" role="alert"></p><div class="modal-actions"><button class="btn" type="submit">บันทึกชื่อ</button><button class="btn ghost" type="button" data-close>ไว้ภายหลัง</button></div></form>`);
 $('#nicknameForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await saveNickname($('#nickname').value);hooks.closeModal();hooks.toast('บันทึกชื่อในเกมแล้ว');}catch(error){$('#nameError').textContent=error.message;$('#nickname').setAttribute('aria-invalid','true');$('#nickname').focus();}finally{b.disabled=false;}};
}
async function resolveConflict(details){
 if(!hooks.canSwitch())return hooks.toast('รอจบเทิร์นนี้ก่อนจัดการเซฟ');
 try{
  const remote=details?.remote||await api('/api/player'),local=details?.local||hooks.getSave(),meta=details?.meta||read(META+user.id,{});
  hooks.showModal(`<span class="eyebrow">SAVE CONFLICT</span><h2>พบเซฟจากอีกเครื่อง</h2><p>เลือกเซฟที่ต้องการใช้ เราจะเก็บสำเนาบนเครื่องไว้ก่อนเปลี่ยน</p><p>เซฟบนบัญชี: ${remote.save?.stars?.filter(Boolean).length||0}/12 ด่าน<br>เซฟบนเครื่อง: ${local?.stars?.filter(Boolean).length||0}/12 ด่าน</p><div class="modal-actions"><button class="btn" id="useRemote">ใช้เซฟบนบัญชี</button><button class="btn ghost" id="useLocal">ใช้เซฟบนเครื่องแทน</button></div>`);
  queue.blocked=true;announce('conflict');
  const choose=useLocal=>{localStorage.setItem(ROOT+':backup:'+user.id,JSON.stringify(local));setQueue(remote.revision,useLocal?meta.clears||[]:[]);hooks.onIdentity(useLocal?local:remote.save);hooks.closeModal();hooks.persist();queue.flush();};
  $('#useRemote').onclick=()=>choose(false);$('#useLocal').onclick=()=>choose(true);
 }catch(error){hooks.toast(error.message);}
}
export function openAccount(){
 if(!hooks.canSwitch())return hooks.toast('รอจบเทิร์นนี้ก่อนเปลี่ยนบัญชี');
 if(user&&status!=='expired'){
  hooks.showModal(`<span class="eyebrow">LEARNER ACCOUNT</span><h2>${esc(profile?.nickname||'บัญชีผู้เรียน')}</h2><p>${esc(states[status])}</p><div class="modal-actions"><button class="btn" id="myDashboard">ดูผลและอันดับ</button><button class="btn ghost" id="editNickname">เปลี่ยนชื่อในเกม</button><button class="btn ghost" id="signOut">ออกจากระบบ</button><button class="btn ghost" data-close>ปิด</button></div><p id="logoutError" class="account-error" role="alert"></p>`);
  $('#myDashboard').onclick=()=>{hooks.closeModal();openDashboard();};$('#editNickname').onclick=openNickname;
  $('#signOut').onclick=async()=>{const b=$('#signOut');b.disabled=true;try{await queue?.flush();const result=await(await auth()).signOut();if(result.error)throw Error('ออกจากระบบไม่ได้ กรุณาลองอีกครั้ง');clearTimeout(timer);queue=null;user=null;profile=null;localStorage.removeItem(LAST);hooks.onIdentity(read(ROOT));announce('guest');hooks.closeModal();}catch(error){$('#logoutError').textContent=error.message;b.disabled=false;}};
  return;
 }
 loginForm('login');
}
function loginForm(mode,email=''){
 const register=mode==='register',reset=mode==='reset';
 hooks.showModal(`<span class="eyebrow">RUNEBREAKER GUILD</span><h2>${register?'สมัครบัญชีผู้เรียน':reset?'ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ'}</h2><p>เซฟแยกตามผู้เรียน • เล่นต่อข้ามเครื่อง • สะสมอันดับเมื่อจบ 12 ด่าน</p><form novalidate id="authForm">
 ${register?'<label class="account-field" for="authName">ชื่อในเกม (แสดงบนตารางอันดับ)<input id="authName" name="nickname" autocomplete="nickname" maxlength="24" aria-describedby="authError"></label>':''}
 <label class="account-field" for="authEmail">อีเมล<input id="authEmail" name="email" type="email" autocomplete="username" value="${esc(email)}" aria-describedby="authError"></label>
 ${reset?'<label class="account-field" for="authOtp">รหัส 6 หลักจากอีเมล<input id="authOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-describedby="authError"></label><button class="btn ghost small" id="sendReset" type="button">ส่งรหัสไปอีเมล</button>':''}
 <label class="account-field" for="authPassword">${reset?'รหัสผ่านใหม่':'รหัสผ่าน'}<span class="password-wrap"><input id="authPassword" name="password" type="password" autocomplete="${register||reset?'new-password':'current-password'}" minlength="8" maxlength="128" aria-describedby="passwordHelp authError"><button type="button" id="showPassword" aria-pressed="false" aria-label="แสดงรหัสผ่าน">แสดง</button></span></label>
 <p id="passwordHelp">${register||reset?'ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร':'ใช้รหัสผ่านที่สมัครไว้กับเกม'}</p>
 ${register?'<label class="account-field" for="authConfirm">ยืนยันรหัสผ่าน<input id="authConfirm" type="password" autocomplete="new-password" aria-describedby="authError"></label>':''}
 <p class="account-error" id="authError" role="alert"></p><p class="account-feedback" id="authFeedback" role="status"></p>
 <div class="modal-actions"><button class="btn account-submit" type="submit">${register?'สร้างบัญชี':reset?'ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ'}</button><button class="btn ghost" type="button" data-close>เล่นแบบฝึกบนเครื่อง</button></div>
 <div class="auth-links"><button type="button" id="authToggle">${register||reset?'มีบัญชีแล้ว • เข้าสู่ระบบ':'ยังไม่มีบัญชี • สมัครเลย'}</button>${mode==='login'?'<button type="button" id="forgotPassword">ลืมรหัสผ่าน</button>':''}</div>
 </form><p class="account-privacy">อีเมลใช้สำหรับบัญชีและกู้รหัสผ่าน ตารางอันดับแสดงเฉพาะชื่อในเกม อาชีพ ดาว และวันที่จบ</p>`);
 $('#authToggle').onclick=()=>loginForm(mode==='login'?'register':'login',$('#authEmail').value);
 $('#forgotPassword')&&($('#forgotPassword').onclick=()=>loginForm('reset',$('#authEmail').value));
 $('#showPassword').onclick=()=>{const show=$('#authPassword').type==='password';$('#authPassword').type=show?'text':'password';$('#showPassword').textContent=show?'ซ่อน':'แสดง';$('#showPassword').setAttribute('aria-pressed',String(show));$('#showPassword').setAttribute('aria-label',show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน');};
 const problem=(message,field)=>{$('#authError').textContent=message;const el=$(field);el?.setAttribute('aria-invalid','true');el?.focus();};
 $('#sendReset')&&($('#sendReset').onclick=async()=>{const b=$('#sendReset');b.disabled=true;try{const result=await(await auth()).emailOtp.sendVerificationOtp({email:$('#authEmail').value.trim(),type:'forget-password'});if(result.error)throw Error('ส่งรหัสไม่ได้ ตรวจอีเมลและลองอีกครั้ง');$('#authFeedback').textContent='หากมีบัญชีนี้ ระบบจะส่งรหัสให้ ตรวจกล่องจดหมายและสแปม';}catch(error){problem(error.message,'#authEmail');}finally{b.disabled=false;}});
 $('#authForm').onsubmit=async e=>{
  e.preventDefault();if(transition)return;
  const email=$('#authEmail').value.trim(),password=$('#authPassword').value,name=$('#authName')?.value.trim(),b=e.submitter;
  $('#authError').textContent='';$('#authForm').querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return problem('กรอกอีเมลให้ครบ เช่น student@example.com','#authEmail');
  if(password.length<8||password.length>128)return problem('รหัสผ่านต้องยาว 8–128 ตัวอักษร','#authPassword');
  if(register&&(name.length<2||name.length>24||/[<>@\p{Cc}\p{Cf}]/u.test(name)))return problem('ใช้ชื่อเล่นยาว 2–24 ตัวอักษร ไม่ใช่อีเมล','#authName');
  if(register&&password!==$('#authConfirm').value)return problem('รหัสผ่านสองช่องยังไม่ตรงกัน','#authConfirm');
  if(reset&&!/^\d{6}$/.test($('#authOtp').value.trim()))return problem('กรอกรหัส 6 หลักจากอีเมล','#authOtp');
  transition=true;b.disabled=true;b.setAttribute('aria-busy','true');$('#authFeedback').textContent='กำลังดำเนินการ…';
  try{
   const client=await auth(),result=reset?await client.emailOtp.resetPassword({email,otp:$('#authOtp').value.trim(),password}):register?await client.signUp.email({email,password,name}):await client.signIn.email({email,password});
   if(result.error)throw Error(reset?'รหัสอีเมลไม่ถูกต้องหรือหมดอายุ ลองส่งรหัสใหม่':register?'สร้างบัญชีไม่ได้ อีเมลอาจถูกใช้แล้ว ลองเข้าสู่ระบบหรือกู้รหัสผ่าน':'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่');
   if(reset){transition=false;loginForm('login',email);$('#authFeedback').textContent='ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย';return;}
   const session=await api('/api/auth/get-session');if(!session?.user)throw Error('ยังยืนยันการเข้าสู่ระบบไม่ได้ กรุณาตรวจอีเมลแล้วลองเข้าสู่ระบบอีกครั้ง');
   hooks.closeModal();await activate(session.user,{nickname:register?name:undefined});hooks.toast('เข้าสู่ระบบแล้ว • โหลดเซฟของคุณเรียบร้อย');
  }catch(error){
   const message=/[\u0E00-\u0E7F]/.test(error.message)?error.message:reset?'รหัสอีเมลไม่ถูกต้องหรือหมดอายุ กรุณาส่งรหัสใหม่':register?'สร้างบัญชีไม่สำเร็จ ตรวจข้อมูลหรือลองเข้าสู่ระบบด้วยบัญชีเดิม':'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่';
   if($('#authError'))problem(message,'#authEmail');else hooks.toast(message);
  }
  finally{transition=false;paintAccount();if(b.isConnected){b.disabled=false;b.removeAttribute('aria-busy');$('#authFeedback').textContent='';}}
 };
}
export async function openDashboard(page=1){
 if(!hooks.canSwitch())return hooks.toast('รอจบเทิร์นนี้ก่อนดูอันดับ');
 hooks.beforeDashboard();hooks.closeModal();hooks.onDashboard();
 history.replaceState(null,'','#ranking?page='+page);
 const generation=++viewGeneration;document.title='หอเกียรติยศและผลผู้เรียน — PYTHON DUNGEON';
 const save=hooks.getSave();
 $('#app').innerHTML=`<section class="ranking-page"><div class="ranking-heading"><div><span class="eyebrow">HALL OF RUNEBREAKERS</span><h1 class="pixel-title">หอเกียรติยศนักโค้ด</h1><p>ทุกบรรทัดคือความพยายาม ทุกดาวคือสิ่งที่ได้เรียนรู้</p></div><button class="btn ghost" id="rankingBack">← กลับเกม</button></div>
 <section class="learner-summary panel"><div><span class="eyebrow">YOUR JOURNEY</span><h2>${user?esc(profile?.nickname||'บัญชีผู้เรียน'):'สมุดบันทึกนักผจญภัย'}</h2><p>${user?'ความคืบหน้าของบัญชีคุณ':'เข้าสู่ระบบเพื่อเก็บเซฟแยกคนและร่วมตารางอันดับ'}</p></div><dl><div><dt>ด่านที่ผ่าน</dt><dd>${save.stars.filter(Boolean).length}<small>/12</small></dd></div><div><dt>ดาวสะสม</dt><dd>${save.stars.reduce((a,b)=>a+b,0)}<small>/36</small></dd></div><div><dt>ด่านที่บันทึกขณะล็อกอิน</dt><dd id="rankedCount">${user?'…':'—'}</dd></div></dl><div class="modal-actions"><button class="btn" id="dashboardAccount">${user?'จัดการบัญชี':'เข้าสู่ระบบ'}</button><span id="dashboardSync" role="status">${esc(states[status])}</span></div></section>
 <div class="ranking-rules"><strong>อันดับสำหรับผู้ที่จบครบ 12 ด่าน</strong><p>เรียงดาวรวมมากไปน้อย (สูงสุด 36) • ดาวเท่ากัน ผู้ที่จบก่อนอยู่ก่อน • เก็บผลดีที่สุดของแต่ละคน<br>นับผลผ่านด่านขณะล็อกอิน เล่นซ้ำเพื่อเพิ่มดาวได้ ไม่จับเวลาแข่งกันพิมพ์</p></div>
 <section class="ranking-board panel" aria-labelledby="rankingTitle"><div class="panel-heading"><h2 id="rankingTitle">ผู้พิชิตดันเจี้ยน</h2><button class="btn ghost small" id="refreshRanking">↻ อัปเดตอันดับ</button></div><div id="rankingContent" aria-live="polite" aria-busy="true"><p class="ranking-message">กำลังโหลดอันดับจริง…</p></div></section></section>`;
 $('#rankingBack').onclick=()=>{viewGeneration++;history.replaceState(null,'',location.pathname+location.search);hooks.onReturn();document.title='PYTHON DUNGEON — โค้ดเพื่อพิชิตดันเจี้ยน';};
 $('#dashboardAccount').onclick=openAccount;$('#refreshRanking').onclick=()=>openDashboard(page);
 const sync=user?queue?.flush():null;
 if(user){sync.then(()=>api('/api/player')).then(p=>{if(generation!==viewGeneration||!$('#rankedCount'))return;profile=p;$('#rankedCount').textContent=p.rankedFloors.length+'/12';}).catch(()=>{if(generation===viewGeneration&&$('#rankedCount'))$('#rankedCount').textContent='ลองโหลดใหม่';});}
 try{
  await sync;const data=await api('/api/ranking?page='+page);if(generation!==viewGeneration||!$('#rankingContent'))return;
  history.replaceState(null,'','#ranking?page='+data.page);
  const classes={adventurer:'นักผจญภัย',knight:'อัศวิน',wizard:'พ่อมด'},date=s=>new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(s));
  $('#rankingContent').setAttribute('aria-busy','false');
  if(!data.total){$('#rankingContent').innerHTML=`<ol class="rank-champions">${[1,2,3,4].map(n=>`<li class="rank-seat empty"><span class="rank-number">${n}</span><div><strong>ตำแหน่งผู้พิชิต</strong><p>รอผู้ผ่านครบ 12 ด่าน</p></div></li>`).join('')}</ol><p class="ranking-message">ยังไม่มีผู้เล่นจบครบ 12 ด่านขณะล็อกอิน<br>คุณอาจเป็นผู้พิชิตคนแรกของหอแห่งนี้</p>`;return;}
  const top=data.page===1?`<ol class="rank-champions">${data.rows.slice(0,4).map(r=>`<li class="rank-seat"><span class="rank-number">${r.rank}</span><img src="./assets/animation-v13/${r.class_id}.png" alt="" class="ranking-portrait" style="object-position:0 0"><div><strong>${esc(r.nickname)}</strong><p>${classes[r.class_id]} · ${r.stars} ★</p></div></li>`).join('')}</ol>`:'';
  $('#rankingContent').innerHTML=top+`<p class="ranking-count">ผู้พิชิต ${data.total.toLocaleString('th-TH')} คน • หน้า ${data.page}/${Math.ceil(data.total/data.pageSize)}</p><div class="ranking-table-wrap"><table><caption>อันดับเรียงตามดาวรวมและวันจบเกม</caption><thead><tr><th scope="col">อันดับ</th><th scope="col">นักผจญภัย</th><th scope="col">อาชีพ</th><th scope="col">ดาว</th><th scope="col">วันที่พิชิต</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td><span class="table-rank">${r.rank}</span></td><td>${esc(r.nickname)}</td><td>${classes[r.class_id]}</td><td class="rank-stars">★ ${r.stars}/36</td><td>${date(r.completed_at)}</td></tr>`).join('')}</tbody></table></div><div class="ranking-pages"><button class="btn ghost small" id="rankPrev" ${data.page<=1?'disabled':''}>← ก่อนหน้า</button><span>หน้า ${data.page}</span><button class="btn ghost small" id="rankNext" ${data.page*data.pageSize>=data.total?'disabled':''}>ถัดไป →</button></div>`;
  $('#rankPrev').onclick=()=>openDashboard(data.page-1);$('#rankNext').onclick=()=>openDashboard(data.page+1);
 }catch(error){if(generation===viewGeneration&&$('#rankingContent')){$('#rankingContent').setAttribute('aria-busy','false');$('#rankingContent').innerHTML=`<p class="ranking-message account-error" role="alert">${esc(error.message)}<br>กด “อัปเดตอันดับ” เพื่อลองอีกครั้ง</p>`;}}
}
