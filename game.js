import { CHALLENGES, TAKEAWAYS } from "./curriculum.js?v=2";
import {
  currentTrackName,
  playSfx,
  setMuted,
  switchTrack,
} from "./audio-engine.js?v=3";
import { mountSpriteMotion } from "./sprite-motion.js?v=3";
import { MONSTERS, enemyIntent, attackDamage, incomingDamage } from "./combat-rules.js?v=1";
import { playCutscene, playCombatMotion, skillIcon } from "./combat-cinema.js?v=1";
const LEVELS = [
  {
    name: "ประตูดันเจี้ยน",
    topic: "เริ่มต้น Python · print() · ไวยากรณ์",
    enemy: "ซอมบี้",
    hp: 36,
    atk: 7,
    scene: "entrance",
    sprite: 0,
  },
  {
    name: "โถงหินต้องสาป",
    topic: "ตัวแปร · ตัวเลข · สตริง",
    enemy: "โครงกระดูก",
    hp: 60,
    atk: 9,
    scene: "hall",
    sprite: 1,
  },
  {
    name: "สุสานแห่งข้อมูล",
    topic: "ตัวดำเนินการ · list · tuple · set",
    enemy: "แมงมุมพิษ",
    hp: 80,
    atk: 10,
    scene: "crypt",
    sprite: 2,
  },
  {
    name: "ถ้ำใยแมงมุม",
    topic: "if · for · while",
    enemy: "ภูตเงา",
    hp: 102,
    atk: 12,
    scene: "cavern",
    sprite: 3,
  },
  {
    name: "หอสมุดเวทมนตร์",
    topic: "ฟังก์ชัน · อาร์เรย์ · โมดูล",
    enemy: "โกเลมหิน",
    hp: 126,
    atk: 15,
    scene: "library",
    sprite: 4,
  },
  {
    name: "บัลลังก์จอมเวท",
    topic: "class · object · try/except",
    enemy: "เนโครแมนเซอร์",
    hp: 145,
    atk: 16,
    scene: "throne",
    sprite: 5,
  },
];
const LESSONS = [
  "print() แสดงข้อความ ส่วน attack() สั่งโจมตี",
  "ตัวแปรเก็บค่าไว้ใช้ซ้ำ ลองเปลี่ยนตัวเลขใน power",
  "list เก็บข้อมูลหลายค่า และ len() นับจำนวนสมาชิก",
  "for ทำคำสั่งซ้ำ ส่วน if เลือกว่าจะโจมตีเมื่อใด",
  "def สร้างฟังก์ชัน เรียกชื่อฟังก์ชันเพื่อใช้คำสั่งข้างใน",
  "class สร้างตัวละคร/วัตถุ และ try/except จัดการข้อผิดพลาด",
];
LEVELS.forEach((level, i) => Object.assign(level, {hp: MONSTERS[i].hp, atk: MONSTERS[i].atk}));
const CLASSES = {
  adventurer: {
    name: "นักผจญภัย",
    icon: "◈",
    hp: 105,
    mp: 10,
    atk: 10,
    skill: "double_strike",
    skillName: "ฟันสองจังหวะ",
    skillDesc: "โจมตีแรงขึ้น • ใช้ 5 MP",
    flavor: "คล่องตัวและสมดุล เหมาะกับการเริ่มสำรวจ",
  },
  knight: {
    name: "อัศวิน",
    icon: "♜",
    hp: 145,
    mp: 10,
    atk: 11,
    skill: "shield_bash",
    skillName: "กระแทกโล่",
    skillDesc: "โจมตีพร้อมตั้งรับ • ใช้ 5 MP",
    flavor: "เลือดสูงและรับความเสียหายได้ดี",
  },
  wizard: {
    name: "พ่อมด",
    icon: "✧",
    hp: 82,
    mp: 12,
    atk: 8,
    skill: "fireball",
    skillName: "ลูกไฟเวท",
    skillDesc: "เวทไฟรุนแรง • ใช้ 6 MP",
    flavor: "เลือดน้อย แต่โจมตีด้วยเวทได้แรง",
  },
};
const STORAGE = "python-dungeon-rpg-v1";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fresh = () => ({
  classId: null,
  cleared: 0,
  stars: [0, 0, 0, 0, 0, 0],
  gold: 30,
  potions: 2,
  manaPotions: 2,
  expedition: null,
  activeBattle: null,
  attackBonus: 0,
  hpBonus: 0,
});
let save;
try {
  save = { ...fresh(), ...JSON.parse(localStorage.getItem(STORAGE) || "{}") };
} catch {
  save = fresh();
}
let screen = "intro",
  battle = null,
  selected = "adventurer",
  modal = null,
  muted = true,
  worker = null,
  workerId = 0,
  workerPending = new Map();
