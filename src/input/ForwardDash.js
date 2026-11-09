import {ARCADE} from '../data/arcade.js';

// Hysteresis makes a thumb/stick crossing the threshold one press, not many.
export class ForwardDash {
  constructor(){this.reset();}
  reset(){this.held=0;this.lastDirection=0;this.lastFrame=-Infinity;}
  capture(dx,dy,facing,frame){
    if(Math.abs(dx)<.2){this.held=0;return false;}
    if(Math.abs(dx)<.6 || Math.abs(dy)>Math.abs(dx))return false;
    const direction=Math.sign(dx);
    if(this.held===direction)return false;
    const released=this.held===0;this.held=direction;
    const dash=released && direction===facing && direction===this.lastDirection
      && frame-this.lastFrame<=ARCADE.input.forwardTapFrames;
    this.lastDirection=dash?0:direction;this.lastFrame=frame;
    return dash;
  }
}
