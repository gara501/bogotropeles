import {ARCADE} from '../data/arcade.js';
export function joystickVector(dx,dy,radius,deadZone=ARCADE.movement.touchDeadZone) {
  const distance=Math.hypot(dx,dy),strength=Math.min(1,distance/radius);
  if(!radius || strength<=deadZone)return {x:0,y:0};
  // Short thumb travel reaches cruising speed; retain fine movement near center.
  const fullSpeed=Math.max(deadZone+.01,ARCADE.movement.touchFullSpeed);
  const amount=Math.min(1,(strength-deadZone)/(fullSpeed-deadZone));
  return {x:dx/distance*amount,y:dy/distance*amount};
}

// Touch state is independent of Phaser's keyboard so releasing a finger cannot
// release a physical key. A press is consumed once, even while a finger is held.
export class TouchInput {
  constructor(){this.reset();}
  reset(){this.x=0;this.y=0;this.pointers=new Map();this.pressed=new Set();}
  down(action,pointer) {
    if(!this.isDown(action))this.pressed.add(action);
    this.pointers.set(pointer,action);
  }
  up(pointer,cancel=false){
    const action=this.pointers.get(pointer);this.pointers.delete(pointer);
    if(cancel && action && !this.isDown(action))this.pressed.delete(action);
  }
  isDown(action){return [...this.pointers.values()].includes(action);}
  justDown(action){const pressed=this.pressed.has(action);this.pressed.delete(action);return pressed;}
  discardPresses(){this.pressed.clear();}
}