const app = $("#app");
function persist() {
  if (screen === "battle" && battle && !battle.rescued) {
    save.expedition = { hp: battle.hp, mp: battle.mp, maxHp: battle.maxHp, maxMp: battle.maxMp };
    save.activeBattle = battle.finished ? null : { ...battle, busy: false, code: "" };
  }
  localStorage.setItem(STORAGE, JSON.stringify(save));
  updateBar();
}
function updateBar() {
  switchTrack(
    screen === "battle" && battle
      ? `floor${battle.level}`
      : screen === "map"
        ? "map"
        : "intro",
  );
  $("#wallet").textContent = `✦ ${save.gold}`;
  $("#chapterTag").textContent =
    screen === "battle" && battle
      ? `FLOOR ${String(battle.level + 1).padStart(2, "0")} / 06`
      : "CODE • CONQUER • LEARN";
  if (!muted) $("#soundBtn").title = `ปิดเสียง • ${currentTrackName()}`;
}
function toast(message) {
  let t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
function beep() {
  playSfx("ui");
}
function resetWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const p of workerPending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error("หมดเวลาประมวลผล Python กรุณาลองอีกครั้ง"));
  }
  workerPending.clear();
}
function runPython(code, challenge, skillName) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      worker = new Worker("./python-worker.mjs?v=3", { type: "module" });
      worker.onmessage = ({ data }) => {
        let p = workerPending.get(data.id);
        if (p) {
          clearTimeout(p.timer);
          workerPending.delete(data.id);
          p.resolve(data);
        }
      };
      worker.onerror = () => resetWorker();
    }
    let id = ++workerId;
    let timer = setTimeout(() => {
      resetWorker();
    }, 45000);
    workerPending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, code, challenge, skillName, rune: battle?.phase >= 3 ? battle.rune : '' });
  });
}
function renderIntro() {
  screen = "intro";
  window.scrollTo(0, 0);
  updateBar();
  app.innerHTML = `<section class="intro"><div class="intro-copy"><span class="eyebrow">A CODE-POWERED DUNGEON RPG</span><h1 class="pixel-title">PYTHON<br><span>DUNGEON</span></h1><p class="intro-lead">เขียน Python เพื่อโจมตี ร่ายสกิล และฝ่าดันเจี้ยนทั้ง 6 ชั้น เรียนรู้จากพื้นฐานจนถึงคลาสผ่านการต่อสู้แบบเทิร์นเบส</p><div class="feature-list"><span>▣ Python รันจริง</span><span>⚔ ต่อสู้เทิร์นเบส</span><span>⌁ 6 ชั้น / 6 หัวข้อ</span><span>✦ ร้านค้าและอัปเกรด</span></div><div class="class-select"><h3>เลือกอาชีพของคุณ</h3><div class="class-cards">${Object.entries(
    CLASSES,
  )
    .map(
      ([id, c]) =>
        `<button class="class-card ${selected === id ? "selected" : ""}" data-class="${id}"><span class="class-icon">${c.icon}</span><strong>${c.name}</strong><small>${c.flavor}</small></button>`,
    )
    .join(
      "",
    )}</div></div><div class="intro-actions"><button class="btn" id="startBtn">${save.classId ? "กลับสู่แผนที่" : "เริ่มผจญภัย"} →</button><small>บันทึกความคืบหน้าในเบราว์เซอร์เครื่องนี้อัตโนมัติ</small></div></div><div class="hero-visual"><div class="hero-sprite" id="introHero" style="background-position:${["adventurer", "knight", "wizard"].indexOf(selected) * 50}% center"></div><div class="monster-sprite"></div><div class="visual-caption"><span>HERO SELECT</span><span>FLOOR 01 / 06</span></div></div></section>`;
  document.querySelectorAll("[data-class]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.class;
        renderIntro();
      }),
  );
  $("#startBtn").onclick = () => {
    save.classId = selected;
    persist();
    beep(660);
    renderMap();
  };
}
function renderMap() {
  if (screen === "battle" && battle) persist();
  screen = "map";
  battle = null;
  window.scrollTo(0, 0);
  updateBar();
  let current = clamp(save.cleared + 1, 1, 6),
    c = CLASSES[save.classId || "adventurer"];
  const pts = [
    [13, 79],
    [35, 65],
    [59, 78],
    [80, 56],
    [56, 36],
    [23, 27],
  ];
  app.innerHTML = `<section class="page-wrap"><div class="map-heading"><div><span class="eyebrow">THE DUNGEON PATH</span><h1 class="pixel-title">แผนที่ดันเจี้ยน</h1><div class="muted">เลือกชั้นที่ปลดล็อก แล้วเขียนโค้ดพิชิตมอนสเตอร์</div></div><div class="map-actions"><button class="btn small" id="quickContinue">▶ ${save.cleared === 6 ? "เล่นบอสอีกครั้ง" : "เล่นชั้นถัดไป"}</button><button class="btn ghost small" id="changeClass">${c.icon} ${c.name}</button><button class="btn gold small" id="shopBtn">✦ ร้านค้า</button></div></div><div class="map-guide">${save.cleared === 6 ? "พิชิตครบ 6 ชั้นแล้ว! เลือกชั้นบนแผนที่เพื่อเล่นซ้ำและเก็บดาวเพิ่ม" : "โหนดสีทองคือชั้นที่เล่นต่อได้ • กด “เล่นชั้นถัดไป” เพื่อเข้าสู่การต่อสู้"}</div><div class="map-layout"><div class="dungeon-map" aria-label="แผนที่หกชั้น"><div class="map-ribbon">DUNGEON / 6 FLOORS</div><svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M13 79 C25 90 28 60 35 65 S50 90 59 78 S85 72 80 56 S68 35 56 36 S36 20 23 27"/><path class="route-fill" d="M13 79 C25 90 28 60 35 65 S50 90 59 78 S85 72 80 56 S68 35 56 36 S36 20 23 27"/></svg><span class="map-deco" style="left:9%;top:11%">♜</span><span class="map-deco" style="left:72%;top:14%">⌂</span><span class="map-deco" style="left:42%;top:48%">✧</span><span class="map-deco" style="left:81%;top:84%">✝</span>${LEVELS.map(
    (l, i) => {
      let done = i < save.cleared,
        active = i === save.cleared,
        locked = i > save.cleared;
      return `<button class="map-node ${done ? "done" : active ? "current" : "locked"}" data-level="${i}" ${locked ? "disabled" : ""} style="left:${pts[i][0]}%;top:${pts[i][1]}%" aria-label="ชั้น ${i + 1} ${l.name} ${locked ? "ยังไม่ปลดล็อก" : ""}"><span class="node-circle">${done ? "✓" : locked ? "◆" : String(i + 1).padStart(2, "0")}</span><span class="node-label">${l.name}</span><span class="node-stars ${done ? "" : "dim"}">${done ? "★".repeat(save.stars[i] || 1) + "☆".repeat(3 - (save.stars[i] || 1)) : active ? "เริ่มที่นี่" : "☆☆☆"}</span></button>`;
    },
  ).join(
    "",
  )}</div><aside class="map-side"><div class="panel"><span class="eyebrow">YOUR HERO</span><h3>${c.icon} ${c.name}</h3><div class="stat-grid"><span>HP สูงสุด<b>${c.hp + save.hpBonus}</b></span><span>พลังโจมตี<b>${c.atk + save.attackBonus}</b></span><span>ยาฟื้นพลัง<b>${save.potions}</b></span><span>เหรียญ<b>${save.gold}</b></span></div><div class="divider"></div><p>สกิล: <b style="color:var(--gold)">${c.skillName}</b><br>${c.skillDesc}</p></div><div class="panel"><span class="eyebrow">PROGRESS</span><h3>พิชิต ${save.cleared} / 6 ชั้น</h3><div class="progress-track"><i style="width:${(save.cleared / 6) * 100}%"></i></div><p>${save.cleared === 6 ? "คุณพิชิตดันเจี้ยนแล้ว! เลือกชั้นเพื่อเล่นซ้ำได้" : `ชั้นถัดไป: ${LEVELS[Math.min(save.cleared, 5)].name}`}</p><div class="progress-actions"><button class="btn small" id="continueBtn">${save.cleared === 6 ? "เล่นชั้นสุดท้ายอีกครั้ง" : "เข้าสู่ชั้น " + current} →</button><button class="btn ghost small" id="newGameBtn">↺ เริ่มเกมใหม่</button></div></div></aside></div></section>`;
  document
    .querySelectorAll("[data-level]")
    .forEach((b) => (b.onclick = () => startBattle(+b.dataset.level)));
  $("#continueBtn").onclick = () => startBattle(Math.min(save.cleared, 5));
  $("#shopBtn").onclick = showShop;
  $("#changeClass").onclick = showClassPicker;
  $("#quickContinue").onclick = () => startBattle(Math.min(save.cleared, 5));
  $("#newGameBtn").onclick = showResetPrompt;
  const vitals = getVitals();
  $(".map-side .stat-grid").insertAdjacentHTML("afterend", `<div class="expedition-vitals">♥ HP ${vitals.hp}/${vitals.maxHp} · ◆ MP ${vitals.mp}/${vitals.maxMp}<small>พลังคงเหลือต่อเนื่องทุกชั้น • ไม่มีฟื้นอัตโนมัติ</small></div><button class="btn ghost small" id="campBtn">พักแรม ✦ 30 · +55 HP / +6 MP</button>`);
  $("#campBtn").onclick = restAtCamp;
  if(save.activeBattle) {
    const level=save.activeBattle.level;
    $('.map-guide').textContent=`มีการต่อสู้ค้างอยู่: ชั้น ${level+1} ${LEVELS[level].name} • เลือด มานา และโจทย์ยังอยู่เหมือนเดิม`;
    $('#quickContinue').textContent=`▶ เล่นต่อชั้น ${level+1}`;
    $('#continueBtn').textContent=`กลับสู่การต่อสู้ชั้น ${level+1} →`;
    $('#quickContinue').onclick=$('#continueBtn').onclick=()=>startBattle(level);
  }
}
function getVitals() {
  const c = CLASSES[save.classId || 'adventurer'];
  const maxHp = c.hp + save.hpBonus, maxMp = c.mp;
  if (!save.expedition) return {hp:maxHp, mp:maxMp, maxHp, maxMp};
  return { hp: clamp(save.expedition.hp, 0, maxHp), mp: clamp(save.expedition.mp, 0, maxMp), maxHp, maxMp };
}
function restAtCamp() {
  if (save.activeBattle) return toast('ยังมีการต่อสู้ค้างอยู่ จบการต่อสู้ก่อนพักแรม');
  const v = getVitals();
  if (v.hp === v.maxHp && v.mp === v.maxMp) return toast('พลังเต็มอยู่แล้ว');
  if (save.gold < 30) return toast('พักแรมต้องใช้ 30 เหรียญ');
  save.gold -= 30;
  save.expedition = {...v, hp:Math.min(v.maxHp, v.hp+55), mp:Math.min(v.maxMp, v.mp+6)};
  persist(); renderMap(); toast('พักแล้ว: ฟื้นได้สูงสุด 55 HP และ 6 MP');
}
function showResetPrompt() {
  showModal(
    '<span class="eyebrow">NEW GAME</span><h2 class="pixel-title">เริ่มผจญภัยใหม่?</h2><p>ความคืบหน้า ดาว เหรียญ และของที่ซื้อในเบราว์เซอร์นี้จะเริ่มใหม่ทั้งหมด</p><div class="modal-actions"><button class="btn" id="confirmReset">ยืนยันเริ่มใหม่</button><button class="btn ghost" data-close>ยกเลิก</button></div>',
  );
  $("#confirmReset").onclick = () => {
    save = fresh();
    for (let i = 0; i < 6; i++) sessionStorage.removeItem("dungeon-code-" + i);
    persist();
    closeModal();
    selected = "adventurer";
    renderIntro();
  };
}
function showClassPicker() {
  showModal(
    `<span class="eyebrow">CHANGE YOUR HERO</span><h2 class="pixel-title">เลือกอาชีพ</h2><div class="shop-grid">${Object.entries(
      CLASSES,
    )
      .map(
        ([id, c]) =>
          `<button class="class-card ${save.classId === id ? "selected" : ""}" data-pick="${id}"><span class="class-icon">${c.icon}</span><strong>${c.name}</strong><small>${c.flavor}<br>${c.skillName}</small></button>`,
      )
      .join(
        "",
      )}</div><p>เปลี่ยนอาชีพรักษาสัดส่วน HP/MP เดิม ไม่ฟื้นพลัง และเปลี่ยนไม่ได้ระหว่างการต่อสู้</p><div class="modal-actions"><button class="btn ghost" data-close>ปิด</button></div>`,
  );
  document.querySelectorAll("[data-pick]").forEach(
    (b) =>
      (b.onclick = () => {
        if (save.activeBattle) return toast('จบการต่อสู้ที่ค้างอยู่ก่อนเปลี่ยนอาชีพ');
        const old = getVitals();
        save.classId = b.dataset.pick;
        const next = CLASSES[save.classId];
        save.expedition = {hp:Math.ceil(old.hp/old.maxHp*(next.hp+save.hpBonus)), mp:Math.floor(old.mp/old.maxMp*next.mp), maxHp:next.hp+save.hpBonus, maxMp:next.mp};
        for (let i = 0; i < 6; i++)
          sessionStorage.removeItem("dungeon-code-" + i);
        persist();
        closeModal();
        renderMap();
        toast("เปลี่ยนอาชีพแล้ว");
      }),
  );
}
function showShop() {
  closeModal();
  showModal(
    `<span class="eyebrow">DUNGEON MERCHANT</span><h2 class="pixel-title">ร้านค้านักเดินทาง</h2><p>เหรียญของคุณ: <b style="color:var(--gold)">✦ ${save.gold}</b> • ซื้อของเพื่อเตรียมลงชั้นถัดไปหรือเล่นซ้ำ</p><div class="shop-grid"><div class="shop-item"><h3>🧪 ยาฟื้นพลัง</h3><p>กดใช้ยาในหน้าต่อสู้ ฟื้น 45 HP (ศัตรูโจมตีกลับ)</p><span class="price">✦ 25</span><br><button class="btn small" data-buy="potion" ${save.gold < 25 ? "disabled" : ""}>ซื้อ</button></div><div class="shop-item"><h3>⚔ ลับอาวุธ</h3><p>พลังโจมตีถาวร +2</p><span class="price">✦ 60</span><br><button class="btn small" data-buy="attack" ${save.gold < 60 ? "disabled" : ""}>ซื้อ</button></div><div class="shop-item"><h3>♥ เกราะหัวใจ</h3><p>HP สูงสุดถาวร +15</p><span class="price">✦ 55</span><br><button class="btn small" data-buy="hp" ${save.gold < 55 ? "disabled" : ""}>ซื้อ</button></div><div class="shop-item"><h3>⌁ คำแนะนำ</h3><p>ดูคำใบ้แนวคิดได้ฟรีในหน้าต่อสู้</p><span class="price">FREE</span></div></div><div class="modal-actions"><button class="btn ghost" data-close>กลับแผนที่</button></div>`,
  );
  modal.querySelector('.shop-grid').insertAdjacentHTML('beforeend', `<div class="shop-item"><h3>${skillIcon('mana')} ยามานา</h3><p>ฟื้น 6 MP ใช้แล้วศัตรูสวนกลับ</p><span class="price">✦ 18</span><br><button class="btn small" id="buyMana">ซื้อ</button></div>`);
  $('#buyMana').onclick = () => { if(save.gold<18) return toast('เหรียญไม่พอ'); save.gold-=18; save.manaPotions++; persist(); showShop(); };
  document.querySelectorAll("[data-buy]").forEach(
    (b) =>
      (b.onclick = () => {
        let item = b.dataset.buy,
          cost = item === "potion" ? 25 : item === "attack" ? 60 : 55;
        if (save.gold < cost) return;
        save.gold -= cost;
        if (item === "potion") save.potions++;
        if (item === "attack") save.attackBonus += 2;
        if (item === "hp") save.hpBonus += 15;
        persist();
        beep(850);
        showShop();
        toast("ซื้อสำเร็จ!");
      }),
  );
}
function showModal(html) {
  closeModal();
  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.append(modal);
  modal
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = closeModal));
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}
function closeModal() {
  modal?.remove();
  modal = null;
}
function startBattle(index) {
  if (index > save.cleared) return;
  closeModal();
  const l = LEVELS[index],
    c = CLASSES[save.classId];
  if (save.activeBattle) {
    if (save.activeBattle.level !== index) return toast('มีการต่อสู้ค้างอยู่ที่ชั้น '+(save.activeBattle.level+1)+' กลับไปจบก่อน');
    battle = {...save.activeBattle, busy:false};
    screen = 'battle'; renderBattle(); return;
  }
  const vitals = getVitals();
  if (vitals.hp <= 0) return toast('พลังหมดแล้ว กลับไปพักฟื้นก่อน');
  battle = {
    level: index,
    phase: 0,
    mistakes: 0,
    hp: vitals.hp,
    maxHp: c.hp + save.hpBonus,
    mp: vitals.mp,
    maxMp: c.mp,
    enemyHp: l.hp,
    maxEnemyHp: l.hp,
    turn: 1,
    guard: false,
    poison: 0,
    web: 0,
    enemyGuard: false,
    pressure: 0,
    poisonDamage: 4,
    stance: false,
    rune: '',
    logs: [
      `ชั้น ${index + 1}: ${l.enemy} ปรากฏตัว!`,
      `เสบียงคงเหลือ: HP ${vitals.hp} / MP ${vitals.mp} • ไม่ฟื้นระหว่างชั้น`,
    ],
    code: "",
    busy: false,
    finished: false,
    rewarded: false,
  };
  screen = "battle";
  renderBattle();
  persist();
}
function spritePosition(n) {
  return `${(n % 3) * 50}% ${Math.floor(n / 3) * 100}%`;
}
function renderBattle(shouldScroll = true) {
  const l = LEVELS[battle.level],
    c = CLASSES[save.classId];
  if (shouldScroll) window.scrollTo(0, 0);
  updateBar();
  const task = currentTask();
  app.innerHTML = `<section class="battle-page"><div class="battle-top"><div><span class="eyebrow">FLOOR ${String(battle.level + 1).padStart(2, "0")} / 06 • ${l.topic}</span><h1 class="pixel-title">${l.name}</h1></div><button class="btn ghost small" id="backMap">← แผนที่</button></div><div class="battle-scene" id="scene" style="--scene:url('./assets/${l.scene}.png')"><div class="combat-badge player"><div class="title"><span>${c.icon} ${c.name}</span><em>${battle.hp}/${battle.maxHp}</em></div><div class="hp-track"><i style="width:${(battle.hp / battle.maxHp) * 100}%"></i></div><span class="tiny">MP ${battle.mp}/${battle.maxMp}</span><div class="mana-track"><i style="width:${(battle.mp / battle.maxMp) * 100}%"></i></div></div><div class="combat-badge monster"><div class="title"><span>${l.enemy}</span><em>${battle.enemyHp}/${battle.maxEnemyHp}</em></div><div class="hp-track"><i style="width:${(battle.enemyHp / battle.maxEnemyHp) * 100}%"></i></div><span class="tiny">${battle.level === 5 ? "BOSS" : "ENEMY"} • TURN ${battle.turn}</span></div><div class="fighter hero" style="background-position:${["adventurer", "knight", "wizard"].indexOf(save.classId) * 50}% center"></div><div class="fighter enemy" style="background-position:${spritePosition(l.sprite)}"></div><button class="scene-cta" id="toCode">⌨ ไปเขียนโค้ด ↓</button><div class="scene-label">${l.name.toUpperCase()} / ${l.enemy}</div></div><div class="battle-under"><div class="panel code-panel"><div class="panel-heading"><h2>⌨ เขียนโค้ดเพื่อออกคำสั่ง</h2><span class="eyebrow">PYTHON</span></div><div class="challenge-head"><strong>โจทย์ ${battle.phase + 1} / 3</strong><span>${"●".repeat(Math.min(3,battle.phase))}${"○".repeat(Math.max(0,3-battle.phase))}</span></div><p class="goal-text"><b style="color:var(--gold)">ภารกิจ:</b> ${task.prompt}</p><div class="turn-guide"><span>1 อ่านภารกิจ</span><span>2 เขียน Python เอง</span><span>3 ถูกแล้วเปิดโจทย์ถัดไป</span></div><p class="lesson-line">💡 ${LESSONS[battle.level]}</p><div class="editor-top"><span>main.py</span><span>● LIVE PYTHON</span></div><textarea class="code-editor" id="code" spellcheck="false" aria-label="เขียนโค้ด Python" placeholder="เริ่มเขียนโค้ดที่นี่...">${esc(battle.code)}</textarea><div class="editor-bottom"><div class="action-hint">ใช้ <code>attack(พลัง)</code> / <code>skill("${c.skill}", พลัง)</code><br>พลัง 1–3 • หนึ่งคำสั่งต่อโจทย์ • MP ไม่ฟื้นระหว่างชั้น</div><button class="btn" id="runBtn">▶ รันโค้ด (1 เทิร์น)</button></div><div class="console" id="console">เขียนคำตอบเอง แล้วกดรัน • ถ้าไม่ผ่านจะบอกจุดที่ต้องแก้</div></div><div class="panel battle-info"><div class="panel-heading"><h2>⚔ บันทึกการต่อสู้</h2><span class="round">TURN ${battle.turn}</span></div><div class="battle-log" id="battleLog">${battle.logs
    .slice(-7)
    .map((x) => `<p>${esc(x)}</p>`)
    .join(
      "",
    )}</div><div class="divider"></div><div class="skill-box"><strong>✦ สกิลอาชีพ: ${c.skillName}</strong><p>${c.skillDesc}<br>เขียน <code>skill("${c.skill}", พลัง)</code> ในโค้ด • ใช้ได้สูงสุด 2 ครั้งต่อชั้น</p></div><div class="battle-controls"><button class="btn ghost small" id="potionBtn" ${save.potions < 1 ? "disabled" : ""}>🧪 ใช้ยา (${save.potions})</button><button class="btn ghost small" id="hintBtn">? ดูคำใบ้</button><button class="btn ghost small" id="resetCode">↺ ล้างช่องเขียน</button><button class="btn ghost small" id="rulesBtn">ℹ วิธีเล่น</button></div></div></div></section>`;
  $("#scene").insertAdjacentHTML(
    "beforeend",
    `<div class="fighter-shadow hero-shadow"></div><div class="fighter-shadow enemy-shadow"></div><div class="fx-layer" aria-hidden="true"></div><div class="music-chip">♫ ${currentTrackName()}</div><div class="combat-announcer" aria-live="polite"></div>`,
  );
  mountSpriteMotion(["adventurer", "knight", "wizard"].indexOf(save.classId), l.sprite);
  $('.challenge-head strong').textContent = battle.phase < 3 ? `โจทย์ ${battle.phase+1} / 3` : `ทำลายตราผนึก • รอบ ${battle.phase-2}`;
  $('.challenge-head span').textContent = '●'.repeat(Math.min(battle.phase,3)) + '○'.repeat(Math.max(0,3-battle.phase));
  $('.skill-box strong').innerHTML = `${skillIcon(c.skill)} สกิลอาชีพ: ${c.skillName}`;
  $('.skill-box p').innerHTML = `${c.skillDesc}<br>ใช้ <code>skill("${c.skill}", พลัง)</code> แทน attack() ได้ทุกโจทย์ • ใช้ MP คงเหลือจริง`;
  $('.action-hint').innerHTML = `ใช้ <code>attack(พลัง)</code> / <code>skill("${c.skill}", พลัง)</code><br>ผ่าน 3 บทเรียนแล้วต้องลด HP ศัตรูให้หมด • MP ไม่ฟื้นอัตโนมัติ`;
  $('.battle-info').insertAdjacentHTML('afterbegin', `<div class="tactics-panel"><div id="enemyIntent"></div><p>${MONSTERS[battle.level].description}</p><div id="statusLine"></div><button class="btn ghost small" id="stanceBtn">ตั้งรับ: ${battle.stance?'เปิด':'ปิด'} · 2 MP</button><small>ตั้งรับลดดาเมจที่รับ 60% แต่โจมตีเบาลง 20% • ผิด 2 ครั้งแรกฝึกฟรี หลังจากนั้นศัตรูสวนทุกครั้ง</small></div>`);
  $('.battle-controls').insertAdjacentHTML('beforeend', `<button class="btn ghost small" id="manaBtn">${skillIcon('mana')} ยามานา (${save.manaPotions})</button>`);
  $('#manaBtn').onclick = () => usePotion('mana');
  $('#stanceBtn').onclick = () => { if(battle.busy) return; battle.stance=!battle.stance; $('#stanceBtn').textContent=`ตั้งรับ: ${battle.stance?'เปิด':'ปิด'} · 2 MP`; persist(); };
  updateCombat();
  $("#code").oninput = (e) => {
    battle.code = e.target.value; /* คำตอบไม่ถูกเก็บข้ามโจทย์ */
  };
  $("#code").onkeydown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      let t = e.target,
        s = t.selectionStart;
      t.value = t.value.slice(0, s) + "    " + t.value.slice(t.selectionEnd);
      t.selectionStart = t.selectionEnd = s + 4;
      t.dispatchEvent(new Event("input"));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeTurn();
    }
  };
  $("#runBtn").onclick = executeTurn;
  $("#toCode").onclick = () =>
    $(".code-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#backMap").onclick = () => battle.busy ? toast("รอจบเทิร์นนี้ก่อนครับ") : renderMap();
  $("#hintBtn").onclick = () => toast(task.hint);
  $("#resetCode").onclick = () => {
    battle.code = "";
    $("#code").value = "";
    $("#code").focus();
    toast("ล้างช่องเขียนแล้ว");
  };
  $("#rulesBtn").onclick = showRules;
  $("#potionBtn").onclick = usePotion;
}
function currentTask() {
  const task = CHALLENGES[battle.level][battle.phase % 3];
  if (battle.phase < 3) return task;
  return {...task, prompt: `${task.prompt} แล้วเพิ่ม print("${battle.rune}") เพื่อทำลายตราผนึกใหม่`, hint: task.hint + ' และแสดงข้อความตราผนึกตามโจทย์'};
}
function showRules() {
  showModal(
    `<span class="eyebrow">HOW TO PLAY</span><h2 class="pixel-title">คู่มือนักโค้ด</h2><ol class="help-list"><li>แต่ละชั้นมี 3 โจทย์ อ่านโจทย์แล้วเขียน Python เองในช่องว่าง กดรันหรือ Ctrl+Enter</li><li>คำตอบต้องรันจริงและใช้แนวคิดที่กำหนด ผิด 2 ครั้งแรกได้ฝึกฟรี จากครั้งที่ 3 ศัตรูจะสวนทุกครั้งจนตอบถูก โดยไม่มีการจับเวลาอ่านโจทย์</li><li>ใช้ <code>attack(พลัง)</code> หรือ <code>skill("ชื่อสกิล", พลัง)</code> หนึ่งคำสั่งต่อโจทย์ พลังเป็นจำนวนเต็ม 1–3</li><li>เมื่อผ่าน โจทย์จะเปลี่ยนและช่องเขียนจะว่างทันที ศัตรูโจมตีกลับหนึ่งครั้งหลังคำตอบที่ผ่าน</li><li>HP/MP คงเหลือต่อเนื่องทุกชั้นและเมื่อรีโหลด พักแรมเสีย 30 เหรียญเพื่อฟื้น 55 HP/6 MP หรือซื้อยาจากร้านค้า ตั้งรับใช้ 2 MP ลดดาเมจที่รับ 60% แต่โจมตีเบาลง 20%</li><li>ต้องผ่านครบ 3 บทเรียนและลด HP ศัตรูให้หมด ถ้ายังไม่ตายจะมีโจทย์ต่อพร้อมตราผนึกใหม่ มอนสเตอร์ประกาศท่าถัดไปและมีสกิลเฉพาะตัว</li></ol><div class="modal-actions"><button class="btn" data-close>เข้าใจแล้ว</button></div>`,
  );
}
async function usePotion(type = 'health') {
  if (typeof type !== 'string') type = 'health';
  const mana = type === 'mana', inventory = mana ? 'manaPotions' : 'potions';
  if (!battle || battle.busy || battle.finished || save[inventory] < 1) return;
  if (mana ? battle.mp === battle.maxMp : battle.hp === battle.maxHp) {
    toast("พลังเต็มอยู่แล้ว");
    return;
  }
  battle.busy = true;
  save[inventory]--;
  persist();
  await frameBattle();
  let gain = mana ? Math.min(6, battle.maxMp-battle.mp) : Math.min(45,battle.maxHp-battle.hp);
  playSfx("potion");
  spawnBattleFx("heal", "hero");
  await wait(520);
  if(mana) battle.mp+=gain; else battle.hp+=gain;
  log(`ใช้ยา ฟื้น ${gain} ${mana?'MP':'HP'}`);
  updateCombat();
  await enemyTurn();
  if (battle.hp <= 0) {
    battle.finished = true;
    battle.busy = false;
    updateCombat();
    defeat();
    return;
  }
  battle.turn++;
  battle.busy = false;
  updateCombat();
  $("#potionBtn").textContent = `🧪 ใช้ยา (${save.potions})`;
  $("#potionBtn").disabled = save.potions < 1;
  $('#manaBtn').innerHTML = `${skillIcon('mana')} ยามานา (${save.manaPotions})`;
  persist();
  toast("ฟื้น HP แล้ว ศัตรูโจมตีกลับหนึ่งครั้ง");
}
function log(message) {
  battle.logs.push(message);
  if (battle.logs.length > 30) battle.logs.shift();
}
function updateCombat() {
  if (screen !== "battle") return;
  let c = CLASSES[save.classId],
    l = LEVELS[battle.level];
  $(".combat-badge.player .title em").textContent =
    `${battle.hp}/${battle.maxHp}`;
  $(".combat-badge.player .hp-track i").style.width =
    `${(battle.hp / battle.maxHp) * 100}%`;
  $(".combat-badge.player .tiny").textContent =
    `MP ${battle.mp}/${battle.maxMp}`;
  $(".combat-badge.player .mana-track i").style.width =
    `${(battle.mp / battle.maxMp) * 100}%`;
  $(".combat-badge.monster .title em").textContent =
    `${battle.enemyHp}/${battle.maxEnemyHp}`;
  $(".combat-badge.monster .hp-track i").style.width =
    `${(battle.enemyHp / battle.maxEnemyHp) * 100}%`;
  $(".combat-badge.monster .tiny").textContent =
    `${battle.level === 5 ? "BOSS" : "ENEMY"} • TURN ${battle.turn}`;
  $(".round").textContent = `TURN ${battle.turn}`;
  $("#battleLog").innerHTML = battle.logs
    .slice(-7)
    .map(
      (x) =>
        `<p class="${x.includes("โดน") || x.includes("ติดพิษ") ? "bad" : "good"}">${esc(x)}</p>`,
    )
    .join("");
  $("#battleLog").scrollTop = $("#battleLog").scrollHeight;
  const intent = enemyIntent(battle.level, battle.turn);
  if($('#enemyIntent')) $('#enemyIntent').innerHTML = `${skillIcon(intent.icon)} <strong>ท่าถัดไป: ${intent.name}</strong><span>ดาเมจพื้นฐาน ${intent.damage}</span>`;
  if($('#statusLine')) $('#statusLine').textContent = `แรงกดดัน ${battle.pressure||0}/3 · ${battle.poison ? 'พิษ '+battle.poison+' ครั้ง · ' : ''}${battle.web ? 'ติดใย · ' : ''}${battle.enemyGuard ? 'ศัตรูมีเกราะ · ' : ''}${battle.guard ? 'กำลังตั้งรับ' : ''}`;
}
const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function announceCombat(message) {
  const announcer = $(".combat-announcer");
  if (!announcer) return;
  announcer.textContent = message;
  announcer.classList.remove("show");
  void announcer.offsetWidth;
  announcer.classList.add("show");
}

