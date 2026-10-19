import canUrl from './can.png?url';
import taquillaUrl from './taquilla.png?url';
import energyUrl from './item_energy.png?url';
import fullEnergyUrl from './item_full_energy.png?url';
import {prepareCutout} from './spriteSheets.js';

// Breakable containers share the same 6 poses: intact, hit, dented, then three breaking poses.
// levels: 0-based level indexes where each one can appear (can → levels 1, 2, 5, 6; taquilla → 3, 4, 5, 6).
export const CONTAINERS={
  can:{source:'can-source',url:canUrl,height:76,levels:[0,1,4,5],
    rects:[[6,152,292,440],[330,157,301,432],[685,160,296,431],[1017,173,368,420],[1385,386,370,224],[1773,453,388,163]]},
  taquilla:{source:'taquilla-source',url:taquillaUrl,height:104,levels:[2,3,4,5],
    rects:[[207,64,181,432],[673,71,237,428],[1153,66,248,432],[85,534,344,431],[514,681,469,282],[1031,771,476,196]]},
};
// Drops: the pandebono with chocolate heals 25; every `fullEvery`-th drop of a level is the changua, which refills all energy.
export const ITEMS={
  energy:{texture:'item-energy',width:56,height:38,heal:25},
  full:{texture:'item-full-0',width:62,height:58,heal:100,frames:6,frameTicks:8,
    // Uniform cells (same bottom line) so the steam animates without the bowl jumping.
    rects:[0,1,2,3,4,5].map(i=>({x:(i%3)*512+20,y:Math.floor(i/3)*512+(i<3?40:34),width:480,height:448}))},
};
export const PICKUPS={chance:.65,hits:2,heal:25,maxEnergy:100,canHeight:76,itemWidth:56,itemHeight:38,fullEvery:4,
  halfWidth:24,halfDepth:8,lane:24,pickupX:28,pickupY:20,pickupZ:8,poseFrames:6,
  spawnLeft:.38,spawnRight:.78,laneMargin:18,
  canRects:CONTAINERS.can.rects,
};
/** Containers allowed on a level (falls back to the can). */
export const containersFor=levelIndex=>{
  const kinds=Object.keys(CONTAINERS).filter(kind=>CONTAINERS[kind].levels.includes(levelIndex));
  return kinds.length?kinds:['can'];
};
export function preloadPickups(scene){
  for(const c of Object.values(CONTAINERS))if(!scene.textures.exists(c.source))scene.load.image(c.source,c.url);
  if(!scene.textures.exists('item-energy'))scene.load.image('item-energy',energyUrl);
  if(!scene.textures.exists('item-full-source'))scene.load.image('item-full-source',fullEnergyUrl);
}
export function preparePickups(scene){
  for(const [kind,c] of Object.entries(CONTAINERS))c.rects.forEach(([x,y,width,height],i)=>prepareCutout(scene,`${kind}-${i}`,c.source,{x,y,width,height}));
  ITEMS.full.rects.forEach((rect,i)=>prepareCutout(scene,`item-full-${i}`,'item-full-source',rect));
}
