import lechonaUrl from './NPC/item_bg_1.png?url';
import merengonUrl from './NPC/item_bg_2.png?url';
import passengersUrl from './NPC/item_bg_3.png?url';
import stationUrl from './NPC/npc_estacion.png?url';
import chorroUrl from './NPC/npc_chorro.png?url';
import samberUrl from './NPC/npc_samber.png?url';
import gomelosUrl from './NPC/npc_gomelos.png?url';
import politicosUrl from './NPC/npc_politicos.png?url';
import {prepareCutout,needsSource} from './spriteSheets.js';

// Background props that make the levels livelier. They stand at the back edge of the walkable floor,
// behind every fighter, and scroll with the street.
// item_bg_1 lechonería cart · item_bg_2 Merengón Bogotano Renault 4 · item_bg_3 12 TransMilenio passengers (3×4).
const SOURCES={'prop-lechona-source':lechonaUrl,'prop-merengon-source':merengonUrl,'prop-passengers-source':passengersUrl,'prop-station-source':stationUrl,'prop-chorro-source':chorroUrl,'prop-samber-source':samberUrl,'prop-gomelos-source':gomelosUrl,'prop-politicos-source':politicosUrl};
// Eight people, two poses each. Tight alpha bounds keep neighbouring hands and shoes out of the cutouts.
const GOMELOS=[[83,7,182,337],[358,75,199,269],[632,26,188,318],[901,87,199,257],
  [81,361,195,322],[376,402,160,281],[642,361,175,321],[914,358,165,325],
  [81,710,190,297],[371,691,172,316],[632,708,185,299],[923,689,194,317],
  [73,1023,192,296],[377,1016,165,303],[647,1015,166,304],[949,1037,144,285]];
// npc_samber.png (4×4): people on the downtown streets (level 6), standing, sitting or crouching.
const SAMBER=[[66,8,173,358],[393,26,186,340],[748,11,152,355],[1085,13,153,353],[46,394,240,203],[391,400,239,190],[733,398,209,208],[1085,377,164,232],
  [65,641,215,215],[413,601,168,297],[707,658,279,201],[1103,595,149,293],[48,868,171,321],[355,960,284,210],[739,874,207,311],[1108,889,147,305]];
// npc_chorro.png (4×4): young people hanging out at the Chorro de Quevedo (some sitting on the floor).
const CHORRO=[[38,20,279,251],[379,57,227,216],[664,28,255,260],[982,44,216,226],[82,282,174,353],[384,288,180,345],[687,300,209,331],[1003,293,169,339],
  [69,645,149,328],[388,643,153,336],[722,642,133,331],[1002,639,192,330],[58,978,177,293],[353,1030,249,236],[649,1026,231,222],[1001,975,183,291]];
// npc_estacion.png (4×4): pedestrians at the level 1 station. walk: native facing (1 right, -1 left) and speed in px/s
// for the ones drawn mid-stride; the rest wait in place.
const STATION=[[[89,18,162,305]],[[432,18,128,305]],[[752,31,114,294]],[[1072,11,142,313]],
  [[88,333,149,291],1,26],[[414,329,161,295],1,30],[[734,333,156,290],1,22],[[1054,349,192,273],-1,12],
  [[83,631,154,283]],[[395,631,167,285],-1,24],[[731,625,184,290],1,28],[[1038,630,196,285]],
  [[89,919,126,272]],[[414,926,139,263],1,10],[[719,923,195,263],1,18],[[1059,915,178,274]]];
const PASSENGER_RECTS=[[156,8,172,352],[494,11,172,351],[800,5,158,355],[1137,6,197,354],[140,364,187,351],[453,381,186,334],
  [785,368,191,347],[1153,372,171,346],[139,721,194,347],[460,721,191,349],[801,720,178,350],[1144,721,186,348]];