function animateFighter(selector, className, duration) {
  const fighter = $(selector);
  if (!fighter) return Promise.resolve();
  fighter.classList.remove(className);
  void fighter.offsetWidth;
  fighter.classList.add(className);
  return wait(duration).then(() => fighter.classList.remove(className));
}

function spawnBattleFx(kind, target = "enemy") {
  const layer = $(".fx-layer");
  if (!layer) return;
  const fx = document.createElement("div");
  fx.className = `battle-fx fx-${kind} fx-target-${target}`;
  fx.innerHTML = `<i></i><i></i><i></i><i></i><i></i><i></i>`;
  layer.append(fx);
  setTimeout(() => fx.remove(), 1100);
}

async function animateHeroAction(action, impact) {
  const heroClass = save.classId;
  if (action.name === "attack") {
    announceCombat("⚔ โจมตี!");
    playSfx("attack");
    await playCombatMotion('hero', heroClass==='wizard'?'magic-bolt':'attack', () => {
      spawnBattleFx(heroClass==='wizard'?'arcane-bolt':'slash','enemy'); impact();
    });
    return;
  }
  announceCombat(`✦ ${CLASSES[heroClass].skillName}!`);
  await playCutscene(heroClass);
  playSfx("skill");
  spawnBattleFx(`cast-${heroClass}`, "hero");
  await playCombatMotion('hero', CLASSES[heroClass].skill, () => {
    spawnBattleFx(heroClass==='wizard'?'inferno':heroClass==='knight'?'aegis':'crosscut','enemy'); impact();
  });
}

