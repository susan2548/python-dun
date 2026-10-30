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

const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
export async function playCombatMotion(role, variant, impact) {
  const fighter = document.querySelector(`.fighter.${role}`);
  const target = document.querySelector(`.fighter.${role==='hero'?'enemy':'hero'}`);
  if (!fighter || !target) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const a=fighter.getBoundingClientRect(), b=target.getBoundingClientRect();
  const direction=role==='hero'?1:-1;
  const melee = ['attack','double_strike','shield_bash','smoke_blade','iron_oath'].includes(variant);
  const distance = melee ? Math.max(0,Math.abs((a.left+a.width/2)-(b.left+b.width/2))-a.width*.5) * direction : 0;
  const duration = reduced ? 300 : variant==='double_strike'?1050:melee?800:1200;
  fighter.dataset.motion = melee?'attack':'cast';
  const start=performance.now();
  let running=true;
  const pose=now=>{if(!running)return; fighter.dataset.pose=String(Math.min(23,Math.floor((now-start)/duration*24)));requestAnimationFrame(pose);};
  requestAnimationFrame(pose);
  const keys = reduced ? [{opacity:1},{opacity:1}] : melee ? [
    {transform:'translateX(0)',offset:0},
    {transform:`translateX(${-direction*12}px)`,offset:.18},
    {transform:`translateX(${distance}px)`,offset:.38},
    {transform:`translateX(${distance-direction*6}px)`,offset:.56},
    {transform:`translateX(${distance*.7}px)`,offset:.70},
    {transform:'translateX(0)',offset:1},
  ] : [{filter:'brightness(1)',offset:0},{filter:'brightness(1.25) drop-shadow(0 0 16px #75dcff)',offset:.45},{filter:'brightness(1)',offset:1}];
  const animation=fighter.animate(keys,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'});
  let projectile, flight;
  if(!melee && !reduced) {
    const scene=fighter.parentElement, bounds=scene.getBoundingClientRect();
    projectile=document.createElement('span');
    projectile.className='combat-projectile '+(variant==='fireball'?'projectile-fire':variant==='frost_lance'?'projectile-frost':role==='enemy'?'projectile-dark':'projectile-arcane');
    projectile.style.left=(a.left+a.width*.6-bounds.left)+'px';
    projectile.style.top=(a.top+a.height*.4-bounds.top)+'px';
    scene.append(projectile);
    const x=b.left+b.width*.5-(a.left+a.width*.6), y=b.top+b.height*.45-(a.top+a.height*.4);
    flight=projectile.animate([
      {opacity:0,transform:'translate(0,0) scale(.2)',offset:0},
      {opacity:1,transform:'translate(0,0) scale(1)',offset:.25},
      {opacity:1,transform:`translate(${x}px,${y}px) scale(1.3)`,offset:.72},
      {opacity:0,transform:`translate(${x}px,${y}px) scale(2)`,offset:.82},
      {opacity:0,offset:1},
    ],{duration,easing:'linear',fill:'both'});
  }
  try {
    await pause(duration*(melee ? .40 : .72));
    impact();
    await animation.finished;
  } finally { running=false; delete fighter.dataset.motion; delete fighter.dataset.pose; animation.cancel(); flight?.cancel(); projectile?.remove(); }
}
