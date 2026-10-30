// One registry for the roster, live damage formula and saved resource limits.
export const BALANCE_VERSION = 2;
export const CLASSES = {
  adventurer: {
    name:'นักผจญภัย', icon:'◈', hp:105, mp:10, atk:15, attackGrowth:7,
    skill:'double_strike', skillName:'ฟันสองจังหวะ',
    skillDesc:'เลือดไหล 45% • ใช้ 3 MP / CD 2',
    flavor:'โจมตีกายภาพแรงที่สุด ใช้มานาน้อยกว่าเวท แต่รับดาเมจได้ปานกลาง',
  },
  knight: {
    name:'อัศวิน', icon:'♜', hp:145, mp:8, atk:9, attackGrowth:5,
    skill:'shield_bash', skillName:'กระแทกโล่',
    skillDesc:'โจมตีพร้อมตั้งรับ • 3 MP / CD 2',
    flavor:'HP สูง ลดดาเมจที่รับ 15% แต่โจมตีเบากว่านักผจญภัยและมีมานาน้อย',
  },
  wizard: {
    name:'พ่อมด', icon:'✧', hp:82, mp:24, atk:6, attackGrowth:5,
    skill:'fireball', skillName:'ลูกไฟเวท',
    skillDesc:'เผาไหม้ 55% • 3 MP / ไม่มีคูลดาวน์',
    flavor:'MP สูงสุด 24 ร่ายเวทต่อเนื่องได้ดี แต่โจมตีปกติเบาและ HP ต่ำ',
  },
};

const OLD_MANA = {adventurer:10, knight:10, wizard:12};
export function migrateClassBalance(save) {
  const hero=CLASSES[save.classId];
  if(!hero) { save.balanceVersion=BALANCE_VERSION; return save; }
  const maxHp=hero.hp+(save.hpBonus||0);
  const rescale=vitals=>{
    if(!vitals)return;
    const previousMax=Number(vitals.maxMp)||OLD_MANA[save.classId];
    // Preserve the remaining fraction once, rather than refill on every load.
    if(previousMax!==hero.mp) vitals.mp=Math.floor(Math.max(0,Math.min(1,vitals.mp/previousMax))*hero.mp);
    vitals.maxMp=hero.mp; vitals.maxHp=maxHp;
    vitals.hp=Math.max(0,Math.min(maxHp,vitals.hp));
  };
  rescale(save.expedition);
  if(save.activeBattle) {
    rescale(save.activeBattle);
    const {hp,mp,maxHp,maxMp}=save.activeBattle;
    save.expedition={hp,mp,maxHp,maxMp};
  }
  save.balanceVersion=BALANCE_VERSION;
  return save;
}
