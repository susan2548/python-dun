import {esc} from './assessment-client.js?v=2';
export function tokenCode(q,value,disabled){
 const parts=q.code.split('____');
 return `<div class="token-code" aria-label="โค้ดพร้อมช่องวางคำตอบ"><pre class="exam-code"><code>${esc(parts[0])}<button type="button" class="token-slot" id="tokenSlot" ${disabled?'disabled':''} aria-label="ช่องคำตอบ ${esc(value||'ยังว่าง')}">${esc(value||'วางคำตอบที่นี่')}</button>${esc(parts.slice(1).join('____'))}</code></pre></div>`;
}
export function tokenChoices(q,value,disabled){
 return `<fieldset class="token-fieldset" aria-describedby="tokenHelp"><legend>เลือกชิ้นส่วนโค้ด 1 กล่อง</legend><p class="help" id="tokenHelp">ลากกล่องลงช่องว่าง หรือกดกล่องเพื่อวางคำตอบได้ทันที · เปลี่ยนคำตอบได้ก่อนส่ง</p><div class="token-bank">${q.choices.map((c,i)=>`<button type="button" class="token-option" data-token="${esc(c.id)}" aria-pressed="${value===c.id}" ${disabled?'disabled':''}><span class="tiny">${['ก','ข','ค','ง'][i]}</span><code>${esc(c.text)}</code></button>`).join('')}</div><div class="token-feedback"><span id="tokenStatus" role="status">${value?'วางคำตอบแล้ว: '+esc(value):'ยังไม่ได้วางคำตอบ'}</span><button type="button" class="text-btn" id="clearToken" ${disabled||!value?'disabled':''}>นำคำตอบออก</button></div></fieldset>`;
}
export function bindTokens(root,q,{value='',disabled=false,onChange}){
 const slot=root.querySelector('#tokenSlot'),status=root.querySelector('#tokenStatus'),clear=root.querySelector('#clearToken'),options=[...root.querySelectorAll('[data-token]')];
 const place=next=>{
  if(disabled||next!==''&&!q.choices.some(c=>c.id===next))return;
  value=next;slot.textContent=value||'วางคำตอบที่นี่';slot.setAttribute('aria-label','ช่องคำตอบ '+(value||'ยังว่าง'));
  slot.classList.remove('drag-over');status.textContent=value?'วางคำตอบแล้ว: '+value:'ยังไม่ได้วางคำตอบ';clear.disabled=!value;
  options.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.token===value)));onChange(value);
 };
 for(const b of options){
  let pointer,ghost,dragging=false,skipClick=false;
  const inside=e=>{const r=slot.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;};
  const cleanup=()=>{ghost?.remove();ghost=null;pointer=null;dragging=false;slot.classList.remove('drag-over');};
  b.onclick=()=>{if(!skipClick)place(b.dataset.token);};
  b.onpointerdown=e=>{if(disabled||e.button!==0||!e.isPrimary)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
  b.onpointermove=e=>{
   if(!pointer||pointer.id!==e.pointerId)return;
   if(!dragging&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<6)return;
   dragging=true;e.preventDefault();
   if(!ghost){ghost=document.createElement('div');ghost.className='token-drag-ghost';ghost.textContent=b.dataset.token;ghost.setAttribute('aria-hidden','true');root.append(ghost);}
   ghost.style.left=Math.max(8,Math.min(innerWidth-100,e.clientX+12))+'px';ghost.style.top=Math.max(8,e.clientY-45)+'px';slot.classList.toggle('drag-over',inside(e));
  };
  b.onpointerup=e=>{if(!pointer||pointer.id!==e.pointerId)return;skipClick=dragging;if(dragging&&inside(e))place(b.dataset.token);cleanup();setTimeout(()=>{skipClick=false;},0);};
  b.onpointercancel=cleanup;b.onlostpointercapture=cleanup;
 }
 // A focused blank points keyboard users to the same native answer buttons.
 slot.onclick=()=>{(options.find(b=>b.dataset.token===value)||options[0])?.focus();};
 clear.onclick=()=>place('');
}
