import {toFrames} from '../data/arcade.js';

/** Support enemy: a cancellable tell, one whistle/one ally, then a real cooldown. */
export class CuidacarrosController {
  constructor(model){this.model=model;this.config=model.actor.config.callReinforcements;this.ready=model.clock+toFrames(this.config.first);this.phase=null;this.age=0;}
  interrupt(){this.phase=null;this.age=0;this.ready=this.model.clock+toFrames(this.config.interrupt);}
  step(){
    const m=this.model,s=m.scene,a=m.actor,c=this.config; // hitstop, hurt, throws and grabs are handled before this controller
    m.face(s.player.x-a.x);
    if(a.x<s.floor.left || a.x>s.floor.right){m.move(a.x<s.floor.left?1:-1,0);m.pose('walk');return;}
    if(this.phase==='windup'){
      this.age++;m.pose('signal',a.config.animations.signal[Math.min(3,Math.floor(this.age/toFrames(c.windup)*4))]);
      if(this.age>=toFrames(c.windup)){
        const ally=s.callReinforcement(a);
        if(ally)s.sfx?.play('whistle'); // every audible whistle has exactly one matching spawn
        a.tell.setVisible(false);this.phase='recover';this.age=0;
        this.ready=m.clock+toFrames(c.cooldown);m.transition('recover');
      }
      return;
    }
    if(this.phase==='recover'){
      this.age++;m.pose('signal',a.config.animations.signal[1+Math.floor(this.age/6)%3]);
      if(this.age>=toFrames(c.recover)){this.phase=null;m.transition('circle');}
      return;
    }
    if(m.clock>=this.ready){
      this.phase='windup';this.age=0;m.transition('windup');m.pose('signal',4);
      a.tell.setText('¡REFUERZOS!').setVisible(true);return;
    }
    // Retreat when crowded. It never acquires an attack token or creates an attack action.
    const dx=a.x-s.player.x,retreat=Math.abs(dx)<c.keepDistance?(Math.sign(dx)||1):0;
    m.move(retreat,0);m.pose(retreat?'walk':'idle');
  }
}