async function animateEnemyAction(move, impact) {
  announceCombat(`☠ ${move.name}`);
  playSfx(move.icon === 'attack' ? 'enemy' : 'skill');
  await playCombatMotion('enemy',move.icon==='attack'?'attack':'monster-skill',()=>{
    spawnBattleFx(move.icon==='attack'?'claw':move.icon,'hero'); impact();
  });
}

function flash(target) {
  const el = $(target);
  el?.classList.remove("hit");
  void el?.offsetWidth;
  el?.classList.add("hit");
  $("#scene")?.classList.add("shake");
  setTimeout(() => $("#scene")?.classList.remove("shake"), 300);
  setTimeout(() => el?.classList.remove("hit"), 430);
}
function damageEnemy(amount, label) {
  if (battle.enemyGuard) {
    amount = Math.ceil(amount * 0.55);
    battle.enemyGuard = false;
    log(`${LEVELS[battle.level].enemy} ปัดป้องบางส่วน!`);
  }
  battle.enemyHp = Math.max(battle.phase < 2 ? 1 : 0, battle.enemyHp - amount);
  floatDamage(amount,'enemy');
  log(`${label} สร้างความเสียหาย ${amount}`);
  flash(".fighter.enemy");
  playSfx("impact");
}
function floatDamage(amount,target) {
  const number=document.createElement('span');
  number.className='damage-float '+target;
  number.textContent='−'+amount;
  $('#scene')?.append(number);
  setTimeout(()=>number.remove(),1200);
}
async function applyAction(a) {
  const c = CLASSES[save.classId];
  const amount = attackDamage(save.classId,battle.level,save.attackBonus,a.power,a.name==='skill',battle.web>0,battle.stance);
  if(battle.stance) {battle.mp-=2;battle.guard=true;}
  battle.web = 0;
  await animateHeroAction(a, () => {
    if (a.name === "attack") damageEnemy(amount, "โจมตี");
    else {
      battle.mp -= c.skill === "fireball" ? 6 : 5;
      if (c.skill === "double_strike") damageEnemy(amount, "ฟันสองจังหวะ");
      if (c.skill === "shield_bash") {
        damageEnemy(amount, "กระแทกโล่");
        battle.guard = true;
        log("ยกโล่ป้องกันการโจมตีถัดไป");
      }
      if (c.skill === "fireball") damageEnemy(amount, "ลูกไฟเวท");
    }
    updateCombat();
  });
  battle.stance=false;
}
async function enemyTurn() {
  if (battle.poison > 0) {
    const poison = battle.poisonDamage || 4;
    battle.hp = Math.max(0, battle.hp - poison);
    battle.poison--;
    log(`พิษสร้างความเสียหาย ${poison} HP`);
    updateCombat();
    if (battle.hp === 0) {persist();return;}
  }
  const move = enemyIntent(battle.level,battle.turn);
  const amount = incomingDamage(move.damage,save.classId,battle.guard);
  battle.guard=false;
  await animateEnemyAction(move, () => {
    battle.hp = Math.max(0,battle.hp-amount);
    floatDamage(amount,'hero');
    if(move.poison) {battle.poison=2; battle.poisonDamage=move.poison;}
    if(move.web) battle.web=1;
    if(move.shield) battle.enemyGuard=true;
    if(move.drain) battle.mp=Math.max(0,battle.mp-move.drain);
    if(move.heal) battle.enemyHp=Math.min(battle.maxEnemyHp,battle.enemyHp+move.heal);
    log(`${LEVELS[battle.level].enemy}: ${move.name} • คุณเสีย ${amount} HP${move.drain?' และ '+move.drain+' MP':''}`);
    flash(".fighter.hero");
    playSfx("hurt");
    updateCombat();
  });
  persist();
}
async function frameBattle() {
  $("#code")?.blur();
  $("#scene")?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  await wait(850);
}
async function executeTurn() {
  if (!battle || battle.busy || battle.finished) return;
  const current = battle,
    code = $("#code").value.trim(),
    btn = $("#runBtn"),
    out = $("#console");
  if (!code) {
    out.classList.add("error");
    out.textContent = "เขียนโค้ดของโจทย์นี้ก่อนกดรัน";
    $("#code").focus();
    return;
  }
  battle.code = code;
  battle.busy = true;
  btn.disabled = true;
  btn.textContent = "⏳ กำลังตรวจ Python…";
  out.classList.remove("error");
  out.textContent = "กำลังรันและตรวจคำตอบ… ครั้งแรกอาจใช้เวลาสักครู่";
  let result;
  try {
    result = await runPython(
      code,
      battle.level * 3 + battle.phase % 3 + 1,
      CLASSES[save.classId].skill,
    );
  } catch (error) {
    result = { ok: false, error: error.message, technical: true };
  }
  if (screen !== "battle" || battle !== current) return;
  if (!result.ok) {
    battle.busy = false;
    btn.disabled = false;
    btn.textContent = "▶ รันโค้ด (1 เทิร์น)";
    if (!result.technical) battle.mistakes++;
    out.classList.add("error");
    out.textContent = "✖ " + result.error;
    playSfx("error");
    if (result.technical) return;
    battle.pressure = Math.min(3,(battle.pressure||0)+1);
    if(battle.pressure>=3) {
      battle.busy=true; btn.disabled=true;
      await frameBattle();
      announceCombat('ผิดซ้ำ • ศัตรูฉวยโอกาส!');
      await enemyTurn();
      battle.turn++;
      battle.busy=false;
      if(battle.hp<=0) {battle.finished=true; persist(); defeat();return;}
      renderBattle(false);
      $('#console').classList.add('error'); $('#console').textContent='✖ '+result.error+' • แรงกดดันเต็มแล้ว ทุกคำตอบผิดศัตรูจะสวนกลับ ใช้คำใบ้ช่วยได้';
      $('.code-panel').scrollIntoView({behavior:'smooth',block:'start'});
    }
    updateCombat(); persist();
    return;
  }
  const action = result.actions[0],
    c = CLASSES[save.classId],
    cost = c.skill === "fireball" ? 6 : 5;
  const requiredMp = (action.name==='skill'?cost:0)+(battle.stance?2:0);
  if (battle.mp < requiredMp) {
    battle.busy = false;
    btn.disabled = false;
    btn.textContent = "▶ รันโค้ด (1 เทิร์น)";
    out.classList.add("error");
    out.textContent = `MP เหลือ ${battle.mp} แต่คำสั่งนี้ใช้ ${requiredMp} MP ปิดตั้งรับ ใช้ attack() หรือดื่มยามานา`;
    return;
  }
  btn.textContent =
    action.name === "skill" ? "✦ กำลังร่ายสกิล…" : "⚔ กำลังโจมตี…";
  // Dismiss the mobile keyboard and frame the stage BEFORE starting the action.
  $("#code").blur();
  const scene = $("#scene");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  scene.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
  // Wait for scrolling to settle, including slow browser smooth-scroll curves.
  const scrollStarted = performance.now();
  let lastScroll = window.scrollY, stable = 0;
  while (performance.now() - scrollStarted < 1400) {
    await wait(50);
    if (screen !== "battle" || battle !== current) return;
    stable = Math.abs(window.scrollY - lastScroll) < 1 ? stable + 1 : 0;
    lastScroll = window.scrollY;
    if (stable >= 3 && performance.now() - scrollStarted > 350) break;
  }
  if (screen !== "battle" || battle !== current) return;
  announceCombat("คำตอบถูกต้อง • เตรียมโจมตี!");
  await wait(400);
  await applyAction(action);
  battle.pressure=0;
  log(
    `ผ่านโจทย์ ${battle.phase + 1}: ${currentTask().prompt}`,
  );
  updateCombat();
  await wait(450);
  if (battle.phase >= 2 && battle.enemyHp <= 0) {
    battle.finished = true;
    out.textContent =
      "✓ พิชิตศัตรูแล้ว! " + TAKEAWAYS[battle.level][battle.phase % 3];
    updateCombat();
    battle.busy = false;
    victory();
    return;
  }
  btn.textContent = "☠ ศัตรูกำลังโจมตี…";
  await enemyTurn();
  updateCombat();
  await wait(850);
  if (battle.hp <= 0) {
    battle.finished = true;
    battle.busy = false;
    defeat();
    return;
  }
  battle.phase++;
  if(battle.phase>=3) battle.rune='ตรา:'+Math.floor(1000+Math.random()*9000);
  battle.turn++;
  battle.code = "";
  battle.busy = false;
  renderBattle(false);
  persist();
  $("#console").textContent =
    `✓ ผ่านแล้ว: ${TAKEAWAYS[battle.level][(battle.phase - 1)%3]}\n${battle.phase>=3?'ศัตรูยังไม่ตาย ทำโจทย์ต่อพร้อมแสดงตราผนึกใหม่':'เขียนคำตอบใหม่สำหรับโจทย์ '+(battle.phase + 1)}`;
  $(".code-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#code").focus({ preventScroll: true });
}
function victory() {
  if (battle.rewarded) return;
  battle.rewarded = true;
  const i = battle.level,
    first = i >= save.cleared,
    stars =
      battle.mistakes === 0 && battle.hp / battle.maxHp > 0.65
        ? 3
        : battle.mistakes <= 2
          ? 2
          : 1,
    gold = first ? 35 + i * 12 : 10;
  save.stars[i] = Math.max(save.stars[i] || 0, stars);
  save.cleared = Math.max(save.cleared, i + 1);
  save.gold += gold;
  persist();
  playSfx("victory");
  showModal(
    `<span class="eyebrow">FLOOR ${String(i + 1).padStart(2, "0")} CLEAR</span><h2 class="pixel-title">${i === 5 ? "พิชิตดันเจี้ยน!" : "ผ่านชั้น " + (i + 1) + " แล้ว!"}</h2><div class="result-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div><p>คุณเอาชนะ <b>${LEVELS[i].enemy}</b> ด้วยการเขียน Python ได้รับ <b style="color:var(--gold)">✦ ${gold}</b> เหรียญ<br>ผ่าน ${battle.phase+1} โจทย์ • แก้โค้ด ${battle.mistakes} ครั้ง • HP คงเหลือ ${battle.hp}/${battle.maxHp}</p><div class="modal-actions"><button class="btn" id="resultMap">ดูแผนที่ →</button>${i < 5 ? '<button class="btn gold" id="resultNext">เข้าชั้นถัดไป</button>' : ""}<button class="btn ghost" id="resultShop">ร้านค้า</button></div>`,
  );
  $("#resultMap").onclick = () => {
    closeModal();
    renderMap();
  };
  $("#resultShop").onclick = () => {
    closeModal();
    renderMap();
    showShop();
  };
  if (i < 5) $("#resultNext").onclick = () => startBattle(i + 1);
}
function defeat() {
  battle.finished=true;
  battle.rescued=true;
  save.gold=Math.max(0,save.gold-15);
  // Rescue is explicit and only follows defeat; it never fires on floor entry.
  save.activeBattle=null;
  save.expedition={hp:Math.ceil(battle.maxHp*.7),mp:Math.ceil(battle.maxMp*.5),maxHp:battle.maxHp,maxMp:battle.maxMp};
  const previousBattle=battle;
  screen='map'; persist(); screen='battle'; battle=previousBattle;
  beep(120, 0.3);
  showModal(
    `<span class="eyebrow">GAME OVER</span><h2 class="pixel-title">พลังชีวิตหมด!</h2><p>${LEVELS[battle.level].enemy} แข็งแกร่งกว่าที่คิด หน่วยกู้ภัยหักได้สูงสุด 15 เหรียญ และพากลับมาด้วย HP 70% / MP 50% ลองใช้คำใบ้ ตั้งรับ หรือซื้อเสบียงก่อนสู้ใหม่</p><div class="modal-actions"><button class="btn" id="retryBtn">ลองชั้นนี้อีกครั้ง</button><button class="btn ghost" id="defeatMap">กลับแผนที่</button></div>`,
  );
  $("#retryBtn").onclick = () => startBattle(battle.level);
  $("#defeatMap").onclick = () => {
    closeModal();
    renderMap();
  };
}
$("#homeBtn").onclick = () => {
  if (screen === "battle" && battle?.busy) return toast("รอจบเทิร์นนี้ก่อนครับ");
  save.classId ? renderMap() : renderIntro();
};
$("#soundBtn").onclick = async () => {
  muted = !muted;
  await setMuted(muted);
  $("#soundBtn").textContent = muted ? "♫" : "🔊";
  $("#soundBtn").setAttribute("aria-pressed", String(!muted));
  $("#soundBtn").setAttribute(
    "aria-label",
    muted ? "เปิดดนตรีและเสียงเอฟเฟกต์" : "ปิดดนตรีและเสียงเอฟเฟกต์",
  );
  $("#soundBtn").title = muted
    ? "เปิดดนตรีและเสียงเอฟเฟกต์"
    : `ปิดเสียง • ${currentTrackName()}`;
  toast(muted ? "ปิดเสียงแล้ว" : `เปิดเพลง: ${currentTrackName()}`);
  if (!muted) playSfx("ui");
};
if (save.classId) {
  selected = save.classId;
  renderMap();
} else renderIntro();