export const PROPS={
  // height: on-screen height of the tallest drawing; scale is shared so passengers keep their relative sizes.
  // noFlip: they carry lettering, so they are never mirrored. shadow: ground shadow width (share of the sprite width).
  lechona:{texture:'prop-lechona',source:'prop-lechona-source',rect:[11,22,1292,1167],height:132,noFlip:true,shadow:.82},
  merengon:{texture:'prop-merengon',source:'prop-merengon-source',rect:[93,13,1405,1000],height:112,noFlip:true,shadow:.9},
  ...Object.fromEntries(PASSENGER_RECTS.map((rect,i)=>[`passenger${i}`,{texture:`prop-passenger-${i}`,source:'prop-passengers-source',rect,
    scale:110/355,tint:0xe2e2e2,shadow:.55}])),
  ...Object.fromEntries(STATION.map(([rect,dir,speed],i)=>[`station${i}`,{texture:`prop-station-${i}`,source:'prop-station-source',rect,
    scale:100/305,tint:0xc9cdd2,shadow:.5}])), // static: the drawings have no walk cycle
};
export const PASSENGERS=PASSENGER_RECTS.map((_,i)=>`passenger${i}`);
// One scale for all of them (standing figures ≈ 340 px → 104 on screen), so the sitting ones stay proportionally low.
Object.assign(PROPS,Object.fromEntries(CHORRO.map((rect,i)=>[`chorro${i}`,{texture:`prop-chorro-${i}`,source:'prop-chorro-source',rect,
  scale:104/340,tint:0xd8d8d8,shadow:.5}])));
export const CHORRO_NPCS=CHORRO.map((_,i)=>`chorro${i}`);
Object.assign(PROPS,Object.fromEntries(SAMBER.map((rect,i)=>[`samber${i}`,{texture:`prop-samber-${i}`,source:'prop-samber-source',rect,
  scale:106/355,tint:0xd8d8d8,shadow:.5}])));
export const SAMBER_NPCS=SAMBER.map((_,i)=>`samber${i}`);
Object.assign(PROPS,Object.fromEntries(GOMELOS.map((rect,i)=>[`gomelo${i}`,{texture:`prop-gomelo-${i}`,source:'prop-gomelos-source',rect,
  scale:102/337,shadow:.5,cleanFringes:true}])));
export const GOMELO_NPCS=GOMELOS.map((_,i)=>`gomelo${i}`);
// Eight bystanders from the photo reference, sharing one scale and a foot baseline per cell.
const POLITICOS=[[55,37,146,337],[314,49,139,325],[568,45,143,329],[829,49,134,325],
  [76,461,103,297],[312,425,144,333],[565,432,150,326],[819,452,154,306]];
Object.assign(PROPS,Object.fromEntries(POLITICOS.map((rect,i)=>[`politico${i}`,{texture:`prop-politico-${i}`,source:'prop-politicos-source',rect,
  scale:102/337,shadow:.5,cleanFringes:true}])));
export const POLITICO_NPCS=POLITICOS.map((_,i)=>`politico${i}`);
export const STATION_NPCS=STATION.map((_,i)=>`station${i}`);
export function preloadProps(scene){for(const [key,url] of Object.entries(SOURCES))if(needsSource(scene,key))scene.load.image(key,url);}
export function prepareProps(scene){
  for(const p of Object.values(PROPS)){const [x,y,width,height]=p.rect;prepareCutout(scene,p.texture,p.source,{x,y,width,height,cleanFringes:p.cleanFringes});}
}
/**
 * World positions for a level's props: from `start`, one every `spacing` px (± `jitter`, deterministic per level),
 * cycling through `kinds`; alternate ones face the other way.
 */
export function propLayout(config,width,seed=1){
  const out=[];let rnd=seed*9301+49297;const next=()=>((rnd=(rnd*9301+49297)%233280)/233280);
  // slots: fixed spots that repeat every `period` px (e.g. the gaps between seat rows of a tiled wall);
  // each one is filled with probability `fill`, cycling through `kinds`.
  if(config.slots){
    const {period,offsets,fill=1}=config.slots;let i=0;
    for(let base=0;base<width+period;base+=period)for(const offset of offsets){
      const x=base+offset;if(x<(config.start??0) || x>width-40 || next()>=fill)continue;
      out.push({kind:config.kinds[i%config.kinds.length],x,flip:config.flip===false?false:i%2===1,offset:Math.round((next()*2-1)*(config.depthJitter??0))});i++;
    }
    return out;
  }
  for(let x=config.start??260,i=0;x<width-80;i++,x+=config.spacing+((next()*2-1)*(config.jitter??0))){
    out.push({kind:config.kinds[i%config.kinds.length],x:Math.round(x),flip:config.flip===false?false:i%2===1,offset:Math.round((next()*2-1)*(config.depthJitter??0))});
  }
  return out;
}
