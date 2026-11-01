// Serializable, account-bound queue. A failed request retries the SAME mutation
// before later edits, so a lost acknowledgement cannot overwrite a newer save.
export class CloudSaveQueue {
 constructor({accountId,revision=0,clears=[],send,onState=()=>{},onMeta=()=>{}}){Object.assign(this,{accountId,revision,send,onState,onMeta});this.clears=clears;this.epoch=0;this.latest=null;this.job=null;this.running=null;this.blocked=false;}
 stage(save){this.latest=structuredClone(save);this.epoch++;this.onState('pending');this.meta(true);}
 addClear(event){if(!this.clears.some(x=>x.id===event.id))this.clears.push(structuredClone(event));this.meta(true);}
 meta(dirty){this.onMeta({revision:this.revision,dirty,clears:this.clears,job:this.job});}
 async flush(){
  if(this.running)return this.running;
  if(this.blocked||!this.latest&&!this.job)return !this.blocked;
  this.running=this.drain().finally(()=>{this.running=null;});return this.running;
 }
 async drain(){
  while(this.job||this.latest){
   this.job??={accountId:this.accountId,revision:this.revision,mutationId:crypto.randomUUID(),save:this.latest,clears:structuredClone(this.clears),epoch:this.epoch};
   const job=this.job;this.meta(true);this.onState('syncing');
   try{
    const result=await this.send(job);
    this.revision=result.revision;
    const sent=new Set(job.clears.map(c=>c.id));this.clears=this.clears.filter(c=>!sent.has(c.id));
    this.job=null;if(this.epoch===job.epoch)this.latest=null;
    this.meta(!!this.latest);this.onState(this.latest?'pending':'saved');
   }catch(error){this.blocked=[400,401,403,409,413].includes(error.status);this.onState(error.status===409?'conflict':error.status===401||error.status===403?'expired':[400,413].includes(error.status)?'invalid':'offline');this.meta(true);return false;}
  }
  return true;
 }
}
