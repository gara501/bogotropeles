export const RING_BONUS={afterLevel:5,seconds:120,points:10000,countdownMs:3000,gapMs:900};
export const RING_ORDER=['cristiano_violencia','piernas_locas','brincolas_rataquieta','minilaja'];
export const shouldStartRingBonus=(nextLevel,run)=>nextLevel===RING_BONUS.afterLevel+1 && !run.ringBonusPlayed;

/** One shared clock and one reward; a kill at the deadline never counts. */
export class RingRound {
  constructor(){this.state='countdown';this.countdownMs=RING_BONUS.countdownMs;this.remainingMs=RING_BONUS.seconds*1000;this.defeated=0;this.points=0;}
  step(ms){
    if(this.state==='countdown'){this.countdownMs=Math.max(0,this.countdownMs-ms);if(this.countdownMs<1e-6){this.countdownMs=0;this.state='playing';}return;}
    if(this.state!=='playing')return;
    this.remainingMs=Math.max(0,this.remainingMs-ms);if(this.remainingMs<1e-6){this.remainingMs=0;this.finish(false,'timeout');}
  }
  defeat(key){
    if(this.state!=='playing' || this.remainingMs<=0 || key!==RING_ORDER[this.defeated])return false;
    this.defeated++;if(this.defeated===RING_ORDER.length)this.finish(true);return true;
  }
  finish(won,reason='knockout'){if(this.state!=='playing')return false;this.state=won?'won':reason;this.points=won?RING_BONUS.points:0;return true;}
  get resolved(){return !['countdown','playing'].includes(this.state);}
}
