import {ARCADE} from '../data/arcade.js';
import {FX_ATLAS,FRAMES} from '../fx/FxTextures.js';

const ADD=1;
/** Night grade for a level's art plus glows pinned to the panorama layer (see src/data/night.js). */
export class NightMode {
  constructor(scene,config,background){
    this.scene=scene;this.config=config;this.time=0;
    this.layer=background?.layers.find(layer=>layer.file===config.layer || layer.key?.includes(config.layer))??null;
    if(!this.layer){this.lights=[];return;}
    this.layer.sprite.setTint?.(...config.tint);
    for(const layer of background.layers)if(layer!==this.layer && !layer.front && config.floorTint)layer.sprite.setTint?.(config.floorTint);
    const glow=scene.textures?.exists?.(FX_ATLAS);
    this.lights=glow?config.lights.map(light=>({...light,sprite:scene.add.image(0,0,FX_ATLAS,'glow').setBlendMode(ADD).setScrollFactor(0)
      .setDepth(ARCADE.stage.backDepth+20).setTint(light.color)})):[];
  }
  update(ms=ARCADE.clock.stepMs){
    if(!this.layer)return;this.time+=ms;
    const s=this.layer.sprite,sx=s.scaleX,sy=s.scaleY,view=ARCADE.screen.width;
    for(const l of this.lights){
      const x=s.x+l.x*sx,y=s.y+l.y*sy,visible=x>-l.radius && x<view+l.radius;
      l.sprite.setVisible(visible);if(!visible)continue;
      const flicker=l.flicker?1-l.flicker*(.5+.5*Math.sin(this.time/(110+l.x%50)+l.x)):1;
      l.sprite.setPosition(Math.round(x),Math.round(y)).setScale(l.radius*2/FRAMES.glow.w).setAlpha(l.intensity*flicker);
    }
  }
  destroy(){for(const l of this.lights)l.sprite.destroy();this.lights=[];}
}
