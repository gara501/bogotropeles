import office from './players/player_1_super.png?url';
import student from './players/player_2_super.png?url';
import teleperforman from './players/player_3_super.png?url';
import gymbro from './players/player_4_super.png?url';
import magolita from './players/player_5_super.png?url';
import {needsSource,prepareSheet} from './spriteSheets.js';
export const SUPER_PLAYERS={office,student,teleperforman,gymbro,magolita};
const CUTS={
  office:[[65,73,402,455],[592,146,370,382],[1082,59,391,469],[28,540,455,451],[513,540,526,451],[1091,547,407,444]],
  student:[[92,46,391,438],[592,103,386,381],[1085,39,384,445],[33,530,482,437],[553,529,476,439],[1105,531,404,436]],
  teleperforman:[[70,106,363,413],[606,161,336,358],[1121,82,351,437],[48,566,453,409],[537,551,517,425],[1126,569,366,408]],
  gymbro:[[81,57,407,441],[574,136,389,362],[1063,40,397,458],[44,535,492,434],[543,533,485,436],[1080,542,414,425]],
  magolita:[[74,43,379,463],[582,129,366,377],[1098,37,383,470],[46,526,463,458],[541,527,506,457],[1107,537,413,447]],
};
const ANCHORS={office:[265,780,1280,265,780,1280],student:[315,790,1280,290,790,1290],
  teleperforman:[270,780,1285,270,780,1280],gymbro:[290,780,1280,285,785,1295],magolita:[270,775,1280,280,785,1300]};
export const SUPER_POSES=Object.fromEntries(Object.entries(CUTS).map(([key,rects])=>[key,{rows:[3,3],trimFrames:true,isolateFrames:true,
  frameRects:rects.map(([x,y,width,height])=>({x,y,width,height})),frameAnchors:ANCHORS[key]}]));
export function preloadSuperPlayer(scene,character=scene.characterKey){
  const key=`${character}-super`,url=SUPER_PLAYERS[character];
  if(url && !scene.textures.exists(key) && needsSource(scene,`${key}-source`))scene.load.image(`${key}-source`,url);
}
export function prepareSuperPlayer(scene,character=scene.characterKey){
  if(SUPER_PLAYERS[character])prepareSheet(scene,`${character}-super`,SUPER_POSES[character]);
}
