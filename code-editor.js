// Native textarea keeps selection, Thai IME, accessibility and mobile keyboards.
// The inert paint layer only supplies syntax colours; Python still runs in its worker.
const escape = value => value.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const keywords = new Set('if else elif for while in def return class try except import from as and or not True False None break continue pass'.split(' '));
const builtins = new Set(['print','attack','skill','len','range','sum','int','str','float','list','set','tuple']);
export function highlightPython(code) {
  const tokens = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|#[^\n]*|\b\d+(?:\.\d+)?\b|[\p{L}_][\p{L}\p{M}\p{N}_]*|[()[\]{}:,+\-*/%=<>])/gu;
  let result='', cursor=0;
  for (const match of code.matchAll(tokens)) {
    result+=escape(code.slice(cursor,match.index));
    const word=match[0];
    const type=word.startsWith('#')?'comment':/^["']/.test(word)?'string':/^\d/.test(word)?'number':keywords.has(word)?'keyword':builtins.has(word)?'builtin':/^[()[\]{}:,+\-*/%=<>]$/.test(word)?'punctuation':null;
    result+=type?`<span class="syntax-${type}">${escape(word)}</span>`:escape(word);
    cursor=match.index+word.length;
  }
  return result+escape(code.slice(cursor));
}

export function mountCodeEditor(textarea, {onRun, onCommand, getSkill}) {
  const shell=document.createElement('div');shell.className='python-editor';
  textarea.before(shell);
  shell.innerHTML='<div class="editor-gutter" aria-hidden="true"></div><div class="editor-writing"><div class="editor-active-line" aria-hidden="true"></div><pre class="editor-paint" aria-hidden="true"></pre></div>';
  const writing=shell.querySelector('.editor-writing'), paint=shell.querySelector('pre'), gutter=shell.querySelector('.editor-gutter'), active=shell.querySelector('.editor-active-line');
  writing.append(textarea);
  textarea.autocapitalize='off';textarea.autocomplete='off';textarea.setAttribute('autocorrect','off');textarea.setAttribute('wrap','off');
  textarea.setAttribute('aria-describedby','editorHelp console');
  const toolbar=document.createElement('div');toolbar.className='editor-toolbar';toolbar.setAttribute('aria-label','ปุ่มช่วยเขียน Python');
  const tools=[['indent','⇥','เยื้อง 4 ช่อง'],['pair','( )','ใส่วงเล็บ'],['colon',':','ใส่ทวิภาค'],['quote','" "','ใส่เครื่องหมายคำพูด'],['print','print()','แทรก print()'],['attack','attack()','แทรกคำสั่งโจมตี'],['skill','สกิล','แทรกคำสั่งสกิลที่เลือก'],['guard','ป้องกัน','เลือกป้องกันหนึ่งเทิร์น']];
  toolbar.innerHTML=tools.map(([id,label,title])=>`<button type="button" data-insert="${id}" title="${title}" aria-label="${title}">${label}</button>`).join('');
  shell.after(toolbar);
  toolbar.insertAdjacentHTML('afterend','<p class="editor-help" id="editorHelp">ปุ่มช่วยใส่รูปคำสั่ง • เติมพลังหรือตัวแปรตามโจทย์ด้วยตัวเอง • Ctrl / ⌘ + Enter เพื่อรัน</p>');
  const sync=()=>{
    paint.scrollTop=textarea.scrollTop;paint.scrollLeft=textarea.scrollLeft;gutter.scrollTop=textarea.scrollTop;
    const line=textarea.value.slice(0,textarea.selectionStart).split('\n').length-1;
    active.style.top=`${14+line*28-textarea.scrollTop}px`;
    [...gutter.children].forEach((n,i)=>n.classList.toggle('current-line',i===line));
  };
  const refresh=()=>{
    paint.innerHTML=highlightPython(textarea.value)+'\n';
    const lines=Math.max(8,textarea.value.split('\n').length+1);
    gutter.innerHTML=Array.from({length:lines},(_,i)=>`<span>${i+1}</span>`).join('');
    shell.style.height=`${Math.min(420,Math.max(252,lines*28+28))}px`;
    sync();
  };
  function insert(text, cursorOffset, selectionLength=0) {
    if(textarea.readOnly)return;
    const start=textarea.selectionStart, end=textarea.selectionEnd;
    // execCommand preserves native undo history where supported; range fallback
    // supplies identical editing behaviour on browsers without this legacy API.
    textarea.focus({preventScroll:true});
    if(!document.execCommand('insertText',false,text))textarea.setRangeText(text,start,end,'end');
    const next=start+(cursorOffset??text.length);
    textarea.setSelectionRange(next,next+selectionLength);
    textarea.dispatchEvent(new Event('input',{bubbles:true}));sync();
  }
  toolbar.addEventListener('pointerdown',e=>e.preventDefault());
  toolbar.addEventListener('click',e=>{
    const id=e.target.closest('button')?.dataset.insert;if(!id||textarea.readOnly)return;
    if(id==='guard'){onCommand('guard');document.querySelector('#runBtn')?.focus({preventScroll:true});return;}
    const selected=textarea.value.slice(textarea.selectionStart,textarea.selectionEnd);
    if(id==='indent')insert('    ');
    if(id==='pair')insert(`(${selected})`,1,selected.length);
    if(id==='quote')insert(`"${selected}"`,1,selected.length);
    if(id==='colon')insert(':');
    if(id==='print')insert(`print(${selected})`,6,selected.length);
    if(id==='attack'){onCommand('attack');insert(`attack(${selected})`,7,selected.length);}
    if(id==='skill'){
      const skill=getSkill();onCommand('skill');
      const prefix=`skill("${skill.name}", `;insert(prefix+selected+')',prefix.length,selected.length);
    }
  });
  textarea.addEventListener('input',refresh);
  textarea.addEventListener('scroll',sync);
  textarea.addEventListener('click',sync);textarea.addEventListener('keyup',sync);textarea.addEventListener('select',sync);
  textarea.addEventListener('keydown',e=>{
    if(e.isComposing||e.keyCode===229)return;
    if(e.key==='Tab'){e.preventDefault();insert('    ');}
    if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();onRun();}
    else if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();const before=textarea.value.slice(0,textarea.selectionStart).split('\n').at(-1);
      insert('\n'+(before.match(/^\s*/)?.[0]||'')+(before.trimEnd().endsWith(':')?'    ':''));
    }
  });
  refresh();
  return {refresh,setLocked(locked){textarea.readOnly=locked;toolbar.querySelectorAll('button').forEach(b=>b.disabled=locked);shell.classList.toggle('editor-locked',locked);}};
}
