import chivaUrl from '../scenes/chiva.png?url';
import costeUrl from '../scenes/coste.png?url';
import {prepareSheet,needsSource} from './spriteSheets.js';
import {CHIVA_CROWD} from './chivaCrowd.js';

const CHIVA_RECTS=[[22,93,479,234],[523,93,479,234],[23,378,478,237],[523,379,480,236],
  [17,668,484,236],[518,666,485,238],[21,960,480,238],[518,974,485,224],[21,1282,487,211],[527,1326,477,167]];
const COSTE_RECTS=[[79,9,231,360],[438,9,207,360],[783,9,220,361],[1168,16,200,353],
  [90,370,197,359],[436,374,210,355],[771,404,290,320],[1096,439,323,294],
  [30,738,330,322],[410,776,217,284],[780,737,260,323],[1134,776,217,283]];

export function preloadChivaBonus(scene){
  for(const [key,url] of [['bonus-chiva',chivaUrl],['bonus-coste',costeUrl],...CHIVA_CROWD.map(npc=>[npc.key,npc.url])])
    if(!scene.textures.exists(key) && needsSource(scene,`${key}-source`))scene.load.image(`${key}-source`,url);
}
export function prepareChivaBonus(scene){
  for(const npc of CHIVA_CROWD){
    prepareSheet(scene,npc.key,{rows:[4,4]});
    if(scene.textures.exists(`${npc.key}-source`))scene.textures.remove(`${npc.key}-source`);
  }
  const rects=(entries,anchors)=>entries.map(([x,y,width,height],i)=>({x,y,width,height,anchor:anchors[i]}));
  prepareSheet(scene,'bonus-chiva',{rows:[2,2,2,2,2],trimFrames:true,
    frameRects:rects(CHIVA_RECTS,[262,763,262,763,262,763,262,763,262,763])});
  prepareSheet(scene,'bonus-coste',{rows:[4,4,4],trimFrames:true,
    frameRects:rects(COSTE_RECTS,[195,540,894,1260,195,540,910,1260,195,520,896,1260])});
}
