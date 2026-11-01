let modal;
let toastTimer;
export function toast(message,duration=3500){
 const target=document.querySelector('#toast');if(!target)return;
 target.textContent=message;target.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>target.classList.remove('show'),duration);
}
export function closeModal(){
 const previous=modal?.previousFocus;modal?.cleanup?.();modal?.remove();modal=null;
 const shell=document.querySelector('.app-shell');if(shell)shell.inert=false;
 if(previous?.isConnected)previous.focus({preventScroll:true});
}
export function showModal(html,{onClose}={}){
 closeModal();const previous=document.activeElement;
 modal=document.createElement('div');modal.className='modal-backdrop';
 modal.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
 modal.previousFocus=previous;modal.cleanup=onClose;document.body.append(modal);
 const heading=modal.querySelector('h2');if(heading){heading.id||='dialogTitle';modal.firstElementChild.setAttribute('aria-labelledby',heading.id);}
 const shell=document.querySelector('.app-shell');if(shell)shell.inert=true;
 modal.onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();closeModal();return;}
  if(e.key!=='Tab')return;
  const controls=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
  if(!controls.length)return;
  if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}
 };
 modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
 modal.onclick=e=>{if(e.target===modal)closeModal();};
 modal.querySelector('input:not(:disabled),button:not(:disabled),a[href]')?.focus({preventScroll:true});
 return modal;
}
