const ICONS = { attack:'S_Sword01.png', double_strike:'S_Dagger02.png', smoke_blade:'S_Shadow04.png', iron_oath:'shield.svg', frost_lance:'S_Ice03.png', shield_bash:'shield.svg', fireball:'S_Fire03.png', poison:'S_Poison02.png', web:'S_Poison07.png', curse:'S_Shadow03.png', stone:'S_Earth03.png', mana:'P_Blue01.png', shield:'shield.svg', health:'P_Red01.png', armor:'A_Armour01.png', focus:'S_Buff01.png', blind:'S_Shadow04.png', frost:'S_Ice03.png', bleed:'bleed.svg', inn:'inn.svg', hint:'I_Book.png' };
export function skillIcon(key) {
  return `<img class="skill-icon" src="./assets/icons/${ICONS[key] || ICONS.attack}" alt="" aria-hidden="true">`;
}
const HEROES = {
  adventurer: {name:'ฟันสองจังหวะ', english:'EMERALD CROSS', color:'#68ffc0', portrait:0, sigil:'╳'},
  knight: {name:'กระแทกโล่', english:'AEGIS BREAKER', color:'#ffd16b', portrait:50, sigil:'◇'},
  wizard: {name:'ลูกไฟเวท', english:'INFERNO SIGIL', color:'#ff7950', portrait:100, sigil:'✺'},
};
// Preload portraits without blocking first play.
const portrait = new Image(); portrait.src = './assets/cutin-portraits.png';
export async function playCutscene(classId, skill = null) {
  const hero = {...HEROES[classId]};
  if(skill) {hero.name=skill.name;hero.english=skill.id==='fireball'?hero.english:skill.id.replaceAll('_',' ').toUpperCase();}
  const overlay = document.createElement('div');
  overlay.className = `skill-cutscene cutscene-${classId}`;
  overlay.style.setProperty('--cut-color',hero.color);
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-label',hero.name);
  overlay.innerHTML = `<div class="cutscene-band"><div class="cut-speedlines"></div><div class="cut-sigil">${hero.sigil}</div><div class="cut-portrait" style="background-position:${hero.portrait}% center"></div><div class="cut-title"><span>CLASS TECHNIQUE / ${classId.toUpperCase()}</span><h2>${hero.english}</h2><p>${hero.name}</p><div class="cut-rule"></div></div><button class="cut-skip">ข้าม ›</button></div>`;
  const previous = document.activeElement;
  document.body.append(overlay);
  const skip = overlay.querySelector('button'); skip.focus({preventScroll:true});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, reduced ? 600 : 1850);
      skip.onclick = () => {clearTimeout(timer);resolve();};
      overlay.onkeydown = e => {
        if(e.key==='Escape' || e.key===' ') {e.preventDefault();clearTimeout(timer);resolve();}
        if(e.key==='Tab') {e.preventDefault();skip.focus();}
      };
    });
  } finally { overlay.remove(); if(previous?.isConnected) previous.focus({preventScroll:true}); }
}

