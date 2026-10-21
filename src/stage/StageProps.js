import {PROPS,propLayout} from '../data/props.js';
import {ARCADE} from '../data/arcade.js';
import {viewLeft} from './scroll.js';

/** Places a level's background props (carts, cars, bus passengers) behind the fighters. */
export class StageProps {
  constructor(scene,config,width){
    this.scene=scene;this.items=[];this.time=0;this.width=width;
    if(!config)return;
    this.edgeMargin=config.edgeMargin;this.edgeFade=config.edgeFade??24;
    const top=scene.floor.top,index=scene.levelIndex??0;
    // scrollFactor: props glued to a parallax layer (e.g. bus passengers next to the .9 seat row) scroll with it;
    // their world span shrinks accordingly.
    const factor=config.scrollFactor??1,span=width*factor+ARCADE.screen.width*(1-factor);
    for(const p of propLayout(config,span,index+1)){
      const def=PROPS[p.kind];if(!def || !scene.textures?.exists?.(def.texture))continue;
      const y=top+(config.baseline??-2)+p.offset;
      const sprite=scene.add.image(p.x,y,def.texture).setOrigin(.5,1).setFlipX(def.noFlip?false:p.flip);sprite.setScrollFactor?.(factor,1);
      if(def.scale)sprite.setScale(def.scale);else sprite.setScale(def.height/def.rect[3]);
      if(def.tint)sprite.setTint(def.tint);
      // Always behind the fighters (whose depth is their y ≥ floor.top) but over the background layers.
      const depth=top-20+p.offset*.1;sprite.setDepth(depth);
      // Soft ground shadow so the prop sits on the street instead of floating over it.
      let shadow=null;
      if(def.shadow && scene.add.ellipse){
        const width=sprite.displayWidth*def.shadow;
        shadow=scene.add.ellipse(p.x,y+2,width,Math.max(12,width*.2),0x000000,.42).setDepth(depth-.5);shadow.setScrollFactor?.(factor,1);
      }
      // Pedestrians drawn mid-stride walk the way they face (mirrored ones the other way) and wrap around the street.
      const walk=def.walk?{speed:def.walk.speed,dir:def.walk.dir*((def.noFlip?false:p.flip)?-1:1)}:null;
      this.items.push({sprite,shadow,y,sway:def.sway,walk,phase:p.x*.013,factor});
    }
    if(this.edgeMargin!=null)this.update(0);
  }
  /** Passengers sway a little with the bus. */
  update(dt=1000/60){
    this.time+=dt;
    for(const item of this.items)if(item.walk){
      const s=item.sprite,w=item.walk;s.x+=w.dir*w.speed*dt/1000;
      if(s.x<-80)s.x+=this.width+160;else if(s.x>this.width+80)s.x-=this.width+160;
      s.y=item.y-Math.abs(Math.sin((this.time/1000+item.phase)*w.speed*.25))*2; // step bob
      item.shadow?.setPosition(s.x,item.y+2);
    }
    for(const item of this.items)if(item.sway){
      const t=this.time/1000+item.phase;item.sprite.y=item.y+Math.round(Math.sin(t*2.1));item.sprite.rotation=Math.sin(t*1.3)*.012;
    }
    if(this.edgeMargin!=null)for(const item of this.items){
      const sprite=item.sprite,x=sprite.x-viewLeft(this.scene)*item.factor,half=sprite.displayWidth/2;
      const gap=Math.min(x-half,ARCADE.screen.width-x-half);
      const alpha=Math.max(0,Math.min(1,(gap-this.edgeMargin)/Math.max(1,this.edgeFade)));
      sprite.setVisible(alpha>0).setAlpha(alpha);
      item.shadow?.setVisible(alpha>0).setAlpha(alpha);
    }
  }
  destroy(){for(const item of this.items){item.sprite.destroy();item.shadow?.destroy();}this.items=[];}
}
