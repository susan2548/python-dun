import {SKILLS} from './tactical-engine.js?v=2';
import {GOODS,quote,purchase} from './economy.js';
import {skillIcon} from './combat-cinema.js?v=2';
const POS={adventurer:0,knight:50,wizard:100};
const ROLES={adventurer:'ROGUE / เลือดไหล • ม่านควัน',knight:'KNIGHT / ป้องกัน • เกราะเหล็ก',wizard:'MAGE / เผาไหม้ • เยือกแข็ง'};
const portrait=(id,extra='')=>`<div class="hero-portrait ${extra}" style="background-position:${POS[id]}% center" aria-hidden="true"></div>`;
function heroCards(classes,selected,attribute='data-hero') {
  return Object.entries(classes).map(([id,c])=>`<button class="portrait-card ${id===selected?'selected':''}" ${attribute}="${id}" aria-pressed="${id===selected}">${portrait(id)}<span class="portrait-caption"><b>${c.name}</b><small>HP ${c.hp} · MP ${c.mp}</small><small>ATK ${c.atk}</small></span></button>`).join('');
}
export function renderWelcome({app,classes,selected,hasSave,onSelect,onStart}) {
  app.innerHTML=`<section class="welcome-scene"><div class="welcome-shade"></div><div class="welcome-copy"><span class="eyebrow">THE RUNEBREAKER CHRONICLES</span><h1 class="pixel-title">PYTHON<br><span>DUNGEON</span></h1><p class="welcome-subtitle">ทุกบรรทัดคือพลังของเจ้า</p><p>อ่านทางศัตรู เลือกคำสั่ง แล้วเขียน Python<br>ฝ่าคำสาปหกชั้นด้วยความรู้และแผนการ</p><div class="welcome-features"><span>6 บทเรียน</span><span>3 อาชีพ / 6 สกิล</span><span>ต่อสู้เทิร์นเบส</span></div><div class="welcome-roster"><span class="eyebrow">CHOOSE YOUR HERO</span><div class="portrait-roster">${heroCards(classes,selected)}</div></div><div class="hero-summary"><b>${classes[selected].name}</b><span>${ROLES[selected]}</span></div><button class="btn welcome-start" id="startBtn">${hasSave?'กลับสู่การผจญภัย':'เริ่มผจญภัย'} <span>→</span></button><small class="welcome-save">บันทึกอัตโนมัติในเบราว์เซอร์ • โค้ดต้องเขียนเอง</small></div><div class="welcome-character">${portrait(selected)}<div class="welcome-classmark">${classes[selected].name}<small>${ROLES[selected]}</small></div></div><div class="welcome-bottom">CODE THE SPELL. READ THE ENEMY. SURVIVE THE DUNGEON.</div></section>`;
  app.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>onSelect(b.dataset.hero));
  app.querySelector('#startBtn').onclick=onStart;
}
export function openHeroHall({classes,current,showModal,onConfirm,blocked}) {
  let selected=current;
  showModal(`<section class="hero-hall"><div class="world-heading"><span class="eyebrow">THE HALL OF OATHS</span><h2>หอคำสัตย์นักผจญภัย</h2><p>เลือกผู้ที่จะนำเจ้าไปสู่ชั้นถัดไป</p></div><div class="portrait-roster">${heroCards(classes,selected,'data-pick')}</div><div id="heroDossier"></div><p class="world-note">${blocked?'มีการต่อสู้ค้างอยู่ จบการต่อสู้ก่อนเปลี่ยนอาชีพ':'การเปลี่ยนอาชีพรักษาสัดส่วน HP/MP เดิม ไม่มีการเติมพลังฟรี'}</p><div class="modal-actions"><button class="btn" id="confirmHero" ${blocked?'disabled':''}>ยืนยันเลือกอาชีพ</button><button class="btn ghost" data-close>กลับแผนที่</button></div></section>`);
  const draw=()=>{
    const c=classes[selected];
    document.querySelector('#heroDossier').innerHTML=`<div class="hero-dossier"><div><span class="eyebrow">${ROLES[selected]}</span><h3>${c.name}</h3><p>${c.flavor}</p><div class="dossier-stats"><span>HP <b>${c.hp}</b></span><span>MP <b>${c.mp}</b></span><span>ATK <b>${c.atk}</b></span></div></div><div class="dossier-skills">${SKILLS[selected].map(s=>`<div>${skillIcon(s.icon)}<span><b>${s.name}</b><small>${s.mp} MP · ${s.cd?'คูลดาวน์ '+s.cd+' เทิร์น':'ไม่มีคูลดาวน์'}<br>${s.description}</small></span></div>`).join('')}</div></div>`;
    document.querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('selected',b.dataset.pick===selected);b.setAttribute('aria-pressed',String(b.dataset.pick===selected));});
  };
  document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selected=b.dataset.pick;draw();});
  document.querySelector('#confirmHero').onclick=()=>onConfirm(selected);
  draw();
}
function npcStage(kind,name,role,text) {
  return `<aside class="npc-stage npc-${kind}"><div class="npc-nameplate"><strong>${name}</strong><span>${role}</span></div><div class="npc-dialogue"><span class="dialogue-speaker">${name}</span><p id="npcSpeech" aria-live="polite">${text}</p><span class="dialogue-diamond">◆</span></div></aside>`;
}
export function openMerchant({save,showModal,persist}) {
  let selected=GOODS[0];
  showModal(`<section class="world-screen merchant-screen">${npcStage('merchant','บราม','พ่อค้าแห่งประตูหิน','ยินดีต้อนรับนักเดินทาง! ชี้หรือแตะสินค้าที่สนใจ ข้าจะเล่าให้ฟังว่ามันช่วยเจ้าอย่างไร')}<div class="world-content"><div class="world-heading"><span class="eyebrow">BRAM’S TRADING POST</span><h2>ร้านค้าประตูหิน</h2><p>เลือกสินค้า แล้วกดซื้อ • สต็อกยาเติมเมื่อผ่านชั้นใหม่</p><div class="shop-wallet" id="merchantWallet"></div></div><div class="merchant-shelves">${GOODS.map(item=>`<button class="merchant-item" data-item="${item.id}">${skillIcon(item.icon)}<span><b>${item.name}</b><small data-price="${item.id}"></small></span></button>`).join('')}</div><div class="item-inspection" id="itemInspection"></div><button class="btn buy-selected" id="buySelected">ซื้อ 1 ชิ้น</button><button class="btn ghost world-exit" data-close>ออกจากร้าน →</button></div></section>`);
  const speech=text=>document.querySelector('#npcSpeech').textContent=text;
  const refresh=()=>{
    document.querySelector('#merchantWallet').textContent=`✦ ${save.gold} เหรียญ · ยาฮีล ${save.potions} / ยามานา ${save.manaPotions}`;
    for(const item of GOODS){const q=quote(save,item);document.querySelector(`[data-price="${item.id}"]`).textContent=`✦ ${q.price} · เหลือ ${q.left}${['attack','hp'].includes(item.id)?' ขั้น':' ขวด'}`;}
    const q=quote(save,selected);
    document.querySelector('#itemInspection').innerHTML=`${skillIcon(selected.icon)}<div><h3>${selected.name}</h3><p>${selected.description}</p><b>✦ ${q.price}</b></div>`;
    const buy=document.querySelector('#buySelected');
    const upgradeBlocked=save.activeBattle&&['attack','hp'].includes(selected.id);
    buy.textContent=upgradeBlocked?'อัปเกรดได้ระหว่างชั้นเท่านั้น':q.left<=0?'สินค้าหมด':save.gold<q.price?`เหรียญไม่พอ (ขาด ${q.price-save.gold})`:`ซื้อ ${selected.name} · ✦ ${q.price}`;
    buy.disabled=upgradeBlocked||q.left<=0||save.gold<q.price;
    document.querySelectorAll('[data-item]').forEach(b=>b.classList.toggle('selected',b.dataset.item===selected.id));
  };
  document.querySelectorAll('[data-item]').forEach(b=>{
    const select=()=>{selected=GOODS.find(i=>i.id===b.dataset.item);speech(selected.speech);refresh();};
    const explain=()=>speech(GOODS.find(i=>i.id===b.dataset.item).speech);
    b.onmouseenter=explain;b.onfocus=explain;b.onclick=select;
  });
  document.querySelector('#buySelected').onclick=()=>{const result=purchase(save,selected.id);speech(result.message);if(result.ok)persist();refresh();};
  refresh();
}
export function openInn({save,vitals,blocked,showModal,onRest}) {
  const hp=Math.min(55,vitals.maxHp-vitals.hp),mp=Math.min(6,vitals.maxMp-vitals.mp);
  const reason=blocked?'ยังมีการต่อสู้ค้างอยู่ กลับไปจบชั้นก่อน แล้วข้าจะเตรียมห้องให้นะ':hp===0&&mp===0?'เจ้าดูสดชื่นดีอยู่แล้ว ไม่ต้องเสียเหรียญตอนนี้หรอก':`วันนี้ข้าเตรียมห้องไว้ให้แล้ว พักหนึ่งคืนจะฟื้น ${hp} HP และ ${mp} MP ราคา 30 เหรียญ`;
  showModal(`<section class="world-screen inn-screen">${npcStage('inn','มิลา','เจ้าของโรงแรมแสงตะเกียง',reason)}<div class="world-content"><div class="world-heading"><span class="eyebrow">THE LANTERN’S REST</span><h2>โรงแรมแสงตะเกียง</h2><p>ที่พักอุ่น ๆ ระหว่างชั้นดันเจี้ยน</p><div class="shop-wallet">✦ ${save.gold} เหรียญ</div></div><div class="inn-recovery"><span>พลังปัจจุบัน</span><div><b>HP ${vitals.hp}/${vitals.maxHp}</b><b>MP ${vitals.mp}/${vitals.maxMp}</b></div><span>หลังพักหนึ่งคืน</span><div class="after-rest"><b>HP ${vitals.hp+hp}/${vitals.maxHp}</b><b>MP ${vitals.mp+mp}/${vitals.maxMp}</b></div></div><div class="inn-service">${skillIcon('inn')}<div><h3>ห้องพักนักเดินทาง</h3><p>ฟื้นสูงสุด 55 HP / 6 MP • ไม่เกินพลังสูงสุด<br>ยาฮีลฟื้นเพียง 20 HP และยามานา 3 MP การพักจึงคุ้มกว่าระหว่างชั้น</p></div></div><button class="btn buy-selected" id="confirmRest" ${blocked||(!hp&&!mp)||save.gold<30?'disabled':''}>${save.gold<30?'เหรียญยังไม่พอ':'พักหนึ่งคืน · ✦ 30'}</button><button class="btn ghost" id="innTalk">คุยกับมิลา</button><button class="btn ghost world-exit" data-close>กลับสู่แผนที่ →</button></div></section>`);
  const lines=['เห็นศัตรูเตรียมท่าหนัก ให้ป้องกันเสียหนึ่งเทิร์น อย่าฝืนโจมตีทุกครั้งนะ','Focus ฟื้น 1 MP และเพิ่มดาเมจโจมตีเทิร์นถัดไป แต่ศัตรูยังสวน เจ้าต้องเลือกจังหวะให้ดี','พิษกับไฟเผาจะมีไอคอนบอกเทิร์นคงเหลือใต้แถบพลัง ตรวจดูทุกครั้งก่อนออกคำสั่ง','ยาฉุกเฉินมีสต็อกจำกัด เก็บไว้ใช้กลางด่าน แล้วกลับมาพักกับข้าระหว่างชั้นสิ'];let line=0;
  document.querySelector('#innTalk').onclick=()=>{document.querySelector('#npcSpeech').textContent=lines[line++%lines.length];};
  document.querySelector('#confirmRest').onclick=onRest;
}