// One animation clock owns pose, travel, VFX and the single gameplay impact.
function timeline(duration,update){
  return new Promise(resolve=>{
    const start=performance.now();
    function frame(now){const p=Math.min(1,(now-start)/duration);update(p);if(p<1)requestAnimationFrame(frame);else resolve();}
    requestAnimationFrame(frame);
  });
}
function spriteBounds(fighter){
  const r=fighter.getBoundingClientRect(),side=Math.min(r.width,r.height);
  return {left:r.left+(r.width-side)/2,top:r.top+(r.height-side)/2,width:side,height:side};
}
function effect(scene,className,x,y){
  const node=document.createElement('span');node.className=className;node.style.left=x+'px';node.style.top=y+'px';node.setAttribute('aria-hidden','true');scene.append(node);return node;
}
export async function playCombatMotion(role,variant,impact){
  const fighter=document.querySelector(`.fighter.${role}`),target=document.querySelector(`.fighter.${role==='hero'?'enemy':'hero'}`);
  if(!fighter||!target){impact();return;}
  const scene=fighter.parentElement,bounds=scene.getBoundingClientRect();
  const a=spriteBounds(fighter),b=spriteBounds(target);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const direction=role==='hero'?1:-1;
  const melee=['attack','double_strike','shield_bash','smoke_blade','iron_oath','stone','shield'].includes(variant);
  const heavy=['golem','knight'].includes(fighter.dataset.kind);
  const double=variant==='double_strike';
  const duration=reduced?360:double?1350:melee?(heavy?1220:1050):1600;
  const contact=reduced?.5:double?.59:melee?.39:.72;
  // Stop before the target's torso; the outstretched blade/claw closes the gap.
  const distance=melee?Math.max(0,Math.abs((a.left+a.width/2)-(b.left+b.width/2))-a.width*.40-b.width*.15)*direction:0;
  fighter.dataset.motion=melee?(role==='enemy'&&['stone','shield'].includes(variant)?'technique':'attack'):'cast';fighter.dataset.progress='0';fighter.style.zIndex='5';
  const nodes=[],animations=[];
  const animate=(node,keys,options)=>{const anim=node.animate(keys,options);animations.push(anim);return anim;};
  if(!reduced){
    if(melee)animate(fighter,double?[
      {transform:'translateX(0)',offset:0},{transform:`translateX(${-direction*15}px)`,offset:.20},
      {transform:`translateX(${distance}px)`,offset:.34},{transform:`translateX(${distance}px)`,offset:.43},
      {transform:`translateX(${distance-direction*25}px)`,offset:.51},{transform:`translateX(${distance+direction*8}px)`,offset:.58},
      {transform:`translateX(${distance+direction*8}px)`,offset:.68},{transform:'translateX(0)',offset:1}
    ]:[
      {transform:'translateX(0)',offset:0},{transform:`translateX(${-direction*(heavy?9:16)}px) translateY(2px)`,offset:.21},
      {transform:`translateX(${distance}px)`,offset:.36},{transform:`translateX(${distance}px)`,offset:.47},
      {transform:`translateX(${distance-direction*12}px)`,offset:.65},{transform:'translateX(0)',offset:1}
    ],{duration,easing:'linear',fill:'both'});
    else animate(fighter,[{filter:'brightness(1)'},{filter:'brightness(1.18) drop-shadow(0 0 12px #8ce7ff)',offset:.4},{filter:'brightness(1)',offset:1}],{duration,fill:'both'});
  }
  // Sockets are measured in the normalized 256px pose cells, not CSS boxes.
  const sockets={wizard:[.91,.58],zombie:[.29,.55],spider:[.35,.81],wraith:[.18,.58],necromancer:[.28,.60]};
  const socket=sockets[fighter.dataset.kind]||(role==='hero'?[.85,.60]:[.25,.65]);
  const origin={x:a.left+a.width*socket[0]-bounds.left,y:a.top+a.height*socket[1]-bounds.top};
  const destination={x:b.left+b.width*.5-bounds.left,y:b.top+b.height*.70-bounds.top};
  let projectile,charge,slash,firstSlash=false,trail=false,hit=false;
  if(!melee&&!reduced){
    const theme=variant==='fireball'?'fire':variant==='frost_lance'?'frost':role==='enemy'?variant==='poison'?'poison':'dark':'arcane';
    charge=effect(scene,'motion-charge charge-'+theme,a.left+a.width*(role==='hero'?.64:.35)-bounds.left,a.top+a.height*.35-bounds.top);nodes.push(charge);
    projectile=effect(scene,'combat-projectile projectile-'+theme,origin.x,origin.y);nodes.push(projectile);
    animate(charge,[{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1)',offset:.34},{opacity:0,transform:'scale(1.6)',offset:.45},{opacity:0}],{duration,fill:'both'});
    animate(projectile,[
      {opacity:0,transform:'scale(.2)',offset:0},{opacity:0,transform:'scale(.3)',offset:.41},
      {opacity:1,transform:'scale(1)',offset:.44},
      {opacity:1,transform:`translate(${destination.x-origin.x}px,${destination.y-origin.y}px) scale(1.15)`,offset:.72},
      {opacity:0,transform:`translate(${destination.x-origin.x}px,${destination.y-origin.y}px) scale(1.6)`,offset:.77},{opacity:0,offset:1}
    ],{duration,easing:'linear',fill:'both'});
  }
  function blade(second=false){
    if(variant==='stone'){
      const burst=effect(scene,'motion-groundburst',destination.x,b.top+b.height*.94-bounds.top);nodes.push(burst);
      burst.innerHTML='<i></i><i></i><i></i><i></i>';
      animate(burst,[{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(1.45)'}],{duration:450,fill:'both'});return;
    }
    const fx=effect(scene,'motion-slash '+(role==='enemy'?'slash-enemy':fighter.dataset.kind==='knight'?'slash-gold':'slash-mint'),destination.x,destination.y);nodes.push(fx);
    fx.style.setProperty('--slash-angle',second?'-40deg':'40deg');
    animate(fx,[{opacity:0,transform:'rotate(var(--slash-angle)) scale(.4)'},{opacity:1,transform:'rotate(var(--slash-angle)) scale(1)',offset:.25},{opacity:0,transform:'rotate(var(--slash-angle)) scale(1.2)'}],{duration:heavy?360:260,fill:'both'});
  }
  try{
    await timeline(duration,p=>{
      // Re-cock the off-hand for a distinct second strike, one aggregate impact.
      fighter.dataset.progress=String(double&&p>.43&&p<.56?.16:p);
      if(!reduced&&melee&&!trail&&p>=.28){
        trail=true;const raster=fighter.querySelector('canvas');
        if(raster)for(let i=1;i<=3;i++){
          const echo=document.createElement('canvas');echo.width=256;echo.height=256;echo.getContext('2d').drawImage(raster,0,0);
          echo.className='motion-echo';echo.style.left=(a.left-bounds.left+distance*(.2+i*.15))+'px';echo.style.top=(a.top-bounds.top)+'px';echo.style.width=a.width+'px';echo.style.height=a.height+'px';scene.append(echo);nodes.push(echo);
          animate(echo,[{opacity:.18-i*.035},{opacity:0}],{duration:320,fill:'both'});
        }
      }
      if(!reduced&&double&&!firstSlash&&p>=.37){firstSlash=true;blade();}
      if(!hit&&p>=contact){hit=true;if(melee&&!reduced)blade(double);impact();}
    });
  }finally{
    delete fighter.dataset.motion;delete fighter.dataset.progress;fighter.style.zIndex='';
    animations.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());
  }
}
export async function playPotionMotion(type,impact){
  const fighter=document.querySelector('.fighter.hero');if(!fighter){impact();return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=reduced?360:1450,scene=fighter.parentElement,bounds=scene.getBoundingClientRect(),a=spriteBounds(fighter);
  fighter.dataset.motion='drink';fighter.dataset.progress='0';fighter.dataset.potion=type;
  const label=effect(scene,'potion-sip-label '+(type==='mana'?'sip-mana':''),a.left+a.width*.5-bounds.left,a.top+a.height*.33-bounds.top);
  label.innerHTML=skillIcon(type==='mana'?'mana':'health')+'<b>'+(type==='mana'?'จิบยามานา':'ดื่มยาฟื้นพลัง')+'</b>';
  let applied=false;
  try{
    await timeline(duration,p=>{fighter.dataset.progress=String(p);if(!applied&&p>=.52){applied=true;impact();label.classList.add('sip-applied');}});
  }finally{delete fighter.dataset.motion;delete fighter.dataset.progress;delete fighter.dataset.potion;label.remove();}
}
