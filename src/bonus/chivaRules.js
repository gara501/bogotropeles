// Level indexes start at zero: after the new level 3 (Plaza de Bolívar), before La Candelaria.
export const CHIVA_BONUS={afterLevel:2,seconds:30,hitsRequired:50,perfectPoints:5000,pointsPerHit:100,countdownMs:3000};
export const shouldStartChivaBonus=(nextLevel,run)=>nextLevel===CHIVA_BONUS.afterLevel+1 && !run.chivaBonusPlayed;

/** One attempt, one mutually exclusive reward. Time and hits stop at the first outcome. */
export class ChivaBonusRound {
  constructor(){this.state='countdown';this.countdownMs=CHIVA_BONUS.countdownMs;this.remainingMs=CHIVA_BONUS.seconds*1000;this.hits=0;this.points=0;}
  step(ms){
    if(this.state==='countdown'){
      this.countdownMs=Math.max(0,this.countdownMs-ms);
      if(this.countdownMs<=1e-6){this.countdownMs=0;this.state='playing';}
      return;
    }
    if(this.state!=='playing')return;
    this.remainingMs=Math.max(0,this.remainingMs-ms);
    if(this.remainingMs<=1e-6){this.remainingMs=0;this.finish(false);}
  }
  hit(){
    if(this.state!=='playing' || this.remainingMs<=0)return false;
    this.hits++;if(this.hits>=CHIVA_BONUS.hitsRequired)this.finish(true);return true;
  }
  finish(won){
    if(this.state!=='playing')return false;
    this.state=won?'won':'timeout';
    this.points=won?CHIVA_BONUS.perfectPoints:this.hits*CHIVA_BONUS.pointsPerHit;return true;
  }
  get resolved(){return this.state==='won' || this.state==='timeout';}
  get damageFrame(){return Math.min(9,Math.floor(this.hits/CHIVA_BONUS.hitsRequired*9));}
}
