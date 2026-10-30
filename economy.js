import {POTION_HP,POTION_MP} from './tactical-engine.js?v=2';
export const GOODS=[
  {id:'potion',name:'ยาฟื้นพลัง',icon:'health',price:25,description:`ฟื้น ${POTION_HP} HP • เป็นของฉุกเฉิน ใช้แล้วศัตรูสวนกลับ`,speech:`ขวดแดงนี้ช่วยประคองตัวได้ ${POTION_HP} HP แต่ตอนดื่มเจ้าจะเปิดช่องให้ศัตรู! ถ้าเพิ่งจบชั้น แวะโรงแรมจะคุ้มกว่า`,stock:3},
  {id:'mana',name:'ยามานา',icon:'mana',price:18,description:`ฟื้น ${POTION_MP} MP • ใช้หนึ่งเทิร์น ไม่ล้างคูลดาวน์`,speech:`ขวดฟ้าฟื้นแค่ ${POTION_MP} MP จงเลือกคาถาให้ดี ถ้ายังไม่อันตราย ลอง Focus เพื่อเก็บมานาทีละหนึ่ง`,stock:3},
  {id:'attack',name:'ลับคมอาวุธ',icon:'attack',price:60,description:'พลังโจมตีถาวร +2 • สูงสุด 3 ขั้น ราคาสูงขึ้นตามขั้น',speech:'คมดาบดี ๆ ไม่ทดแทนแผนการที่ดีนะ! ข้าลับให้แรงขึ้น 2 หน่วย แต่แต่ละขั้นใช้วัสดุมากขึ้น',stock:3},
  {id:'hp',name:'เกราะหัวใจ',icon:'armor',price:55,description:'HP สูงสุด +15 • ไม่เติมเลือดปัจจุบัน • สูงสุด 3 ขั้น',speech:'เกราะนี้เพิ่มเพดานเลือด 15 หน่วย ไม่ใช่ยาฟื้นเลือดนะ ถ้าบาดเจ็บอยู่ต้องพักกับคุณมิลาที่โรงแรม',stock:3},
];
export function stockState(save) {
  if(!save.shopStock||save.shopStock.floor!==save.cleared)save.shopStock={floor:save.cleared,potion:3,mana:3};
  return save.shopStock;
}
export function quote(save,item) {
  const stock=stockState(save),tier=item.id==='attack'?Math.floor(save.attackBonus/2):item.id==='hp'?Math.floor(save.hpBonus/15):0;
  return {price:item.price+(['attack','hp'].includes(item.id)?tier*30:0),left:['potion','mana'].includes(item.id)?stock[item.id]:Math.max(0,3-tier)};
}
export function purchase(save,id) {
  const item=GOODS.find(x=>x.id===id);if(!item)return {ok:false,message:'ไม่พบสินค้า'};
  if(save.activeBattle&&['attack','hp'].includes(id))return {ok:false,message:'ข้าต้องใช้เวลาตีอาวุธและเกราะ จบการต่อสู้ที่ค้างอยู่ก่อนค่อยมาปรับปรุงนะ'};
  const {price,left}=quote(save,item);
  if(left<=0)return {ok:false,message:'ของชิ้นนี้หมดแล้ว ผ่านชั้นใหม่เพื่อเติมสต็อกยา'};
  if(save.gold<price)return {ok:false,message:`เหรียญยังไม่พอ ขาดอีก ${price-save.gold} เหรียญ เก็บไว้ก่อนก็ได้นะ`};
  save.gold-=price;
  if(id==='potion'){save.potions++;save.shopStock.potion--;}
  if(id==='mana'){save.manaPotions++;save.shopStock.mana--;}
  if(id==='attack')save.attackBonus+=2;
  if(id==='hp')save.hpBonus+=15;
  return {ok:true,message:`รับ ${item.name} ไปเลย! ข้าหัก ${price} เหรียญแล้ว ขอให้กลับมาอย่างปลอดภัย`};
}
