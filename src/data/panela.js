import itemUrl from './items/panela.png?url';
import office from './players/player_1_panela.png?url';
import student from './players/player_2_panela.png?url';
import teleperforman from './players/player_3_panela.png?url';
import gymbro from './players/player_4_panela.png?url';
import magolita from './players/player_5_panela.png?url';
import {needsSource,prepareSheet,prepareEffects} from './spriteSheets.js';
import {PANELA_TEXTURE} from '../game/Panela.js';

export const PANELA_PLAYERS={office,student,teleperforman,gymbro,magolita};
export const PANELA_ATLAS={url:itemUrl,frames:{whole:[82,150,382,257],flight:[588,102,353,321],crack:[1024,0,512,512],
  break1:[0,512,512,512],break2:[512,512,512,512],crumbs:[1024,512,512,512]}};
const CUTS={
  office:[[136,38,264,318],[625,33,276,321],[1155,34,249,322],[129,368,275,323],[637,368,281,323],[1146,370,285,321],[106,699,393,303],[578,703,426,299],[1145,701,265,303]],
  student:[[164,15,273,324],[620,15,292,325],[1118,15,230,325],[143,361,309,328],[645,359,295,329],[1113,363,306,326],[98,686,362,320],[552,697,456,307],[1104,684,330,322]],
  teleperforman:[[144,16,266,324],[631,17,259,323],[1142,18,212,321],[144,357,280,317],[659,357,221,315],[1116,358,291,319],[110,689,314,305],[556,689,419,305],[1106,688,284,308]],
  gymbro:[[158,22,282,327],[613,22,283,327],[1104,22,249,327],[127,361,321,332],[627,364,281,328],[1091,378,319,314],[82,704,366,298],[568,706,430,296],[1086,703,309,299]],
  magolita:[[127,16,267,316],[611,15,280,320],[1118,15,284,318],[120,356,285,317],[633,355,265,320],[1140,350,297,325],[95,686,329,319],[582,698,452,310],[1139,688,296,319]],
};
const ANCHORS={
  office:[265,760,1275,270,775,1285,265,760,1270],
  student:[310,785,1240,310,795,1275,270,785,1280],
  teleperforman:[275,770,1250,285,785,1250,265,755,1250],
  gymbro:[300,770,1255,290,780,1255,285,795,1250],
  magolita:[280,770,1280,270,790,1290,280,805,1280],
};
export const PANELA_POSES=Object.fromEntries(Object.entries(CUTS).map(([key,rects])=>[key,{isolateFrames:true,
  frameRects:rects.map(([x,y,width,height])=>({x,y,width,height})),frameAnchors:ANCHORS[key]}]));
export function preloadPanela(scene){
  if(!scene.textures.exists(PANELA_TEXTURE) && needsSource(scene,`${PANELA_TEXTURE}-source`))scene.load.image(`${PANELA_TEXTURE}-source`,itemUrl);
}
export function preparePanela(scene){prepareEffects(scene,PANELA_TEXTURE,PANELA_ATLAS);}
export function preloadPanelaPlayer(scene,character=scene.characterKey){
  const url=PANELA_PLAYERS[character],key=`${character}-panela`;
  if(url && !scene.textures.exists(key) && needsSource(scene,`${key}-source`))scene.load.image(`${key}-source`,url);
}
export function preparePanelaPlayer(scene,character=scene.characterKey){
  if(PANELA_PLAYERS[character])prepareSheet(scene,`${character}-panela`,{rows:[3,3,3],trimFrames:true,...PANELA_POSES[character]});
}
