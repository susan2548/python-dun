// Pure timing contract shared by the sprite renderer and combat clock.
export const HERO_KINDS=['adventurer','knight','wizard'];
export const MONSTER_KINDS=['zombie','skeleton','spider','wraith','golem','necromancer'];
const periods={adventurer:2400,knight:3200,wizard:3000,zombie:2900,skeleton:2800,spider:1900,wraith:3400,golem:4200,necromancer:3100};
export function idleFrame(kind,time) {
  const p=(Math.max(0,time)%periods[kind])/periods[kind];
  return p<.26?0:p<.42?1:p<.58?2:p<.74?3:p<.88?2:1;
}
export function poseFrame(kind,motion,p,time=0,variant='') {
  const hero=HERO_KINDS.includes(kind);
  if(motion==='idle')return idleFrame(kind,time);
  if(motion==='drink')return p<.28?16:p<.78?17:16;
  if(motion==='guard')return hero?(p<.22?12:p<.84?13:12):8;
  if(motion==='focus')return p<.25?14:p<.86?15:14;
  if(variant==='shield_bash'&&hero)return p<.20?12:p<.74?13:12;
  if(motion==='cast')return p<.19?8:p<.44?9:p<.75?10:p<.95?11:0;
  if(motion==='technique')return p<.20?8:p<.32?9:p<.60?10:p<.92?11:0;
  if(variant==='double_strike'&&p>.40&&p<.63)return p<.50?4:p<.56?5:6;
  return p<.22?4:p<.36?5:p<.60?6:p<.92?7:0;
}
export function motionProfile(kind,variant) {
  const heavy=kind==='knight'||kind==='golem';
  const ranged=['magic-bolt','fireball','frost_lance','iron_oath','web','curse'].includes(variant);
  return {ranged,duration:ranged?1480:variant==='double_strike'?1420:heavy?1260:kind==='spider'?980:1100,contact:ranged?.70:variant==='double_strike'?.62:.43,release:ranged?.44:.32,hitStop:heavy?85:ranged?45:65};
}
export function phaseAt(elapsed,duration,contact,hold=0) {
  const t=duration*contact;
  if(elapsed>=t&&elapsed<t+hold)return contact;
  return Math.max(0,Math.min(1,(elapsed<=t?elapsed:elapsed<t+hold?t:elapsed-hold)/duration));
}
export function motionOffset(p,distance,heavy=false) {
  const ease=x=>1-Math.pow(1-x,3);
  if(p<.22)return -Math.sign(distance)*(heavy?8:13)*Math.sin(p/.22*Math.PI/2);
  if(p<.40)return -Math.sign(distance)*10+(distance+Math.sign(distance)*10)*ease((p-.22)/.18);
  if(p<.56)return distance;
  if(p<.70)return distance-Math.sign(distance)*9*(p-.56)/.14;
  return (distance-Math.sign(distance)*9)*(1-ease((p-.70)/.30));
}
