import {ARCADE} from '../data/arcade.js';
export function joystickVector(dx,dy,radius,deadZone=ARCADE.movement.deadZone) {
  const distance=Math.hypot(dx,dy),strength=Math.min(1,distance/radius);
  if(!radius || strength<=deadZone)return {x:0,y:0};
  const amount=(strength-deadZone)/(1-deadZone);
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
