import {ARCADE} from '../data/arcade.js';

/**
 * A background vehicle (the TransMilenio) that drives past every few seconds on the
 * road between two parallax layers. It lives in "layer space": its screen position is
 * x - scrollX * factor, so it keeps the depth illusion while the camera moves.
 * Config: {key, after:'<layer file>', factor, bottom, speed px/s, every:[min,max] ms, first ms}
 */
export class AmbientTraffic {
  constructor(scene,config,background,random=Math.random) {
    this.config={factor:1,speed:240,every:[5000,10000],first:2000,...config};this.random=random;
    const behind=background?.layers.find(layer=>layer.file===config.after);
    const depth=(behind?.sprite.depth??ARCADE.stage.backDepth)+.5;
    this.sprite=scene.add.image(0,this.config.bottom,config.key).setOrigin(.5,1).setScrollFactor(0).setDepth(depth).setVisible(false);
    this.wait=this.config.first;this.active=false;this.x=0;this.direction=1;
  }
  get halfWidth(){return (this.sprite.displayWidth??this.sprite.width)/2;}
  update(scrollX,dt=ARCADE.clock.stepMs) {
    const c=this.config,width=ARCADE.screen.width,half=this.halfWidth;
    if(!this.active) {
      this.wait-=dt;if(this.wait>1e-6)return; // tolerance: 60 × 16.67 ms leaves float residue
      // oneWay: vehicles with lettering (the TransMilenio bus) never flip, so the text never reads mirrored.
      this.direction=c.oneWay?1:this.random()<.5?1:-1;
      this.x=(this.direction>0?-half-20:width+half+20)+scrollX*c.factor;
      this.active=true;this.sprite.setFlipX(this.direction<0).setVisible(true);
    }
    this.x+=this.direction*c.speed*dt/1000;
    const screen=Math.round(this.x-scrollX*c.factor);this.sprite.x=screen;
    if(this.direction>0?screen-half>width+20:screen+half<-20) {
      this.active=false;this.sprite.setVisible(false);
      const [min,max]=c.every;this.wait=min+this.random()*(max-min);
    }
  }
  destroy(){this.sprite.destroy();}
}
