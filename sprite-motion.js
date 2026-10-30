// Authored pose atlases + planted-foot breathing. World movement is owned by
// combat-cinema; this renderer never changes game state or combat timing.
const images=new Map();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const heroes=['adventurer','knight','wizard'];
const monsters=['zombie','skeleton','spider','wraith','golem','necromancer'];
function load(src){
  if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;
  }));
  return images.get(src);
}
function poseFor(motion,phase){
  if(motion==='technique')return phase<.32?4:phase<.76?5:4;
  if(motion==='drink')return phase<.3?6:phase<.78?7:6;
  if(motion==='cast')return phase<.42?4:phase<.84?5:4;
  if(motion==='attack')return phase<.32?2:phase<.68?3:2;
  return 0;
}
export async function mountSpriteMotion(heroIndex,monsterIndex){
  await Promise.all([...document.querySelectorAll('.fighter')].map(async(fighter,index)=>{
    const hero=fighter.classList.contains('hero');
    const kind=hero?heroes[heroIndex]:monsters[monsterIndex];
    try{
      let image,atlas=true;
      try{image=await load(`./assets/poses/${kind}.png`);}catch{atlas=false;image=await load(`./assets/${hero?'heroes':'monsters'}.png`);}
      if(!fighter.isConnected)return;
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.className='sprite-raster';canvas.setAttribute('aria-hidden','true');
      fighter.append(canvas);fighter.classList.add('raster-ready');if(atlas)fighter.classList.add('pose-atlas');fighter.dataset.kind=kind;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      const source=document.createElement('canvas');source.width=256;source.height=256;const paint=source.getContext('2d');paint.imageSmoothingEnabled=false;
      const started=performance.now();const period=hero?[2600,3300,3000][heroIndex]:[3000,3500,2100,3800,4200,3600][monsterIndex];
      let last='';
      function draw(now){
        if(!canvas.isConnected)return;
        const motion=fighter.dataset.motion||'idle';
        const phase=Math.max(0,Math.min(1,Number(fighter.dataset.progress)||0));
        const time=Math.max(0,now-started+index*730),cycle=(time%period)/period;
        const idle=motion==='idle';
        const slot=reduced.matches||idle?0:poseFor(motion,phase);
        const ease=t=>t*t*(3-2*t);
        const blend=reduced.matches||!idle?0:cycle<.20?0:cycle<.35?ease((cycle-.20)/.15):cycle<.65?1:cycle<.80?1-ease((cycle-.65)/.15):0;
        const breath=reduced.matches?0:idle?Math.round((1-Math.cos(cycle*Math.PI*2))*(kind==='golem'?.45:.8)):0;
        const ghost=kind==='wraith';const hover=ghost&&!reduced.matches?Math.round(Math.sin(time/700)*3):0;
        const key=`${slot}-${Math.round(blend*10)}-${breath}-${hover}-${motion}`;
        if(key!==last){
          paint.clearRect(0,0,256,256);
          if(atlas){
            const cols=hero?4:3;
            paint.globalAlpha=1-blend;paint.drawImage(image,slot%cols*256,Math.floor(slot/cols)*256,256,256,0,0,256,256);
            if(blend){paint.globalCompositeOperation='lighter';paint.globalAlpha=blend;paint.drawImage(image,256,0,256,256,0,0,256,256);paint.globalCompositeOperation='source-over';}
            paint.globalAlpha=1;
            if(motion==='drink'&&fighter.dataset.potion==='mana'){
              const pixels=paint.getImageData(0,0,256,256),d=pixels.data;
              for(let j=0;j<d.length;j+=4)if(d[j]>145&&d[j+1]<105&&d[j+2]<95){const red=d[j];d[j]=45;d[j+1]=Math.min(210,d[j+1]+80);d[j+2]=red;}
              paint.putImageData(pixels,0,0);
            }
          }
          else {const idx=hero?heroIndex:monsterIndex,sw=image.width/3,sh=image.height/(hero?1:2);paint.drawImage(image,idx%3*sw,Math.floor(idx/3)*sh,sw,sh,24,16,208,234);}
          ctx.clearRect(0,0,256,256);
          // Expand only the ribcage; soles and floor anchor remain stationary.
          ctx.drawImage(source,0,0,256,201,0,-breath+hover,256,201+breath);
          ctx.drawImage(source,0,201,256,55,0,201+hover,256,55);
          fighter.dataset.frame=String(slot);last=key;
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }catch(error){console.warn('Sprite animation fallback',error);}
  }));
}
