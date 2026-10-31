// Recorded source takes. Cosmetic variation never consumes the battle RNG.
export const AUDIO_ROOT='./assets/audio-v14/';
export const VOICE_BANK={
 double_strike:{pool:['vo-rogue-strike'],caption:'ฟันสองจังหวะ'},smoke_blade:{pool:['vo-rogue-ambush'],caption:'คมมีดม่านควัน'},
 shield_bash:{pool:['vo-knight-bash'],caption:'กระแทกโล่'},iron_oath:{pool:['vo-oath'],caption:'คำสัตย์เหล็กกล้า'},
 fireball:{pool:['vo-fire-1','vo-fire-2'],caption:'ลูกไฟเวท'},frost_lance:{pool:['vo-frost-1','vo-frost-2'],caption:'หอกเหมันต์'},
 attack_adventurer:{pool:['vo-rogue-light-1','vo-rogue-light-2'],gain:.56},attack_knight:{pool:['vo-knight-heavy-1','vo-knight-heavy-2'],gain:.60},attack_wizard:{pool:['vo-mage-light-1','vo-mage-light-2'],gain:.52},
 guard_adventurer:{pool:['vo-rogue-guard'],gain:.65},guard_knight:{pool:['vo-knight-guard'],gain:.65},guard_wizard:{pool:['vo-mage-guard'],caption:'กางเกราะเวท',gain:.75},
 focus_adventurer:{pool:['vo-rogue-focus'],gain:.50},focus_knight:{pool:['vo-knight-focus'],gain:.52},focus_wizard:{pool:['vo-mage-focus'],caption:'รวมพลังเวท',gain:.70},
 zombie_bite:{pool:['vo-zombie-1'],caption:'กัดแพร่เชื้อ',gain:.70},skeleton_shield:{pool:['vo-bone-1'],caption:'โล่กระดูก',gain:.63},skeleton_cleave:{pool:['vo-bone-2'],caption:'ดาบสะบั้น',gain:.65},spider_web:{pool:['vo-bug-1'],caption:'ใยพิษพันธนาการ',gain:.63},wraith_drain:{pool:['vo-shade-1'],caption:'ดูดมานาและวิญญาณ',gain:.67},
 golem_guard:{pool:['vo-orc-1'],caption:'เกราะหินสะสมพลัง',rate:.90,gain:.66},golem_quake:{pool:['vo-orc-2','vo-orc-3'],caption:'แผ่นดินแยก',rate:.90,gain:.74},necro_drain:{pool:['vo-necro-cast'],caption:'ดูดวิญญาณ',rate:.93,gain:.70},necro_curse:{pool:['vo-necro-summon'],caption:'คำสาปมรณะ',rate:.93,gain:.72},
 attack_zombie:{pool:['vo-zombie-2'],gain:.46},attack_skeleton:{pool:['vo-bone-2'],gain:.43},attack_spider:{pool:['vo-bug-2'],gain:.44},attack_wraith:{pool:['vo-shade-2'],gain:.44},attack_golem:{pool:['vo-orc-3'],rate:.90,gain:.51},attack_necromancer:{pool:['vo-necro-cast'],rate:.93,gain:.43},
};
export const ACTOR_VOICES={
 adventurer:['double_strike','smoke_blade','attack_adventurer','guard_adventurer','focus_adventurer'],knight:['shield_bash','iron_oath','attack_knight','guard_knight','focus_knight'],wizard:['fireball','frost_lance','attack_wizard','guard_wizard','focus_wizard'],
 zombie:['zombie_bite','attack_zombie'],skeleton:['skeleton_shield','skeleton_cleave','attack_skeleton'],spider:['spider_web','attack_spider'],wraith:['wraith_drain','attack_wraith'],golem:['golem_guard','golem_quake','attack_golem'],necromancer:['necro_drain','necro_curse','attack_necromancer'],
};
export const NEW_MONSTER_AUDIO={slime:['acid-lunge','acid-fountain','เมือกกัดกร่อน'],mimic:['chest-bite','coin-storm','เหรียญลวงตา'],scarab:['mandible-ram','sandstorm','พายุทรายทอง'],bat:['wing-dive','sonic-cry','คลื่นเสียงกรีดวิญญาณ'],icewolf:['ice-pounce','frost-breath','ลมหายใจเยือกแข็ง'],sentinel:['gear-slash','core-laser','ลำแสงแกนกลาง']};
for(const [kind,[,,caption]] of Object.entries(NEW_MONSTER_AUDIO)){
 VOICE_BANK['attack_'+kind]={pool:[`v15-vo-${kind}-0`],gain:.49};
 VOICE_BANK[kind+'_skill']={pool:[`v15-vo-${kind}-1`],caption,gain:.67};
 ACTOR_VOICES[kind]=['attack_'+kind,kind+'_skill'];
}
export const FX_POOLS={light:['blade-1','blade-3','blade-5'],heavy:['blade-7','blade-9'],steel:['steel-1','steel-3','steel-7'],body:['thud-1','thud-2'],stone:['stone-1','stone-2'],bone:['bone-1','bone-2'],venom:['venom-1','venom-2'],web:['web-1','web-2']};
export const FX_FILES=[...new Set([...Object.values(FX_POOLS).flat(),...Object.keys(NEW_MONSTER_AUDIO).flatMap(k=>[`v15-fx-${k}-0`,`v15-fx-${k}-1`]),'charge','arcane','fire-charge','fire-flight','fire-impact','frost-impact','wind','ward','restore','dark','draw'])];
const layer=(pool,gain,rate=1,spread=.025)=>({pool:Array.isArray(pool)?pool:[pool],gain,rate,spread});
function materialHit(target,guarded){
 if(guarded||target==='knight')return [layer(FX_POOLS.steel,.38),layer(FX_POOLS.body,.12)];
 if(target==='golem')return [layer(FX_POOLS.stone,.45),layer(FX_POOLS.body,.16)];
 if(target==='skeleton')return [layer(FX_POOLS.bone,.35),layer(FX_POOLS.body,.20)];
 if(target==='wraith')return [layer('wind',.24,.85),layer('dark',.20,1.1)];
 return [layer(FX_POOLS.body,.35),layer(FX_POOLS.light,.14,1.13)];
}
export function soundPlan(kind,variant,stage,{targetKind='',guarded=false}={}){
 const unique=NEW_MONSTER_AUDIO[kind];
 if(unique&&unique.includes(variant)){
  const special=variant===unique[1],file=`v15-fx-${kind}-${special?1:0}`;
  if(stage==='windup')return [layer(file,.15,1,0)];
  if(stage==='release')return [layer(file,.32,1,0)];
  if(stage==='hit')return [layer(file,.34,1,0),layer(FX_POOLS.body,.10,1,0)];
  if(stage==='miss')return [layer(`v15-fx-${kind}-0`,.22,1,0)];
 }
 const heavy=kind==='knight'||kind==='golem',blade=['attack','double_strike','smoke_blade','shield_bash','shield'].includes(variant)&&['adventurer','knight','skeleton'].includes(kind);
 if(stage==='cutin')return [layer(kind==='wizard'?'charge':'wind',.20,kind==='knight'?.83:1)];
 if(stage==='miss')return [layer(blade?FX_POOLS.light:'wind',.24,heavy?.90:1.05)];
 if(stage==='windup'){
  if(variant==='focus')return [layer(kind==='wizard'?'charge':kind==='knight'?'ward':'wind',.20,kind==='knight'?.90:1)];
  if(variant==='guard')return [layer(kind==='wizard'?'ward':'draw',.23,heavy?.87:1.08)];
  if(variant==='fireball')return [layer('fire-charge',.21)];
  if(variant==='frost_lance')return [layer('charge',.21,1.20)];
  if(variant==='iron_oath')return [layer('ward',.23,.87)];
  if(variant==='smoke_blade')return [layer('wind',.17,.91),layer('draw',.11,1.12)];
  if(blade)return [layer('draw',.16,heavy?.88:1.1)];
  if(variant==='curse'||kind==='wraith'||kind==='necromancer')return [layer('dark',.17,.93)];
  if(kind==='golem')return [layer(FX_POOLS.stone,.17,.85)];
  if(kind==='spider')return [layer(FX_POOLS.web,.15)];
  if(kind==='zombie')return [layer(FX_POOLS.venom,.13,.90)];
  return [layer('charge',.16,1.08)];
 }
 if(stage==='release'){
  if(variant==='fireball')return [layer('fire-flight',.32)];
  if(variant==='frost_lance')return [layer('wind',.27,1.28)];
  if(variant==='iron_oath')return [layer('ward',.32,.94)];
  if(variant==='smoke_blade')return [layer(FX_POOLS.light,.34,1.13),layer('dark',.12,1.2)];
  if(blade)return [layer(heavy?FX_POOLS.heavy:FX_POOLS.light,.40,heavy?.94:1.07)];
  if(variant==='web')return [layer(FX_POOLS.web,.30)];
  if(variant==='poison')return [layer(FX_POOLS.venom,.30,.95)];
  if(variant==='curse')return [layer('dark',.32,.90)];
  if(kind==='golem')return [layer('wind',.28,.74)];
  if(kind==='wizard')return [layer('arcane',.29,1.08)];
  return [layer('wind',.28,1.05)];
 }
 if(stage==='hit'){
  if(variant==='focus')return [layer('restore',.25,kind==='wizard'?1.12:.97)];
  if(variant==='guard')return [layer(kind==='wizard'?'ward':FX_POOLS.steel,.27,heavy?.90:1.05)];
  if(variant==='fireball')return [layer('fire-impact',.58,1,0)];
  if(variant==='frost_lance')return [layer('frost-impact',.52,1,0)];
  if(variant==='iron_oath')return [layer('ward',.37,.88),layer(FX_POOLS.steel,.18,.90)];
  if(variant==='shield_bash'||variant==='shield')return [layer(FX_POOLS.steel,.39,.90),layer(FX_POOLS.body,.20,.90)];
  if(variant==='stone'||kind==='golem')return [layer(FX_POOLS.stone,.46,.88),layer(FX_POOLS.body,.16,.86)];
  if(variant==='curse')return [layer('dark',.39,.86),layer('arcane',.18,.75)];
  if(variant==='web')return [layer(FX_POOLS.web,.35),layer(FX_POOLS.venom,.17,1.1)];
  if(variant==='poison')return [layer(FX_POOLS.venom,.32,.94),layer(FX_POOLS.body,.17)];
  if(variant==='magic-bolt')return [layer('arcane',.39,1.25)];
  return materialHit(targetKind,guarded);
 }
 return [];
}
// Another source take, not the last take again. Injectable RNG for QA only.
export function pickTake(pool,previous,random=Math.random){const options=pool.length>1?pool.filter(id=>id!==previous):pool;return options[Math.min(options.length-1,Math.floor(random()*options.length))];}
