import potholeUrl from './hazards/pothole.png?url';
import manholeUrl from './hazards/manhole-v2.png?url';
import {HAZARD_SPRITES} from '../stage/hazardSprites.js';

export function preloadHazards(scene){
  const kinds=new Set((scene.level?.hazards?.holes??[]).map(h=>h.kind));
  for(const kind of kinds){
    const art=HAZARD_SPRITES[kind];if(!art || scene.textures.exists(art.key))continue;
    scene.load.spritesheet(art.key,kind==='pothole'?potholeUrl:manholeUrl,{frameWidth:art.frameWidth,frameHeight:art.frameHeight});
  }
}
