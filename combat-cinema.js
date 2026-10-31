import {motionProfile,phaseAt,motionOffset} from './animation-profiles.js?v=2';
import {combatCue,playBattleVoice,stopBattleVoice} from './combat-audio.js?v=3';
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
  stopBattleVoice();if(skill)combatCue(classId,skill.id,'cutin');
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
      skip.onclick = () => {stopBattleVoice();clearTimeout(timer);resolve();};
      overlay.onkeydown = e => {
        if(e.key==='Escape' || e.key===' ') {e.preventDefault();stopBattleVoice();clearTimeout(timer);resolve();}
        if(e.key==='Tab') {e.preventDefault();skip.focus();}
      };
    });
  } finally { overlay.remove(); if(previous?.isConnected) previous.focus({preventScroll:true}); }
}

// Pose changes, root travel, projectile release and damage share one clock.
// Hit-stop pauses that clock at contact; it never replays the damage callback.
function timeline(duration,update,contact=.5,hold=0){
  return new Promise(resolve=>{
    const start=performance.now();
    function frame(now){const elapsed=now-start;update(phaseAt(elapsed,duration,contact,hold));if(elapsed<duration+hold)requestAnimationFrame(frame);else resolve();}
    requestAnimationFrame(frame);
  });
}
function spriteBounds(fighter){
  const r=fighter.getBoundingClientRect(),side=Math.min(r.width,r.height)*(Number(fighter.dataset.artScale)||1);
  return {left:r.left+(r.width-side)/2,top:r.bottom-side,width:side,height:side};
}
function effect(scene,className,x,y){
  const n=document.createElement('span');n.className=className;n.style.left=Math.round(x)+'px';n.style.top=Math.round(y)+'px';n.setAttribute('aria-hidden','true');scene.append(n);return n;
}
function oneImpact(callback){let hit=false;return ()=>{if(!hit){hit=true;callback();}};}
export async function playCombatMotion(role,variant,impact,{hit:landed=true}={}){
  if(role==='hero'&&['attack','magic-bolt'].includes(variant))stopBattleVoice();
  const apply=oneImpact(impact),fighter=document.querySelector(`.fighter.${role}`),target=document.querySelector(`.fighter.${role==='hero'?'enemy':'hero'}`);
  if(!fighter||!target){apply();return;}
  const kind=fighter.dataset.kind,profile=motionProfile(kind,variant),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(role==='hero')playBattleVoice(['attack','magic-bolt'].includes(variant)?'attack_'+kind:variant,role,{chance:['attack','magic-bolt'].includes(variant)?.65:1});
  const scene=fighter.parentElement,box=scene.getBoundingClientRect(),a=spriteBounds(fighter),b=spriteBounds(target),direction=role==='hero'?1:-1;
  const heavy=['knight','golem'].includes(kind),ranged=profile.ranged,double=variant==='double_strike';
  const duration=reduced?360:profile.duration,contact=reduced?.5:profile.contact;
  const distance=ranged||reduced?0:Math.max(0,Math.abs(a.left+a.width/2-b.left-b.width/2)-a.width*.36-b.width*.13)*direction;
  const origin={x:a.left+a.width*(role==='hero'?.72:.29)-box.left,y:a.top+a.height*.57-box.top};
  const dest={x:b.left+b.width*.50-box.left,y:b.top+b.height*.69-box.top};
  const newThemes={'acid-fountain':'acid','coin-storm':'coin',sandstorm:'sand','sonic-cry':'sonic','frost-breath':'frost','core-laser':'core'};
  const theme=newThemes[variant]||(variant==='fireball'?'fire':variant==='frost_lance'?'frost':variant==='poison'?'poison':variant==='web'?'web':variant==='iron_oath'?'gold':role==='enemy'?'dark':'arcane');
  const nodes=[],animations=[];
  const add=(name,x,y)=>{const n=effect(scene,name,x,y);nodes.push(n);return n;};
  const animate=(n,keys,options)=>{const a=n.animate(keys,options);animations.push(a);return a;};
  const normalAttack=['attack','magic-bolt','acid-lunge','chest-bite','mandible-ram','wing-dive','ice-pounce','gear-slash'].includes(variant);
  fighter.dataset.motion=ranged?'cast':role==='enemy'&&!normalAttack?'technique':'attack';
  fighter.dataset.variant=variant;fighter.dataset.progress='0';fighter.style.zIndex='5';
  const audioOptions={role,targetKind:target.dataset.kind,guarded:target.dataset.stance==='guard'};
  combatCue(kind,variant,'windup',audioOptions);
  let charge,projectile,release=false,secondRelease=false,hit=false,first=false,echoed=false;
  if(ranged&&!reduced){
    charge=add('motion-charge charge-'+theme,origin.x,origin.y);
    projectile=add('combat-projectile projectile-'+theme,origin.x,origin.y);projectile.style.opacity='0';
  }
  function slash(second=false){
    if(variant==='stone'){
      const n=add('motion-groundburst',dest.x,b.top+b.height*.94-box.top);n.innerHTML='<i></i><i></i><i></i><i></i>';
      animate(n,[{opacity:1,transform:'translate(-50%,-50%) scale(.45)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}],{duration:420,fill:'both'});return;
    }
    const n=add('motion-slash '+(role==='enemy'?'slash-enemy':kind==='knight'?'slash-gold':'slash-mint')+(variant==='smoke_blade'?' slash-shadow':''),dest.x,dest.y);
    const angle=(second?-40:40)*direction;
    animate(n,[{opacity:0,transform:`rotate(${angle-35}deg) scale(.55)`},{opacity:1,transform:`rotate(${angle}deg) scale(1)`,offset:.25},{opacity:0,transform:`rotate(${angle+55}deg) scale(1.1)`}],{duration:heavy?310:220,fill:'both'});
  }
  try{
    await timeline(duration,p=>{
      fighter.dataset.progress=String(p);
      if(!reduced){
        let offset=motionOffset(p,distance,heavy);
        if(double&&p>.43&&p<.62)offset=distance-direction*18*Math.sin((p-.43)/.19*Math.PI);
        let lift=0,tilt=0;const air=Math.sin(Math.max(0,Math.min(1,(p-.20)/.52))*Math.PI);
        if(profile.path==='hop')lift=-30*air;
        if(profile.path==='dive'){lift=-58*air;tilt=-13*air;}
        if(profile.path==='pounce')lift=-39*air;
        if(profile.path==='ram'){lift=-4*air;tilt=3*air;}
        if(profile.path==='gear'){lift=-10*air;tilt=7*air;}
        if(profile.path==='surge')lift=5*air;
        fighter.style.transform=`translate(${Math.round(offset)}px,${Math.round(lift)}px) rotate(${tilt.toFixed(1)}deg)`;
        if(variant==='smoke_blade')fighter.style.opacity=p>.25&&p<.38?'.35':'1';
        if(charge){const growth=Math.min(1,p/.40);charge.style.opacity=p<profile.release?String(growth):'0';charge.style.transform=`rotate(${Math.round(p*240)}deg) scale(${.25+growth*.8})`;}
        if(projectile&&p>=profile.release){
          const flight=Math.min(1,(p-profile.release)/(profile.contact-profile.release));
          projectile.style.left=Math.round(origin.x+(dest.x-origin.x)*flight)+'px';projectile.style.top=Math.round(origin.y+(dest.y-origin.y)*flight)+'px';projectile.style.opacity=p<=contact?'1':'0';
          projectile.style.transform=`scaleX(${direction}) scale(${.65+flight*.5})`;
        }
        if(!ranged&&!echoed&&p>=.30){
          echoed=true;const raster=fighter.querySelector('canvas');
          if(raster&&['double_strike','smoke_blade'].includes(variant))for(let i=0;i<2;i++){
            const n=document.createElement('canvas');n.width=n.height=256;n.getContext('2d').drawImage(raster,0,0);n.className='motion-echo';n.style.cssText=`left:${a.left-box.left+distance*(.30+i*.18)}px;top:${a.top-box.top}px;width:${a.width}px;height:${a.height}px`;scene.append(n);nodes.push(n);animate(n,[{opacity:.22-i*.06},{opacity:0}],{duration:290,fill:'both'});
          }
        }
        if(double&&!first&&p>=.37){first=true;slash();}
      }
      if(double&&!secondRelease&&p>=(reduced?.42:.55)){secondRelease=true;combatCue(kind,variant,'release',audioOptions);}
      if(!release&&p>=(reduced?.2:profile.release)){release=true;combatCue(kind,variant,'release',audioOptions);}
      if(!hit&&p>=contact){
        hit=true;if(!reduced){if(!ranged)slash(double);else if(landed){
          const n=add('impact-bloom bloom-'+theme,dest.x,dest.y);animate(n,[{opacity:1,transform:'translate(-50%,-50%) scale(.35)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:420,fill:'both'});
        }
        const raster=target.querySelector('canvas');if(raster)animate(raster,[{transform:'translateX(0)'},{transform:`translateX(${direction*(landed?(target.dataset.stance==='guard'?2:7):-9)}px)`,offset:.3},{transform:'translateX(0)'}],{duration:240});}
        combatCue(kind,variant,landed?'hit':'miss',audioOptions);apply();
      }
    },contact,reduced?0:profile.hitStop);
  }finally{
    delete fighter.dataset.motion;delete fighter.dataset.progress;delete fighter.dataset.variant;fighter.style.zIndex='';fighter.style.transform='';fighter.style.opacity='';
    animations.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());
  }
}
export async function playUtilityMotion(command,impact){
  const apply=oneImpact(impact),fighter=document.querySelector('.fighter.hero');if(!fighter){apply();return;}
  const scene=fighter.parentElement,box=scene.getBoundingClientRect(),a=spriteBounds(fighter),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,kind=fighter.dataset.kind;
  const guard=command==='guard',contact=guard?.40:.68,duration=reduced?360:guard?1000:1350;
  fighter.dataset.motion=command;fighter.dataset.progress='0';
  const aura=effect(scene,`utility-aura aura-${command} aura-${kind}`,a.left+a.width*.5-box.left,a.top+a.height*.72-box.top);
  aura.innerHTML=guard?'<i class="guard-crest">◇</i><b>ป้องกัน</b>':'<i class="focus-mote"></i><i class="focus-mote"></i><i class="focus-mote"></i><b>FOCUS</b>';
  combatCue(kind,command,'windup');playBattleVoice(command+'_'+kind);
  let hit=false;
  try{
    await timeline(duration,p=>{
      fighter.dataset.progress=String(p);
      aura.style.opacity=reduced?'1':String(Math.min(1,p/.22,(1-p)/.18));
      aura.style.setProperty('--charge',String(p));
      if(!hit&&p>=contact){hit=true;combatCue(kind,command,'hit');apply();}
    },contact,reduced?0:45);
  }finally{delete fighter.dataset.motion;delete fighter.dataset.progress;aura.remove();}
}
export async function playPotionMotion(type,impact){
  const apply=oneImpact(impact),fighter=document.querySelector('.fighter.hero');if(!fighter){apply();return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=reduced?360:1450,scene=fighter.parentElement,bounds=scene.getBoundingClientRect(),a=spriteBounds(fighter);
  fighter.dataset.motion='drink';fighter.dataset.progress='0';fighter.dataset.potion=type;
  const label=effect(scene,'potion-sip-label '+(type==='mana'?'sip-mana':''),a.left+a.width*.5-bounds.left,a.top+a.height*.33-bounds.top);
  label.innerHTML=skillIcon(type==='mana'?'mana':'health')+'<b>'+(type==='mana'?'จิบยามานา':'ดื่มยาฟื้นพลัง')+'</b>';
  let applied=false;
  try{
    await timeline(duration,p=>{fighter.dataset.progress=String(p);if(!applied&&p>=.52){applied=true;apply();label.classList.add('sip-applied');}});
  }finally{delete fighter.dataset.motion;delete fighter.dataset.progress;delete fighter.dataset.potion;label.remove();}
}
