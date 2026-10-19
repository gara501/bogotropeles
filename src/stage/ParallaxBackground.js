import {ARCADE} from '../data/arcade.js';

/**
 * Screen-fixed tile sprites whose texture offset follows the camera.
 * Layer: {key, factor=1, y=0, height=screen, front=false, scale?, drift=0}
 *  - drift: px/s the layer scrolls on its own (e.g. the city passing a moving bus's windows).
 *  - factor < 1 → far layers (sky, skyline); 1 → floor (moves with the actors);
 *    > 1 → foreground props drawn over the fighters (front:true).
 */
export class ParallaxBackground {
  constructor(scene,layers) {
    const {width,height}=ARCADE.screen;
    this.layers=layers.map((layer,index)=>{
      const source=scene.textures.get(layer.key).getSourceImage();
      const h=layer.height??height;
      // Layers repeat horizontally, so only the height decides the scale (a narrower tile must not be enlarged).
      const scale=layer.scale??h/source.height;
      const sprite=scene.add.tileSprite(0,layer.y??0,width,h,layer.key).setOrigin(0).setScrollFactor(0)
        .setTileScale(scale).setDepth(layer.front?ARCADE.stage.frontDepth+index:ARCADE.stage.backDepth+index);
      return {factor:1,drift:0,...layer,scale,sprite};
    });
  }
  update(scrollX,elapsedMs=0) {
    // tilePosition is measured in texture pixels; rounding on screen avoids shimmer in pixel art.
    for(const layer of this.layers)layer.sprite.tilePositionX=Math.round(scrollX*layer.factor+elapsedMs*layer.drift/1000)/layer.scale;
  }
  destroy(){for(const layer of this.layers)layer.sprite.destroy();this.layers=[];}
}
