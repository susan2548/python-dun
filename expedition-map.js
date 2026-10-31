import {LEVELS,countCleared} from './campaign.js?v=1';
import {coinAmount} from './currency.js?v=1';
// The expedition map is a view over the existing save. Selecting a room never
// spends resources, unlocks a floor, or replaces an unfinished battle.
export const ROOM_POINTS=[[18,84],[50,84],[82,84],[82,61],[50,61],[18,61],[18,38],[50,38],[82,38],[82,15],[50,15],[18,15]];
const ROUTES=ROOM_POINTS.slice(1).map(([x,y],i)=>`M${ROOM_POINTS[i][0]*10} ${ROOM_POINTS[i][1]*10} L${x*10} ${y*10}`);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
  lock:'<path d="M5 7V5a3 3 0 0 1 6 0v2M4 7h8v7H4zM8 10v2"/>',
  check:'<path d="m3 8 3 3 7-7"/>',
  sword:'<path d="m3 13 3-3m-2-2 4 4M6 10 12 2h2v2l-6 8"/>',
  skull:'<path d="M4 10C0 7 3 2 8 2s8 5 4 8v3H4zM6 13v2m4-2v2M5 6h1v2H5zm5 0h1v2h-1z"/>',
  book:'<path d="M8 4C5 2 2 3 2 3v10s3-1 6 1c3-2 6-1 6-1V3s-3-1-6 1v10"/>',
  arrow:'<path d="M2 8h11m-4-4 4 4-4 4"/>',
};
function icon(id){return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${icons[id]||icons.sword}</svg>`;}
export function mapFloorState(save,index){
  if(!Number.isInteger(index)||index<0||index>=LEVELS.length)throw new RangeError('Unknown dungeon floor');
  const cleared=Math.max(0,Math.min(LEVELS.length,Number(save.cleared)||0));
  const resume=Number.isInteger(save.activeBattle?.level)?save.activeBattle.level:null;
  const done=index<cleared||Number(save.stars?.[index])>0,locked=index>cleared&&!done&&resume!==index,otherBattle=resume!==null&&resume!==index;
  const stars=done?Math.max(0,Math.min(3,Number(save.stars?.[index])||1)):0;
  return {done,locked,otherBattle,resume:resume===index,frontier:index===Math.min(cleared,LEVELS.length-1),stars,canEnter:!locked&&!otherBattle};
}
export function currentMapFloor(save){return Number.isInteger(save.activeBattle?.level)?Math.max(0,Math.min(LEVELS.length-1,save.activeBattle.level)):Math.max(0,Math.min(LEVELS.length-1,Number(save.cleared)||0));}
function starsMarkup(count){
  return `<span class="atlas-stars" aria-hidden="true">${[1,2,3].map(n=>`<svg class="${n<=count?'earned':'empty'}" viewBox="0 0 20 20"><path d="m10 1 3 5.7 6.2.9-4.5 4.5 1.1 6.3L10 15.5l-5.8 2.9 1.1-6.3L.8 7.6 6.9 6.7z"/></svg>`).join('')}</span>`;
}
function stateLabel(state){return state.resume?'ต่อสู้ค้างอยู่':state.locked?'ยังไม่ปลดล็อก':state.done?'ผ่านแล้ว':'เดินทางต่อ';}

export function renderExpeditionMap({app,save,levels,classes,monsters,vitals,getVitals,skillIcon,onEnter,onShop,onInn,onHero,onReset}){
  const classId=save.classId||'adventurer',hero=classes[classId],portrait=['adventurer','knight','wizard'].indexOf(classId)*50;
  let selected=currentMapFloor(save);
  const totalStars=levels.reduce((sum,_,i)=>sum+mapFloorState(save,i).stars,0);
  app.innerHTML=`<section class="expedition-page"><header class="expedition-heading"><div><span class="eyebrow">THE RUNEBREAKER ATLAS</span><h1>แผนที่ดันเจี้ยน</h1><p>12 ห้องเรียนรู้ • อ่านหัวข้อ เลือกห้อง แล้วฝึก Python ทีละเรื่อง</p><div class="map-new-run"><button type="button" class="map-reset" id="newGameBtn" aria-describedby="newRunNote">↻ เริ่มเกมใหม่</button><small id="newRunNote">รีเซ็ตความคืบหน้าและเลือกอาชีพใหม่</small></div></div><div class="expedition-progress"><span>บันทึกการสำรวจ</span><strong>${countCleared(save)}<small> / ${levels.length} ชั้น</small></strong><div class="expedition-pips" aria-hidden="true">${levels.map((_,i)=>`<i class="${mapFloorState(save,i).done?'lit':''}"></i>`).join('')}</div><b>★ ${totalStars} / ${levels.length*3}</b><button class="expedition-continue" id="quickContinue">เดินทางต่อ →</button></div></header><div class="expedition-layout"><section class="atlas-shell" aria-labelledby="atlasHeading"><div class="atlas-heading"><h2 id="atlasHeading">เส้นทางสู่ใจกลางดันเจี้ยน</h2><span>${icon('book')} ${levels.length} ชั้น · 100 รูปแบบโจทย์</span></div><div class="atlas-board campaign-atlas" aria-label="เลือกห้องบนแผนที่เพื่อดูรายละเอียด"><img class="atlas-art" src="./assets/dungeon-atlas-v15.webp" width="1536" height="1024" alt="" decoding="async"><svg class="atlas-route" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${ROUTES.map((d,i)=>`<path d="${d}" class="${i+1<save.cleared?'visited':i+1===save.cleared?'next':'unvisited'}"/>`).join('')}</svg>${levels.map((level,i)=>{
    const state=mapFloorState(save,i),[x,y]=ROOM_POINTS[i];
    return `${state.locked?`<span class="atlas-fog" style="left:${x}%;top:${y-3}%" aria-hidden="true"></span>`:''}<button class="atlas-room ${state.done?'is-done':''} ${state.locked?'is-locked':''} ${i===levels.length-1?'is-boss':''} ${i===selected?'is-selected':''}" data-level="${i}" style="--room-x:${x}%;--room-y:${y}%" aria-pressed="${i===selected}" aria-controls="missionDetails" ${state.resume||(!save.activeBattle&&state.frontier)?'aria-current="step"':''} aria-label="ชั้น ${i+1} ${escape(level.name)} • ${stateLabel(state)}${state.done?` ${state.stars} ดาว`:''} • ดูรายละเอียด"><span class="room-number">${String(i+1).padStart(2,'0')}<i class="room-state">${icon(state.locked?'lock':state.done?'check':i===levels.length-1?'skull':'sword')}</i></span><span class="room-caption"><b>${escape(level.name)}</b>${starsMarkup(state.stars)}</span></button>`;
  }).join('')}<div class="atlas-player" data-player-level="${currentMapFloor(save)}" style="--player-x:${ROOM_POINTS[currentMapFloor(save)][0]}%;--player-y:${ROOM_POINTS[currentMapFloor(save)][1]}%;--portrait:${portrait}%" aria-hidden="true"><i></i><span>${save.activeBattle?'เล่นค้างไว้':'คุณอยู่ที่นี่'}</span></div></div><div class="atlas-footer"><div class="atlas-legend"><span><i class="legend-done"></i>ผ่านแล้ว</span><span><i class="legend-next"></i>เดินทางต่อ</span><span>${icon('lock')}ยังไม่เปิด</span></div><p>แตะห้องเพื่อดูศัตรูและบทเรียน</p></div><p class="atlas-selection" id="atlasSelectionLive" role="status"></p></section><aside class="mission-card" id="missionDetails" aria-labelledby="missionTitle"></aside></div><section class="expedition-hub" aria-labelledby="hubTitle"><div class="hub-hero"><div class="hub-portrait" style="--portrait:${portrait}%" aria-hidden="true"></div><div><span class="eyebrow" id="hubTitle">แคมป์นักผจญภัย</span><h2>${escape(hero.name)}</h2><span class="hub-attack" id="mapAttack"></span></div></div><div class="hub-vitals"><div><span>HP</span><b id="mapHp"></b></div><div class="hub-track health"><i id="mapHpFill"></i></div><div><span>MP</span><b id="mapMp"></b></div><div class="hub-track mana"><i id="mapMpFill"></i></div></div><div class="hub-pouch"><span>${skillIcon('health')}<b id="mapHealthPotions"></b></span><span>${skillIcon('mana')}<b id="mapManaPotions"></b></span><span class="hub-gold"><img class="coin-icon" src="./assets/icons/coin.svg" alt="" aria-hidden="true"> <b id="mapGold"></b><small>เหรียญ</small></span><small>เสบียงของคุณ</small></div><div class="hub-actions"><button class="btn gold small" id="shopBtn">${skillIcon('armor')} ร้านบราม</button><button class="btn ghost small" id="campBtn">${skillIcon('inn')} โรงแรมมิลา</button><button class="btn ghost small" id="changeClass">เปลี่ยนอาชีพ</button></div></section><div class="expedition-footnote"><p id="mapResourceNote"></p></div></section>`;

  function renderMission(){
    if(getVitals)vitals=getVitals();
    const level=levels[selected],monster=monsters[selected],state=mapFloorState(save,selected);
    const container=app.querySelector('#missionDetails');
    let button=state.resume?`กลับสู่การต่อสู้ชั้น ${selected+1}`:state.done?`สำรวจชั้น ${selected+1} อีกครั้ง`:`เข้าสู่ชั้น ${selected+1}`;
    let note=state.resume?'HP, MP และโจทย์เดิมยังอยู่ • เล่นต่อจากเทิร์นที่ค้าง':state.locked?`ผ่านชั้น ${selected} เพื่อปลดล็อกห้องนี้`:state.otherBattle?`จบการต่อสู้ชั้น ${save.activeBattle.level+1} ก่อนเริ่มห้องอื่น`:'ตอบถูก 3 โจทย์ในเรื่องนี้และปราบศัตรูเพื่อเปิดทางต่อ';
    if(state.locked)button='ยังไม่ปลดล็อก';else if(state.otherBattle)button='มีการต่อสู้ค้างอยู่';
    const canEnter=state.canEnter&&vitals.hp>0;
    if(!state.locked&&!state.otherBattle&&vitals.hp<=0){button='พักฟื้นก่อนเดินทาง';note='HP หมดแล้ว • แวะโรงแรมที่แคมป์เพื่อฟื้นพลังก่อน';}
    container.classList.toggle('mission-locked',state.locked);
    container.innerHTML=`<div class="mission-picture" style="--mission-scene:url('./assets/${level.scene}.png')"><span class="mission-floor">FLOOR ${String(selected+1).padStart(2,'0')} ${selected===levels.length-1?' / BOSS':''}</span>${["slime","mimic","scarab","bat","icewolf","sentinel"].includes(level.kind)?`<img class="mission-creature" src="./assets/animation-v15/${level.kind}-portrait.png" alt="" aria-hidden="true">`:`<div class="mission-monster" style="background-position:${["zombie","skeleton","spider","wraith","golem","necromancer"].indexOf(level.kind)%3*50}% ${Math.floor(["zombie","skeleton","spider","wraith","golem","necromancer"].indexOf(level.kind)/3)*100}%" aria-hidden="true"></div>`}<span class="mission-status ${state.done?'status-done':''}">${icon(state.locked?'lock':state.done?'check':'sword')}${stateLabel(state)}</span></div><div class="mission-body"><span class="mission-kicker">${selected===levels.length-1?'ศึกสุดท้าย':'ห้องที่เลือก'} · ${selected+1} / ${levels.length}</span><h2 id="missionTitle">${escape(level.name)}</h2><div class="mission-score">${starsMarkup(state.stars)}<span>${state.done?`สถิติ ${state.stars} / 3 ดาว`:'ยังไม่ได้รับดาว'}</span></div><div class="mission-enemy"><div><span>ผู้เฝ้าห้อง</span><strong>${escape(level.enemy)}</strong></div><b>HP ${monster.hp}</b></div><p class="mission-threat">${icon(selected===levels.length-1?'skull':'sword')} ${escape(monster.skill)} <span>· โจมตีพื้นฐาน ${monster.atk}</span></p><div class="mission-entry"><div class="mission-vitals"><span>พลังของคุณ</span><b>HP ${vitals.hp}/${vitals.maxHp} · MP ${vitals.mp}/${vitals.maxMp}</b></div><p id="missionEntryNote">${note}</p><button class="btn mission-start" id="continueBtn" aria-describedby="missionEntryNote" ${canEnter?'':'disabled'}>${state.locked?icon('lock'):icon('arrow')} ${button}</button>${save.activeBattle&&state.otherBattle?'<button class="mission-resume" id="resumeExpedition">กลับไปเล่นเทิร์นที่ค้าง →</button>':''}</div><div class="mission-lesson"><h3>${icon('book')} สิ่งที่จะได้ฝึก</h3><div>${level.topic.split('·').map(t=>`<span>${escape(t.trim())}</span>`).join('')}</div><small>อย่างน้อย 3 โจทย์ในเรื่องนี้ · สุ่มไม่ซ้ำจนกว่าจะครบชุด • เขียน Python เองทุกเทิร์น</small></div></div>`;
    app.querySelector('#continueBtn').onclick=()=>{if(mapFloorState(save,selected).canEnter&&vitals.hp>0)onEnter(selected);};
    if(app.querySelector('#resumeExpedition'))app.querySelector('#resumeExpedition').onclick=()=>onEnter(currentMapFloor(save));
    // Inspecting another room never changes the global resume destination.
    app.querySelector('#quickContinue').onclick=()=>onEnter(currentMapFloor(save));
    app.querySelector('#quickContinue').textContent=save.activeBattle?`เล่นต่อชั้น ${currentMapFloor(save)+1} →`:save.cleared===levels.length?'ท้าบอสอีกครั้ง →':'เดินทางต่อ →';
    app.querySelector('#quickContinue').disabled=vitals.hp<=0;
    app.querySelectorAll('.atlas-room').forEach(b=>{const active=Number(b.dataset.level)===selected;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));});
    app.querySelector('#atlasSelectionLive').textContent=`ชั้น ${selected+1} · ${level.name} · ${stateLabel(state)}`;
  }
  app.querySelectorAll('.atlas-room').forEach(button=>{
    button.onclick=()=>{selected=Number(button.dataset.level);renderMission();};
    button.onkeydown=e=>{
      let next=selected;
      if(e.key==='Home')next=0;else if(e.key==='End')next=levels.length-1;
      else if(['ArrowRight','ArrowDown'].includes(e.key))next=Math.min(LEVELS.length-1,Number(button.dataset.level)+1);
      else if(['ArrowLeft','ArrowUp'].includes(e.key))next=Math.max(0,Number(button.dataset.level)-1);else return;
      e.preventDefault();selected=next;renderMission();app.querySelector(`[data-level="${selected}"]`).focus({preventScroll:true});
    };
  });
  app.querySelector('#shopBtn').onclick=onShop;app.querySelector('#campBtn').onclick=onInn;app.querySelector('#changeClass').onclick=onHero;app.querySelector('#newGameBtn').onclick=onReset;
  renderMission();updateExpeditionVitals({save,vitals,hero});
}

export function updateExpeditionVitals({save,vitals,hero}){
  const root=document.querySelector('.expedition-hub');if(!root)return;
  const put=(id,value)=>{root.querySelector('#'+id).textContent=value;};
  put('mapHp',`${vitals.hp} / ${vitals.maxHp}`);put('mapMp',`${vitals.mp} / ${vitals.maxMp}`);
  put('mapAttack',`พลังโจมตี ${hero.atk+save.attackBonus}`);put('mapHealthPotions',save.potions);put('mapManaPotions',save.manaPotions);put('mapGold',save.gold);
  for(const [id,label] of [['mapHealthPotions','ยาฮีล'],['mapManaPotions','ยามานา'],['mapGold','เหรียญ']]){
    const item=root.querySelector('#'+id);item.parentElement.setAttribute('aria-label',`${label} ${item.textContent}`);item.parentElement.title=`${label} ${item.textContent}`;
  }
  root.querySelector('#mapHpFill').style.width=Math.max(0,vitals.hp/vitals.maxHp*100)+'%';root.querySelector('#mapMpFill').style.width=Math.max(0,vitals.mp/vitals.maxMp*100)+'%';
  const missionVitals=document.querySelector('.mission-vitals b');
  if(missionVitals)missionVitals.textContent=`HP ${vitals.hp}/${vitals.maxHp} · MP ${vitals.mp}/${vitals.maxMp}`;
  root.classList.toggle('hub-low-health',vitals.hp/vitals.maxHp<=.35);
  document.querySelector('#mapResourceNote').textContent=save.activeBattle?'มีการต่อสู้ค้างอยู่ • เข้าร้านได้ แต่ต้องจบการต่อสู้ก่อนพักโรงแรมหรือเปลี่ยนอาชีพ':vitals.hp/vitals.maxHp<=.35?'HP เหลือน้อย • แวะโรงแรมเพื่อเตรียมตัวก่อนลงชั้นใหม่':'HP / MP คงเหลือต่อเนื่องทุกชั้น • เตรียมยาและพักให้พร้อมก่อนเดินทาง';
}
