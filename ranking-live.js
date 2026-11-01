// Single-flight polling; late responses cannot paint a departed view.
export class RankingLiveFeed {
  constructor({load,onData,onError,active=()=>true,interval=5000,schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}){
    Object.assign(this,{load,onData,onError,active,interval,schedule,cancel});this.stopped=false;this.busy=false;this.timer=null;
  }
  async refresh(){
    if(this.stopped||this.busy||!this.active())return;
    this.cancel(this.timer);this.busy=true;
    try{const data=await this.load();if(!this.stopped&&this.active())this.onData(data);}
    catch(error){if(!this.stopped&&this.active())this.onError(error);}
    finally{this.busy=false;if(!this.stopped&&this.active())this.timer=this.schedule(()=>this.refresh(),this.interval);}
  }
  pause(){this.cancel(this.timer);this.timer=null;}
  stop(){this.stopped=true;this.pause();}
}
