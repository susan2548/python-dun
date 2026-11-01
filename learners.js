import {CloudSaveQueue} from './cloud-save.js?v=1';
const ROOT='python-dungeon-rpg-v1',META=ROOT+':meta:',LAST=ROOT+':last-user';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const states={guest:'เข้าสู่ระบบก่อนผจญภัย',loading:'กำลังตรวจบัญชี…',pending:'รอบันทึก',syncing:'กำลังบันทึก…',saved:'บันทึกบนบัญชีแล้ว',offline:'เชื่อมต่อไม่ได้ • เก็บบนเครื่องแล้ว',expired:'กรุณาเข้าสู่ระบบอีกครั้ง',conflict:'มีเซฟใหม่จากอีกหน้าต่าง',invalid:'ข้อมูลเซฟต้องตรวจสอบ'};
let hooks,user=null,profile=null,queue=null,status='loading',ready=false,timer,authClient,transition=false,viewGeneration=0;
const listeners=new Set();
export const learner={
 get key(){return user?ROOT+':'+user.id:ROOT;},get user(){return user;},get ready(){return ready;},
 canPlay(){return ready&&!!user&&!transition&&status!=='expired'&&!queue?.blocked;},
 requireLogin(){if(this.canPlay())return true;if(!user||status==='expired')loginForm('login');else hooks.toast('รอโหลดบัญชีหรือจัดการเซฟก่อนเล่นต่อ');return false;},
 showGate:()=>loginForm('login'),
 save(snapshot){if(!user||!queue)return;queue.stage(snapshot);clearTimeout(timer);timer=setTimeout(()=>queue.flush(),700);},
 recordVictory(battle,classId){if(user&&queue)queue.addClear({id:crypto.randomUUID(),floor:battle.level,classId,answers:battle.answeredQuestions,mistakes:battle.mistakes,enemyHp:0});},
 openAccount,openDashboard,
 refresh:paintAccount,
};
function announce(next){status=next;paintAccount();for(const listener of listeners)listener();if(next==='expired'&&ready&&!transition&&hooks.canSwitch())loginForm('login');}
function paintAccount(){
 if($('#homeBtn'))$('#homeBtn').disabled=!ready||transition;
 const b=$('#accountBtn');if(b){b.textContent=user&&status!=='expired'?(profile?.nickname||'บัญชีผู้เรียน'):'เข้าสู่ระบบ';b.disabled=!ready||transition;}
 if($('#startBtn'))$('#startBtn').disabled=!learner.canPlay();
 if($('#rankingBtn'))$('#rankingBtn').disabled=!ready||transition;
 const label=status==='offline'&&!user?'ตรวจบัญชีไม่ได้ • กรุณาลองอีกครั้ง':states[status];
 const s=$('#syncStatus');if(s){s.textContent=label;s.dataset.state=status;}
 document.body.classList.toggle('signed-out',!user||status==='expired');
 if($('#dashboardSync'))$('#dashboardSync').textContent=label;
 const recover=$('#syncRetry');if(recover){recover.hidden=!['offline','expired','conflict','invalid'].includes(status);recover.textContent=['conflict','invalid'].includes(status)?'จัดการเซฟ':status==='expired'?'เข้าสู่ระบบอีกครั้ง':!user?'ตรวจบัญชีอีกครั้ง':'ลองบันทึกอีกครั้ง';}
}
async function api(path,options={}){
 let response;try{response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...options,headers:{'Content-Type':'application/json',...options.headers}});}catch{throw Error('การเชื่อมต่อขัดข้อง กรุณาลองอีกครั้ง');}
 let data;try{data=await response.json();}catch{throw Error('ระบบผู้เรียนยังไม่พร้อม กรุณาลองอีกครั้ง');}
 if(!response.ok)throw Object.assign(new Error(data.error||'เชื่อมต่อไม่ได้'),{status:response.status});return data;
}
async function auth(){return authClient??=import('./vendor/neon-auth.js').then(({createAuthClient})=>createAuthClient(undefined,{fetchOptions:{timeout:15000}}));}
async function retryAccount(){
 if(transition)return;
 transition=true;paintAccount();
 try{const session=await api('/api/auth/get-session');if(session?.user)await activate(session.user);else{transition=false;announce('guest');loginForm('login',$('#authEmail')?.value||'');}}
 catch(error){announce('offline');if($('#authError'))$('#authError').textContent='ยังตรวจบัญชีไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง';}
 finally{transition=false;paintAccount();}
}
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
 renderGate('<div class="auth-loading" role="status"><span class="gate-sigil" aria-hidden="true">⌘</span><h2>กำลังตรวจบัญชีของคุณ</h2><p>เตรียมสมุดบันทึกก่อนเปิดประตูดันเจี้ยน…</p></div>');
 $('#accountBtn').onclick=openAccount;$('#rankingBtn').onclick=()=>openDashboard();
 $('#syncRetry').onclick=()=>status==='expired'?openAccount():['conflict','invalid'].includes(status)?resolveConflict():!user?retryAccount():queue?.flush();
 try{
  const session=await api('/api/auth/get-session');
  if(session?.user)await activate(session.user);
  else announce('guest');
 }catch{transition=false;user=null;announce('offline');}
 finally{ready=true;paintAccount();if(location.hash.startsWith('#ranking')&&!$('.modal-backdrop'))openDashboard(Number(new URLSearchParams(location.hash.split('?')[1]||'').get('page'))||1);else if(!user)loginForm(location.hash==='#signup'?'register':'login');}
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
 user=nextUser;profile=remote;if(!location.hash.startsWith('#ranking'))history.replaceState(null,'',location.pathname+location.search);localStorage.setItem(LAST,JSON.stringify({id:user.id}));
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
 if(transition)return;
 if(!hooks.canSwitch())return hooks.toast('รอจบเทิร์นนี้ก่อนเปลี่ยนบัญชี');
 if(user&&status!=='expired'){
  hooks.showModal(`<span class="eyebrow">LEARNER ACCOUNT</span><h2>${esc(profile?.nickname||'บัญชีผู้เรียน')}</h2><p>${esc(states[status])}</p><div class="modal-actions"><button class="btn" id="myDashboard">ดูผลและอันดับ</button><button class="btn ghost" id="editNickname">เปลี่ยนชื่อในเกม</button><button class="btn ghost" id="signOut">ออกจากระบบ</button><button class="btn ghost" data-close>ปิด</button></div><p id="logoutError" class="account-error" role="alert"></p>`);
  $('#myDashboard').onclick=()=>{hooks.closeModal();openDashboard();};$('#editNickname').onclick=openNickname;
  $('#signOut').onclick=async()=>{const b=$('#signOut');transition=true;paintAccount();b.disabled=true;try{await queue?.flush();const result=await(await auth()).signOut();if(result.error)throw Error('ออกจากระบบไม่ได้ กรุณาลองอีกครั้ง');clearTimeout(timer);queue=null;user=null;profile=null;localStorage.removeItem(LAST);hooks.closeModal();transition=false;announce('guest');hooks.onIdentity(null);loginForm('login');}catch(error){if($('#logoutError'))$('#logoutError').textContent=error.message;else hooks.toast(error.message);}finally{transition=false;paintAccount();if(b.isConnected)b.disabled=false;}};
  return;
 }
 loginForm('login');
}
function renderGate(content){
 viewGeneration++;hooks.closeModal();const expired=status==='expired';hooks.onAuthGate();if(expired)status='expired';
 $('#app').innerHTML=`<section class="guild-gate" aria-label="ประตูเข้าสู่ดันเจี้ยน"><div class="gate-art"><div class="gate-art-copy"><span class="eyebrow">THE RUNEBREAKER CHRONICLES</span><h1>ทุกบรรทัด<br>ปลุกพลัง<span>ของเจ้า</span></h1><p>เขียน Python ร่ายสกิล<br>และฝ่าคำสาปแห่งดันเจี้ยน</p></div><div class="gate-roster" aria-label="อาชีพที่เลือกเล่นได้">${[['adventurer','นักผจญภัย'],['knight','อัศวิน'],['wizard','พ่อมด']].map(([id,name])=>`<div><span class="guild-portrait portrait-${id}" aria-hidden="true"></span><span>${name}</span></div>`).join('')}</div><div class="gate-world-note"><span>12 ด่านแห่งการเรียนรู้</span><span>3 อาชีพ · 6 สกิล</span></div></div><div class="gate-desk"><div class="gate-corners" aria-hidden="true"></div>${content}</div></section>`;
 window.scrollTo(0,0);paintAccount();
}
function loginForm(mode,email=''){
 const switchingForm=!!$('#authForm');
 const register=mode==='register',reset=mode==='reset';
 history.replaceState(null,'',reset?'#recovery':register?'#signup':'#login');
 document.title=(register?'สมัครบัญชี':reset?'กู้รหัสผ่าน':'เข้าสู่ระบบ')+' — PYTHON DUNGEON';
 renderGate(`<div class="auth-heading"><span class="eyebrow">RUNEBREAKER GUILD</span><span class="guild-seal" aria-hidden="true">⌘</span><h2>${register?'ลงชื่อเป็นนักผจญภัย':reset?'กู้คืนตราประจำตัว':'เข้าสู่กิลด์นักโค้ด'}</h2><p>${register?'สร้างบัญชีเพื่อเริ่มเส้นทางของคุณ':reset?'รับรหัสยืนยันทางอีเมลเพื่อตั้งรหัสผ่านใหม่':'เข้าสู่ระบบเพื่อเปิดประตู และเล่นต่อจากเซฟของคุณ'}</p></div>
 ${!reset?`<div class="auth-modes" aria-label="บัญชีผู้เรียน"><button type="button" id="authLoginTab" data-auth-mode="login" aria-pressed="${!register}">เข้าสู่ระบบ</button><button type="button" id="authSignupTab" data-auth-mode="register" aria-pressed="${register}">สมัครบัญชี</button></div>`:''}
 <form novalidate id="authForm">
 ${register?'<label class="account-field" for="authName">ชื่อในเกม (แสดงบนตารางอันดับ)<input id="authName" name="nickname" autocomplete="nickname" maxlength="24" aria-describedby="authError"></label>':''}
 <label class="account-field" for="authEmail">อีเมล<input id="authEmail" name="email" type="email" autocomplete="username" value="${esc(email)}" aria-describedby="authError"></label>
 ${reset?'<label class="account-field" for="authOtp">รหัส 6 หลักจากอีเมล<input id="authOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-describedby="authError"></label><button class="btn ghost small" id="sendReset" type="button">ส่งรหัสไปอีเมล</button>':''}
 <label class="account-field" for="authPassword">${reset?'รหัสผ่านใหม่':'รหัสผ่าน'}<span class="password-wrap"><input id="authPassword" name="password" type="password" autocomplete="${register||reset?'new-password':'current-password'}" minlength="8" maxlength="128" aria-describedby="passwordHelp authError"><button type="button" id="showPassword" aria-pressed="false" aria-label="แสดงรหัสผ่าน">แสดง</button></span></label>
 <p id="passwordHelp">${register||reset?'ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร':'ใช้รหัสผ่านที่สมัครไว้กับเกม'}</p>
 ${register?'<label class="account-field" for="authConfirm">ยืนยันรหัสผ่าน<input id="authConfirm" type="password" autocomplete="new-password" aria-describedby="authError"></label>':''}
 <div class="auth-result"><p class="account-error" id="authError" role="alert"></p><p class="account-feedback" id="authFeedback" role="status"></p></div>
 <div class="modal-actions"><button class="btn account-submit" type="submit"><span>${register?'สร้างบัญชี · เริ่มเส้นทาง':reset?'ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ · เปิดประตู'}</span><span aria-hidden="true">→</span></button></div>
 <div class="auth-links"><button type="button" id="authToggle">${register||reset?'มีบัญชีแล้ว • เข้าสู่ระบบ':'ยังไม่มีบัญชี • สมัครเลย'}</button>${mode==='login'?'<button type="button" id="forgotPassword">ลืมรหัสผ่าน</button>':''}</div>
 </form><div class="gate-save-note"><span aria-hidden="true">◇</span><p><strong>หนึ่งบัญชี หนึ่งสมุดผจญภัย</strong><br>เซฟอัตโนมัติ · เล่นต่อข้ามเครื่อง · เก็บดาวเมื่อจบด่าน</p></div><p class="account-privacy">อีเมลใช้สำหรับเข้าสู่ระบบและกู้รหัสผ่านเท่านั้น<br>ตารางอันดับแสดงชื่อในเกม ไม่แสดงอีเมล</p>`);
 if(switchingForm&&matchMedia('(max-width:760px)').matches)$('.gate-desk').scrollIntoView({block:'start'});
 if($('#authLoginTab'))$('#authLoginTab').onclick=()=>{if(!transition)loginForm('login',$('#authEmail').value);};
 if($('#authSignupTab'))$('#authSignupTab').onclick=()=>{if(!transition)loginForm('register',$('#authEmail').value);};
 $('#authToggle').onclick=()=>{if(!transition)loginForm(mode==='login'?'register':'login',$('#authEmail').value);};
 $('#forgotPassword')&&($('#forgotPassword').onclick=()=>{if(!transition)loginForm('reset',$('#authEmail').value);});
 $('#showPassword').onclick=()=>{const show=$('#authPassword').type==='password';$('#authPassword').type=show?'text':'password';$('#showPassword').textContent=show?'ซ่อน':'แสดง';$('#showPassword').setAttribute('aria-pressed',String(show));$('#showPassword').setAttribute('aria-label',show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน');};
 const problem=(message,field)=>{$('#authError').textContent=message;const el=$(field);el?.setAttribute('aria-invalid','true');el?.focus();};
 $('#sendReset')&&($('#sendReset').onclick=async()=>{const b=$('#sendReset'),form=$('#authForm');b.disabled=true;try{const result=await(await auth()).emailOtp.sendVerificationOtp({email:$('#authEmail').value.trim(),type:'forget-password'});if(!form.isConnected)return;if(result.error)throw Error('ส่งรหัสไม่ได้ ตรวจอีเมลและลองอีกครั้ง');$('#authFeedback').textContent='หากมีบัญชีนี้ ระบบจะส่งรหัสให้ ตรวจกล่องจดหมายและสแปม';}catch(error){if(form.isConnected)problem(error.message,'#authEmail');}finally{if(b.isConnected)b.disabled=false;}});
 $('#authForm').onsubmit=async e=>{
  e.preventDefault();if(transition)return;
  const email=$('#authEmail').value.trim(),password=$('#authPassword').value,name=$('#authName')?.value.trim(),b=e.submitter||$('#authForm button[type="submit"]');
  $('#authError').textContent='';$('#authForm').querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return problem('กรอกอีเมลให้ครบ เช่น student@example.com','#authEmail');
  if(password.length<8||password.length>128)return problem('รหัสผ่านต้องยาว 8–128 ตัวอักษร','#authPassword');
  if(register&&(name.length<2||name.length>24||/[<>@\p{Cc}\p{Cf}]/u.test(name)))return problem('ใช้ชื่อเล่นยาว 2–24 ตัวอักษร ไม่ใช่อีเมล','#authName');
  if(register&&password!==$('#authConfirm').value)return problem('รหัสผ่านสองช่องยังไม่ตรงกัน','#authConfirm');
  if(reset&&!/^\d{6}$/.test($('#authOtp').value.trim()))return problem('กรอกรหัส 6 หลักจากอีเมล','#authOtp');
  transition=true;paintAccount();document.querySelectorAll('[data-auth-mode],#authToggle,#forgotPassword,#sendReset').forEach(el=>el.disabled=true);b.disabled=true;b.setAttribute('aria-busy','true');$('#authFeedback').textContent='กำลังดำเนินการ…';
  try{
   const client=await auth(),result=reset?await client.emailOtp.resetPassword({email,otp:$('#authOtp').value.trim(),password}):register?await client.signUp.email({email,password,name}):await client.signIn.email({email,password});
   if(result.error)throw Error(reset?'รหัสอีเมลไม่ถูกต้องหรือหมดอายุ ลองส่งรหัสใหม่':register?'สร้างบัญชีไม่ได้ อีเมลอาจถูกใช้แล้ว ลองเข้าสู่ระบบหรือกู้รหัสผ่าน':'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่');
   if(reset){transition=false;loginForm('login',email);$('#authFeedback').textContent='ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย';return;}
   const session=await api('/api/auth/get-session');if(!session?.user)throw Error('ยังยืนยันการเข้าสู่ระบบไม่ได้ กรุณาตรวจอีเมลแล้วลองเข้าสู่ระบบอีกครั้ง');
   hooks.closeModal();history.replaceState(null,'',location.pathname+location.search);await activate(session.user,{nickname:register?name:undefined});hooks.toast('เข้าสู่ระบบแล้ว • โหลดเซฟของคุณเรียบร้อย');
  }catch(error){
   const message=/[\u0E00-\u0E7F]/.test(error.message)?error.message:reset?'รหัสอีเมลไม่ถูกต้องหรือหมดอายุ กรุณาส่งรหัสใหม่':register?'สร้างบัญชีไม่สำเร็จ ตรวจข้อมูลหรือลองเข้าสู่ระบบด้วยบัญชีเดิม':'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่';
   if($('#authError'))problem(message,'#authEmail');else hooks.toast(message);
  }
  finally{transition=false;paintAccount();document.querySelectorAll('[data-auth-mode],#authToggle,#forgotPassword,#sendReset').forEach(el=>el.disabled=false);if(b.isConnected){b.disabled=false;b.removeAttribute('aria-busy');$('#authFeedback').textContent='';}}
 };
}
const CLASS_NAMES={adventurer:'นักผจญภัย',knight:'อัศวิน',wizard:'พ่อมด'};
const crest=`<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M8 8h48v36L32 64 8 44Z" fill="currentColor" opacity=".12"/><path d="M8 8h48v36L32 64 8 44Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m18 25 8 6 6-14 6 14 8-6-3 19H21Z" fill="currentColor"/><path d="M24 49h16" stroke="currentColor" stroke-width="3"/></svg>`;
function championSeats(rows=[]){
 return `<ol class="rank-champions" aria-label="ผู้พิชิต 4 อันดับแรก">${[0,1,2,3].map(i=>{const r=rows[i];return `<li class="rank-seat rank-place-${i+1} ${r?'':'empty'}"><span class="rank-laurel" aria-hidden="true">${crest}<b>${i+1}</b></span>${r?`<span class="guild-portrait portrait-${r.class_id}" aria-hidden="true"></span><strong>${esc(r.nickname)}</strong><span class="champion-class">${CLASS_NAMES[r.class_id]}</span><span class="champion-stars">★ <b>${r.stars}</b><small>/36</small></span>`:`<span class="rank-vacant" aria-hidden="true">◇</span><strong>แท่นผู้พิชิตลำดับ ${i+1}</strong><span class="champion-class">รอจารึกชื่อของนักผจญภัย</span><span class="champion-stars muted">— <small>/36</small></span>`}<div class="pedestal-foot" aria-hidden="true">${['I','II','III','IV'][i]}</div></li>`;}).join('')}</ol>`;
}
export async function openDashboard(page=1){
 if(transition)return;
 if(!hooks.canSwitch())return hooks.toast('รอจบเทิร์นนี้ก่อนดูอันดับ');
 hooks.beforeDashboard();hooks.closeModal();hooks.onDashboard();
 history.replaceState(null,'','#ranking?page='+page);
 const generation=++viewGeneration;document.title='หอเกียรติยศและผลผู้เรียน — PYTHON DUNGEON';
 const save=hooks.getSave();
 $('#app').innerHTML=`<section class="ranking-page"><header class="ranking-heading"><div class="hall-emblem" aria-hidden="true">${crest}</div><div><span class="eyebrow">HALL OF RUNEBREAKERS</span><h1>หอเกียรติยศนักโค้ด</h1><p>จารึกนามผู้ฝ่าคำสาปทั้งสิบสองชั้น</p></div><button class="btn ghost" id="rankingBack">← ${user?'กลับสู่การผจญภัย':'กลับหน้าเข้าสู่ระบบ'}</button></header>
 <div class="hall-content"><section class="learner-summary" aria-label="ความคืบหน้าของคุณ"><div class="journey-title"><span class="journey-rune" aria-hidden="true">⌘</span><div><span class="eyebrow">YOUR CHRONICLE</span><h2>${user?esc(profile?.nickname||'บัญชีผู้เรียน'):'เรื่องราวของคุณเริ่มที่นี่'}</h2><p>${user?'สมุดผจญภัยประจำตัวของคุณ':'เข้าสู่กิลด์ เก็บดาว แล้วจารึกชื่อบนหอแห่งนี้'}</p></div></div>${user?`<dl><div><dt>ด่านที่ผ่าน</dt><dd>${save.stars.filter(Boolean).length}<small>/12</small></dd></div><div><dt>ดาวสะสม</dt><dd>${save.stars.reduce((a,b)=>a+b,0)}<small>/36</small></dd></div><div><dt>ด่านที่นับสู่อันดับ</dt><dd id="rankedCount">…</dd></div></dl>`:''}<div class="journey-actions"><button class="btn ${user?'ghost':''}" id="dashboardAccount">${user?'จัดการบัญชี':'เข้าสู่ระบบเพื่อเริ่มเล่น'}</button><span id="dashboardSync" role="status">${esc(states[status])}</span></div></section>
 <section class="ranking-board" aria-labelledby="rankingTitle"><div class="panel-heading"><div><span class="eyebrow">THE HONOURED FOUR</span><h2 id="rankingTitle">แท่นผู้พิชิตดันเจี้ยน</h2></div><button class="btn ghost small" id="refreshRanking">↻ อัปเดตอันดับ</button></div><div class="ranking-rules"><p><strong>พิชิตครบ 12 ด่าน</strong> เพื่อเข้าสู่ตาราง • เรียงตามดาวรวม สูงสุด 36 ดาว</p><details><summary>อ่านเกณฑ์จัดอันดับ</summary><p>นับด่านที่ผ่านขณะล็อกอินและเก็บดาวที่ดีที่สุดของแต่ละด่าน หากดาวเท่ากัน ผู้ที่จบครบก่อนอยู่ก่อน เล่นซ้ำเพื่อเพิ่มดาวได้ โดยไม่จับเวลาแข่งพิมพ์ การเริ่มเกมใหม่ยังคงอันดับที่เคยทำไว้</p></details></div><div id="rankingContent" aria-live="polite" aria-busy="true"><div class="ranking-loading"><span class="gate-sigil" aria-hidden="true">⌘</span><p>กำลังเปิดบันทึกผู้พิชิต…</p></div></div></section></div></section>`;
 const returnToGame=()=>{viewGeneration++;history.replaceState(null,'',location.pathname+location.search);if(user&&status!=='expired'){hooks.onReturn();document.title='PYTHON DUNGEON — โค้ดเพื่อพิชิตดันเจี้ยน';}else loginForm('login');};
 $('#rankingBack').onclick=returnToGame;
 $('#dashboardAccount').onclick=openAccount;$('#refreshRanking').onclick=()=>openDashboard(page);
 const sync=user?queue?.flush():null;
 if(user){Promise.resolve(sync).then(()=>api('/api/player')).then(p=>{if(generation!==viewGeneration||!$('#rankedCount'))return;profile=p;$('#rankedCount').textContent=p.rankedFloors.length+'/12';}).catch(()=>{if(generation===viewGeneration&&$('#rankedCount'))$('#rankedCount').textContent='ลองโหลดใหม่';});}
 try{
  await sync;const data=await api('/api/ranking?page='+page);if(generation!==viewGeneration||!$('#rankingContent'))return;
  history.replaceState(null,'','#ranking?page='+data.page);
  const date=s=>new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(s));
  $('#rankingContent').setAttribute('aria-busy','false');
  if(!data.total){$('#rankingContent').innerHTML=championSeats()+`<div class="ranking-empty"><span class="eyebrow">A NAME YET TO BE WRITTEN</span><h3>แท่นเหล่านี้กำลังรอผู้พิชิตคนแรก</h3><p>ผ่านทั้ง 12 ด่านขณะล็อกอิน แล้วชื่อของคุณจะถูกจารึกที่นี่</p><button class="btn" id="rankBegin">${user?'กลับไปผจญภัย':'เข้าสู่ระบบเพื่อเริ่มเส้นทาง'} →</button></div>`;$('#rankBegin').onclick=returnToGame;return;}
  const top=data.page===1?championSeats(data.rows.slice(0,4)):'';
  $('#rankingContent').innerHTML=top+`<div class="ranking-ledger-heading"><h3>บันทึกผู้พิชิต</h3><span>ทั้งหมด ${data.total.toLocaleString('th-TH')} คน</span></div><div class="ranking-table-wrap" tabindex="0" role="region" aria-label="ตารางผู้พิชิต เลื่อนแนวนอนเพื่อดูทุกคอลัมน์"><table><caption>อันดับเรียงตามดาวรวมและวันจบเกม</caption><thead><tr><th scope="col">อันดับ</th><th scope="col">นักผจญภัย</th><th scope="col">อาชีพ</th><th scope="col">ดาว</th><th scope="col">วันที่พิชิต</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td><span class="table-rank">${r.rank}</span></td><td><span class="ledger-name"><span class="guild-portrait portrait-${r.class_id}" aria-hidden="true"></span>${esc(r.nickname)}</span></td><td>${CLASS_NAMES[r.class_id]}</td><td class="rank-stars">★ ${r.stars}<small>/36</small></td><td>${date(r.completed_at)}</td></tr>`).join('')}</tbody></table></div><div class="ranking-pages"><button class="btn ghost small" id="rankPrev" ${data.page<=1?'disabled':''}>← ก่อนหน้า</button><span>หน้า ${data.page}/${Math.ceil(data.total/data.pageSize)}</span><button class="btn ghost small" id="rankNext" ${data.page*data.pageSize>=data.total?'disabled':''}>ถัดไป →</button></div>`;
  $('#rankPrev').onclick=()=>openDashboard(data.page-1);$('#rankNext').onclick=()=>openDashboard(data.page+1);
 }catch(error){if(generation===viewGeneration&&$('#rankingContent')){$('#rankingContent').setAttribute('aria-busy','false');$('#rankingContent').innerHTML=`<div class="ranking-message account-error" role="alert"><span aria-hidden="true">◇</span><h3>ยังเปิดบันทึกผู้พิชิตไม่ได้</h3><p>${esc(error.message)}</p><p>กด “อัปเดตอันดับ” ด้านบนเพื่อลองอีกครั้ง</p></div>`;}}
}
