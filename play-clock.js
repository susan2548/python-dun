// The clock measures visible game time, never wall time between visits.
export function normalizeTiming(save, previous) {
  if(previous && previous.timingVersion===undefined && (previous.classId || previous.stars?.some(Boolean))) {
    save.timingVersion=0;save.playTimeMs=0;
  }
  save.playTimeMs=Number.isSafeInteger(save.playTimeMs)&&save.playTimeMs>=0?save.playTimeMs:0;
  save.timingVersion=save.timingVersion===1?1:0;
  return save;
}
export class ActivePlayClock {
  constructor(now=()=>performance.now()){this.now=now;this.last=null;this.key=null;}
  sample(save,active,key=save.runId){
    const now=this.now();
    if(this.key===key&&this.last!==null)save.playTimeMs+=Math.max(0,Math.floor(now-this.last));
    this.key=key;this.last=active?now:null;
    return save.playTimeMs;
  }
  reset(){this.last=null;this.key=null;}
}
export function formatDuration(ms){
  if(ms===null||ms===undefined)return 'ไม่มีข้อมูลเดิม';
  const s=Math.floor(Number(ms)/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);
  return [h,m,s%60].map(n=>String(n).padStart(2,'0')).join(':');
}
