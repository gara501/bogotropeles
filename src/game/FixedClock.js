import {ARCADE} from '../data/arcade.js';
export class FixedClock {
  constructor(){this.accumulator=0;this.frame=0;}
  advance(delta,step){
    this.accumulator=Math.min(this.accumulator+Math.max(0,delta),ARCADE.clock.stepMs*ARCADE.clock.maxCatchUp);
    while(this.accumulator+1e-7>=ARCADE.clock.stepMs){this.accumulator-=ARCADE.clock.stepMs;step(++this.frame);}
  }
  clear(){this.accumulator=0;}
}
