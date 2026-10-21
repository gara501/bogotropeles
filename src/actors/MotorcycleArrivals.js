import {ARCADE} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';

/** The driver is an entrance prop; only the passenger belongs to the enemy wave. */
export class MotorcycleArrivals {
  constructor(scene){this.scene=scene;this.entries=[];}
  start(actor){
    const s=this.scene,c=actor.config.motorcycle,left=viewLeft(s),dir=actor.facing||1;
    const dropX=dir>0?s.floor.left+140:s.floor.right-140;
    actor.x=dropX-dir*25;actor.arriving=true;actor.invulnerableUntil=Infinity;
    for(const object of [actor.sprite,actor.shadow,actor.healthBar,actor.tell])object.setVisible(false);
    const startX=left+(dir>0?-180:ARCADE.screen.width+180);
    const bike=s.add.sprite(startX,actor.y,c.texture,c.ride[0]).setOrigin(.5,1)
      .setScale(actor.config.height/s.textures.get(c.texture).referenceHeight).setFlipX(dir<0).setDepth(actor.y);
    const passenger=s.add.sprite(dropX-dir*25,actor.y,c.texture,c.dismount[0]).setOrigin(.5,1)
      .setScale(actor.config.height/c.passengerHeight).setFlipX(dir<0).setDepth(actor.y+1).setVisible(false);
    const shadow=s.add.ellipse(startX,actor.y+2,135,12,0x122a2c,.3).setDepth(actor.y-2);
    this.entries.push({actor,bike,passenger,shadow,startX,dropX,dir,y:actor.y,since:s.combatTime,released:false});
    s.sfx?.play('moto');
  }
  release(entry){
    if(entry.released)return;
    entry.released=true;entry.passenger.destroy();
    const a=entry.actor,s=this.scene;a.arriving=false;a.invulnerableUntil=0;
    a.sprite.setVisible(a.hp>0).setFrame(a.config.idle).setFlipX(a.facing<0);
    a.shadow.setVisible(a.hp>0);a.healthBar.setVisible(a.hp>0);
    const model=s.arcade?.enemies.get(a);if(model)model.ready=0;
  }
  update(){
    const s=this.scene;
    if(s.finished || s.gameOver){this.clear();return;}
    if(s.paused || s.cinematic || s.health<=0)return;
    const left=viewLeft(s);
    this.entries=this.entries.filter(entry=>{
      const a=entry.actor,c=a.config.motorcycle,age=s.combatTime-entry.since;
      let x;
      if(age<c.entryMs){
        x=entry.startX+(entry.dropX-entry.startX)*age/c.entryMs;
        entry.bike.setFrame(c.ride[Math.floor(age/80)%c.ride.length]);
      }else{
        const t=Math.min(1,(age-c.entryMs)/c.dismountMs);
        x=entry.dropX+entry.dir*Math.max(0,age-c.entryMs-c.dismountMs*.5)/1000*c.speed;
        entry.bike.setFrame(c.drive[Math.floor(age/80)%c.drive.length]);
        if(t<1 && !entry.released){
          entry.passenger.setVisible(true).setFrame(c.dismount[Math.min(c.dismount.length-1,Math.floor(t*c.dismount.length))])
            .setPosition(a.x,a.y-Math.sin(t*Math.PI)*12);
        }else this.release(entry);
      }
      entry.bike.setPosition(x,entry.y);entry.shadow.setPosition(x,entry.y+2);
      if(entry.released && (x<left-220 || x>left+ARCADE.screen.width+220)){
        entry.bike.destroy();entry.shadow.destroy();return false;
      }
      return true;
    });
  }
  clear(){for(const e of this.entries){this.release(e);e.bike.destroy();e.shadow.destroy();}this.entries=[];}
  destroy(){this.clear();}
}
