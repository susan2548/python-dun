const labels={enemy:['Enemy turn','ตาของมอนสเตอร์'],hero:['Your turn','ตาของคุณ • เลือกคำสั่งและเขียนโค้ด']};
export async function showTurnBanner(side,round){
 const scene=document.querySelector('#scene'),label=labels[side];
 if(!scene||!label)return;
 scene.querySelector('.turn-banner')?.remove();
 const banner=document.createElement('div');banner.className='turn-banner turn-'+side;banner.dataset.side=side;
 banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.setAttribute('aria-atomic','true');
 const title=document.createElement('strong');title.textContent=label[0];const description=document.createElement('span');description.textContent=label[1];
 const counter=document.createElement('small');counter.textContent='TURN '+Math.max(1,Number(round)||1);
 banner.append(counter,title,description);scene.append(banner);
 try{await new Promise(resolve=>setTimeout(resolve,side==='enemy'?860:760));}finally{banner.remove();}
}
