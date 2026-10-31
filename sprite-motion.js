import {HERO_KINDS,MONSTER_KINDS,NEW_MONSTER_KINDS,poseFrame} from './animation-profiles.js?v=2';
const images=new Map();
function load(src){
  if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;}));
  return images.get(src);
}
export async function mountSpriteMotion(heroIndex,monsterIndex){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  await Promise.all([...document.querySelectorAll('.fighter')].map(async(fighter,index)=>{
    const hero=fighter.classList.contains('hero'),kind=hero?HERO_KINDS[heroIndex]:typeof monsterIndex==='string'?monsterIndex:MONSTER_KINDS[monsterIndex],newMonster=NEW_MONSTER_KINDS.includes(kind),floating=['wraith','bat','sentinel'].includes(kind);
    try{
      let atlas,newAtlas=true;
      try{atlas=await load(`./assets/${newMonster?'animation-v15':'animation-v13'}/${kind}.png`);}catch{newAtlas=false;atlas=await load(`./assets/poses/${kind}.png`);}
      if(!fighter.isConnected)return;
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.className='sprite-raster';canvas.setAttribute('aria-hidden','true');
      fighter.append(canvas);fighter.classList.add('raster-ready','pose-atlas');fighter.dataset.kind=kind;
      // Display scale is shared by every pose, including potion frames.
      const artScale=newAtlas?({knight:1.13,wizard:1.08,skeleton:1.10,golem:1.15,necromancer:1.08,slime:1.3,mimic:1.3,scarab:1.3,icewolf:1.25}[kind]||1):1;
      fighter.dataset.artScale=String(artScale);canvas.style.scale=String(artScale);
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      const source=document.createElement('canvas');source.width=256;source.height=256;const paint=source.getContext('2d');paint.imageSmoothingEnabled=false;
      const started=performance.now();let previous='',raf;
      function draw(now){
        if(!canvas.isConnected)return;
        const time=now-started+index*437;
        const motion=fighter.dataset.motion||(fighter.dataset.stance==='guard'?'guard':'idle');
        const p=fighter.dataset.motion?Number(fighter.dataset.progress)||0:motion==='guard'?.5:0;
        const staticPose=motion==='guard'?(hero?13:8):motion==='focus'?15:motion==='drink'?17:['cast','technique'].includes(motion)?9:motion==='attack'?5:0;
        let slot=reduced.matches?staticPose:poseFrame(kind,motion,p,time,fighter.dataset.variant);
        if(!newAtlas){const fallback=[0,0,1,1,2,2,3,2,4,4,5,4,0,0,4,4,6,7];slot=fallback[slot]??0;}
        const bob=reduced.matches||motion!=='idle'?0:Math.round(Math.sin(time/(kind==='golem'?900:650))*(floating?2:1));
        const key=`${slot}/${bob}/${motion}/${fighter.dataset.potion||''}`;
        if(key!==previous){
          paint.clearRect(0,0,256,256);const cols=newAtlas?4:hero?4:3;
          paint.drawImage(atlas,slot%cols*256,Math.floor(slot/cols)*256,256,256,0,0,256,256);
          if(motion==='drink'&&fighter.dataset.potion==='mana'){
            const pixels=paint.getImageData(0,0,256,256),d=pixels.data;
            for(let i=0;i<d.length;i+=4)if(d[i]>145&&d[i+1]<105&&d[i+2]<95){const red=d[i];d[i]=45;d[i+1]=Math.min(210,d[i+1]+80);d[i+2]=red;}
            paint.putImageData(pixels,0,0);
          }
          ctx.clearRect(0,0,256,256);
          if(newAtlas&&motion==='idle'&&!floating){
            // Frame art moves shoulders, head and cloth; the first pose supplies
            // the unchanging boot-contact pixels. No crossfade or body scaling.
            ctx.drawImage(source,0,0,256,212,0,-bob,256,212);
            ctx.drawImage(atlas,0,212,256,44,0,212,256,44);
          } else ctx.drawImage(source,0,floating?bob-(['bat','sentinel'].includes(kind)?18:0):0);
          fighter.dataset.frame=String(slot);fighter.dataset.atlasVersion=newMonster?'15':newAtlas?'13':'7';previous=key;
        }
        raf=requestAnimationFrame(draw);
      }
      raf=requestAnimationFrame(draw);
      // The next callback exits immediately after a scene replacement. A
      // hidden tab does not accumulate timeline time or simulation callbacks.
      canvas.addEventListener('animation-dispose',()=>cancelAnimationFrame(raf),{once:true});
    }catch(error){console.warn('Sprite animation fallback',kind,error);}
  }));
}
