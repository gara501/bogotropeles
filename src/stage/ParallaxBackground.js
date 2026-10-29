import {ARCADE} from '../data/arcade.js';

/**
 * Screen-fixed tile sprites whose texture offset follows the camera.
 * Layer: {key, factor=1, y=0, height=screen, front=false, scale?, drift=0, repeat=true}
 *  - drift: px/s the layer scrolls on its own (e.g. the city passing a moving bus's windows).
 *  - factor < 1 → far layers (sky, skyline); 1 → floor (moves with the actors);
 *    > 1 → foreground props drawn over the fighters (front:true).
 */
export class ParallaxBackground {
  constructor(scene,layers,worldWidth=ARCADE.screen.width) {
    const {width,height}=ARCADE.screen;
    this.layers=layers.map((layer,index)=>{
      const texture=scene.textures.get(layer.key),source=texture.getSourceImage();
      const h=layer.height??height;
      const depth=layer.front?ARCADE.stage.frontDepth+index:ARCADE.stage.backDepth+index;
      // A panorama covers the complete route once. Repeating its two different
      // ends would splice unrelated rooflines together in the middle of a view.
      if(layer.repeat===false){
        // Preserve the artwork's proportions. Map its available horizontal
        // travel to the route instead of stretching the facade to world width.
        const displayWidth=Math.max(width,source.width*h/source.height);
        const sprite=scene.add.image(0,layer.y??0,layer.key).setOrigin(0).setScrollFactor(0)
          .setDisplaySize(displayWidth,h).setDepth(depth);
        const maxScroll=displayWidth-width;
        return {factor:1,drift:0,...layer,sprite,maxScroll,panRatio:maxScroll/Math.max(1,worldWidth-width)};
      }
      // Layers repeat horizontally, so only the height decides the scale (a narrower tile must not be enlarged).
      let frame;
      if(layer.frameRect){
        frame=`stage-${layer.frameRect.join('-')}`;
        if(!texture.has(frame))texture.add(frame,0,...layer.frameRect);
      }
      const scale=layer.scale??h/(layer.frameRect?.[3]??source.height);
      const sprite=scene.add.tileSprite(0,layer.y??0,width,h,layer.key,frame).setOrigin(0).setScrollFactor(0)
        .setTileScale(scale).setDepth(depth);
      return {factor:1,drift:0,...layer,scale,sprite};
    });
  }
  update(scrollX,elapsedMs=0) {
    // tilePosition is measured in texture pixels; rounding on screen avoids shimmer in pixel art.
    for(const layer of this.layers){
      const offset=Math.round(scrollX*layer.factor+elapsedMs*layer.drift/1000);
      if(layer.repeat===false){const pan=Math.max(0,Math.min(layer.maxScroll,offset*layer.panRatio));layer.sprite.x=pan?-pan:0;}
      else layer.sprite.tilePositionX=offset/layer.scale;
    }
  }
  destroy(){for(const layer of this.layers)layer.sprite.destroy();this.layers=[];}
}
