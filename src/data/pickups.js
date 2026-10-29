import canUrl from './items/can.png?url';
import taquillaUrl from './items/taquilla.png?url';
import parkingUrl from './items/parking.png?url';
import boxesUrl from './items/boxes.png?url';
import energyUrl from './items/item_energy.png?url';
import fullEnergyUrl from './items/item_full_energy.png?url';
import moneyUrl from './items/item_money.png?url';
import {prepareCutout,needsSource} from './spriteSheets.js';

// Uniform cells (same size and bottom line) for 4-frame strips, so the animation never jumps.
const strip=(top,bottom,cell=543)=>[0,1,2,3].map(i=>[i*cell,top,cell,bottom-top+1]);
// Strips whose drawings are not on an even grid: each frame's own region, pasted into a canvas of one common
// size (centred horizontally; `align` 'bottom' keeps the ground line, 'center' keeps a spinning card centred).

// Breakable containers. poses: which frame shows when hit, while dented, and the breaking sequence.
// can/taquilla/boxes have 6 poses (intact, hit, dented, three breaking); parking has 4 (intact, cracked, bursting, rubble).
// levels: 0-based level indexes where each one can appear.
export const CONTAINERS={
  can:{source:'can-source',url:canUrl,height:76,levels:[0,1,4,5,6,7],poses:{hit:1,dented:2,breaking:[3,4,5]},align:'bottom',
    rects:[[6,152,292,440],[330,157,301,432],[685,160,296,431],[1017,173,368,420],[1385,386,370,224],[1773,453,388,163]]},
  taquilla:{source:'taquilla-source',url:taquillaUrl,height:104,levels:[2,3,4,5],poses:{hit:1,dented:2,breaking:[3,4,5]},align:'bottom',
    rects:[[207,64,181,432],[673,71,237,428],[1153,66,248,432],[85,534,344,431],[514,681,469,282],[1031,771,476,196]]},
  // Parking meter: outdoor street levels.
  parking:{source:'parking-source',url:parkingUrl,height:96,levels:[0,2,4,5,6],poses:{hit:1,dented:1,breaking:[2,3]},align:'bottom',
    rects:[[131,19,302,695],[610,19,301,695],[1042,32,458,682],[1500,32,647,682]]},
  // Fruit crates can appear in every arena's container pool. Shared canvas preserves debris size and the floor line.
  boxes:{source:'boxes-source',url:boxesUrl,height:76,levels:[0,1,2,3,4,5,6,7],poses:{hit:1,dented:2,breaking:[3,4,5]},align:'bottom',
    rects:[[26,207,290,413],[356,213,340,407],[713,218,347,402],[1065,159,347,466],[1424,212,366,413],[1810,462,356,163]]},
};
// Drops from any broken container: every `fullEvery`-th drop of a level is the changua (refills all energy);
// otherwise a TuLlave card (+1000 points) with `moneyChance`, or the pandebono with chocolate (+25 energy).
export const ITEMS={
  energy:{texture:'item-energy-0',width:60,height:50,heal:25,frames:4,frameTicks:8,prefix:'item-energy',source:'item-energy-source',rects:strip(119,569)},
  // TuLlave spinning: front, edge, back, edge (the edge frames are thin; frameTicks keeps the spin readable).
  money:{texture:'item-money-0',width:60,height:40,heal:0,score:1000,frames:4,frameTicks:9,prefix:'item-money',source:'item-money-source',align:'center',
    rects:[[64,152,691,456],[820,152,159,426],[1116,153,714,455],[1907,153,159,426]]},
  full:{texture:'item-full-0',width:62,height:58,heal:100,frames:6,frameTicks:8,prefix:'item-full',source:'item-full-source',
    rects:[0,1,2,3,4,5].map(i=>[(i%3)*512+20,Math.floor(i/3)*512+(i<3?40:34),480,448])},
};
export const PICKUPS={chance:.65,hits:2,heal:25,maxEnergy:100,canHeight:76,itemWidth:56,itemHeight:38,fullEvery:4,moneyChance:.35,
  halfWidth:24,halfDepth:8,lane:24,pickupX:28,pickupY:20,pickupZ:8,poseFrames:6,
  spawnLeft:.38,spawnRight:.78,laneMargin:18,
  canRects:CONTAINERS.can.rects,
};
/** Containers allowed on a level (falls back to the can). */
export const containersFor=levelIndex=>{
  const kinds=Object.keys(CONTAINERS).filter(kind=>CONTAINERS[kind].levels.includes(levelIndex));
  return kinds.length?kinds:['can'];
};
const ITEM_URLS={'item-energy-source':energyUrl,'item-money-source':moneyUrl,'item-full-source':fullEnergyUrl};
/** Load one existing pickup for modes that do not use destructible containers. */
export function preloadItem(scene,kind){
  const item=ITEMS[kind];
  if(!scene.textures.exists(item.texture) && needsSource(scene,item.source))scene.load.image(item.source,ITEM_URLS[item.source]);
}
export function preloadPickups(scene){
  for(const c of Object.values(CONTAINERS))if(needsSource(scene,c.source))scene.load.image(c.source,c.url);
  for(const [key,url] of Object.entries(ITEM_URLS))if(needsSource(scene,key))scene.load.image(key,url);
}
/** One frame cut from `source` and pasted into a canvas of the strip's common size. */
function prepareFramed(scene,key,source,[x,y,width,height],size,align){
  if(scene.textures.exists(key))return;
  const texture=scene.textures.createCanvas(key,size.width,size.height);
  const dx=Math.round((size.width-width)/2),dy=align==='center'?Math.round((size.height-height)/2):size.height-height;
  texture.context.drawImage(scene.textures.get(source).getSourceImage(),x,y,width,height,dx,dy,width,height);
  const pixels=texture.context.getImageData(0,0,size.width,size.height);
  for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<=32)pixels.data[i]=0;
  texture.context.putImageData(pixels,0,0);texture.refresh();
}
function prepareStrip(scene,prefix,source,rects,align){
  if(!align)return rects.forEach(([x,y,width,height],i)=>prepareCutout(scene,`${prefix}-${i}`,source,{x,y,width,height}));
  const size={width:Math.max(...rects.map(r=>r[2])),height:Math.max(...rects.map(r=>r[3]))};
  rects.forEach((rect,i)=>prepareFramed(scene,`${prefix}-${i}`,source,rect,size,align));
}
export function preparePickups(scene){
  for(const [kind,c] of Object.entries(CONTAINERS))prepareStrip(scene,kind,c.source,c.rects,c.align);
  for(const item of Object.values(ITEMS))prepareStrip(scene,item.prefix,item.source,item.rects,item.align);
}
export function prepareItem(scene,kind){
  const item=ITEMS[kind];prepareStrip(scene,item.prefix,item.source,item.rects,item.align);
}
