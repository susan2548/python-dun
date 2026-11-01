import {POTION_HP,POTION_MP} from './tactical-engine.js?v=4';
import {skillIcon} from './combat-cinema.js?v=9';
// UI disclosure only: consumption and turn resolution remain in game.js usePotion.
export function combatInventory({save,battle,open=false}){
 const total=save.potions+save.manaPotions,locked=battle.busy||battle.finished;
 const button=`<button type="button" class="inventory-toggle ${open?'open':''}" id="inventoryBtn" aria-expanded="${open}" aria-controls="combatInventory" ${locked?'disabled':''}><img src="./assets/icons/field-satchel.svg" width="28" height="28" alt="" aria-hidden="true"><span>ไอเทม</span><b aria-label="${total} ชิ้น">${total}</b><span class="inventory-chevron" aria-hidden="true">⌄</span></button>`;
 const card=(type,label,count,value,current,max)=>{
  const missing=Math.max(0,max-current),unit=type==='mana'?'MP':'HP';
  const reason=count<1?'ไอเทมหมด':current>=max?`${unit} เต็มแล้ว`:locked?'รอเทิร์นของคุณ':`ใช้${label} →`;
  return `<button type="button" class="inventory-item" data-use-item="${type}" ${locked||!count||current>=max?'disabled':''}><span class="inventory-item-icon">${skillIcon(type==='mana'?'mana':'health')}</span><strong>${label}</strong><span class="inventory-quantity">×${count}</span><span class="inventory-item-effect">ฟื้นสูงสุด <b>${value} ${unit}</b></span><span class="inventory-current">${unit} ${current}/${max}${missing?` · ขาด ${missing}`:''}</span><span class="inventory-use">${reason}</span></button>`;
 };
 const panel=`<section class="combat-inventory" id="combatInventory" aria-labelledby="inventoryTitle" ${open?'':'hidden'}><div class="inventory-heading"><h3 id="inventoryTitle">กระเป๋าเสบียง</h3><span>${total} ชิ้น</span></div><p class="inventory-turn-note">กดใช้ยาเพื่อดื่มทันที • ใช้ 1 เทิร์น พร้อมตั้งรับลดดาเมจสวน 60% ครั้งนั้น</p><div class="inventory-cards">${card('health','ยาฮีล',save.potions,POTION_HP,battle.hp,battle.maxHp)}${card('mana','ยามานา',save.manaPotions,POTION_MP,battle.mp,battle.maxMp)}</div>${total===0?'<p class="inventory-empty">กระเป๋าว่างแล้ว • ซื้อยาเพิ่มได้ที่ร้านบรามบนแผนที่</p>':''}<p class="inventory-code-note">เปิดกระเป๋าไม่เสียเทิร์น และเก็บโค้ดที่กำลังเขียนไว้</p></section>`;
 return {button,panel};
}
