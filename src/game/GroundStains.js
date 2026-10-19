import {ARCADE} from '../data/arcade.js';

/**
 * Paint on the floor (level 3 boss). Each stain hurts a grounded player who walks over it
 * (once per `every` ms per stain), fades out and disappears after `ms` (3 s by default).
 */
export class GroundStains {
  constructor(scene){this.scene=scene;this.stains=[];}
  spawn(x,y,{width=72,height=22,color=0xff2fb4,ms=3000,damage=6,every=700,owner=null}={}) {
    const s=this.scene,{left,right,top,bottom}=s.floor;
    x=Math.max(left,Math.min(right,x));y=Math.max(top,Math.min(bottom,y));
    const sprite=s.add.ellipse(x,y,width,height,color,.75).setDepth(1); // on the floor, under every fighter
    const stain={x,y,width,height,until:s.combatTime+ms,ms,damage,every,owner,hitAt:-Infinity,sprite};
    this.stains.push(stain);return stain;
  }
  touches(stain,p){return (p.z??0)<8 && Math.abs(p.x-stain.x)<=stain.width/2 && Math.abs(p.y-stain.y)<=stain.height/2+ARCADE.body.halfDepth;}
  update() {
    const s=this.scene,now=s.combatTime,p=s.player;
    this.stains=this.stains.filter(stain=>{
      const left=stain.until-now;
      if(left<=0){stain.sprite.destroy();return false;}
      stain.sprite.setAlpha?.(.75*Math.min(1,left/stain.ms*1.4));
      if(s.health>0 && now>=stain.hitAt+stain.every && this.touches(stain,p) && s.hitPlayer(stain.damage,null,stain.owner))stain.hitAt=now;
      return true;
    });
  }
  clear(){for(const stain of this.stains)stain.sprite.destroy();this.stains=[];}
}
