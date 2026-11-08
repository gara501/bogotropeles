import officeUrl from './players/player_1_vuvuzela.png?url';
import studentUrl from './players/player_2_vuvuzela.png?url';
import teleperformanUrl from './players/player_3_vuvuzela.png?url';
import gymbroUrl from './players/player_4_vuvuzela.png?url';
import magolitaUrl from './players/player_5_vuvuzela.png?url';
import officeRunUrl from './players/player_1_vuvuzela_run.png?url';
import magolitaWalkUrl from './players/player_5_vuvuzela_walk.png?url';
import teleperformanWalkUrl from './players/player_3_vuvuzela_walk.png?url';
import {prepareSheet,needsSource} from './spriteSheets.js';
import {ARMED_RUN,armedRunTexture} from './armedRun.js';

export const VUVUZELA_PLAYERS={office:officeUrl,student:studentUrl,teleperforman:teleperformanUrl,gymbro:gymbroUrl,magolita:magolitaUrl};
export const armedTexture=character=>`${character}-vuvuzela`;
// Armed run strips (cycle data lives in armedRun.js).
const ARMED_RUN_URLS={office:officeRunUrl,magolita:magolitaWalkUrl,teleperforman:teleperformanWalkUrl};
// Hip pivots measured on each source sheet. Weapons and extended arms never determine the body pivot.
const HIP_ANCHORS={
  office:[270,750,1280,275,780,1285,260,770,1270],
  student:[310,785,1275,310,790,1275,285,810,1280],
  teleperforman:[275,770,1260,280,790,1255,270,760,1265],
  gymbro:[300,770,1255,290,780,1255,285,795,1250],
  magolita:[280,770,1280,270,790,1290,280,805,1280],
};

export function preloadVuvuzelaPlayer(scene,character=scene.characterKey){
  const url=VUVUZELA_PLAYERS[character],key=armedTexture(character);
  if(url && !scene.textures.exists(key) && needsSource(scene,`${key}-source`))scene.load.image(`${key}-source`,url);
  const run=ARMED_RUN[character],runKey=armedRunTexture(character);
  if(run && !scene.textures.exists(runKey) && needsSource(scene,`${runKey}-source`))scene.load.image(`${runKey}-source`,ARMED_RUN_URLS[character]);
}

/** Nine poses: ready, four walking frames, windup, swing, impact and recovery. */
export function prepareVuvuzelaPlayer(scene,character=scene.characterKey){
  const key=armedTexture(character);
  if(!VUVUZELA_PLAYERS[character])return;
  // Connected alpha silhouettes preserve complete horns and shoes even across nominal grid boundaries.
  if(!scene.textures.exists(key))prepareSheet(scene,key,{rows:[3,3,3],frameAnchors:HIP_ANCHORS[character],trimFrames:true});
  const run=ARMED_RUN[character],runKey=armedRunTexture(character);
  if(run && !scene.textures.exists(runKey) && scene.textures.exists(`${runKey}-source`))
    prepareSheet(scene,runKey,{rows:[run.poses],trimFrames:true,
      frameRects:Array.from({length:run.poses},(_,i)=>({x:i*(run.cellWidth??128),y:0,width:run.cellWidth??128,height:run.cellHeight??128,
        anchor:i*(run.cellWidth??128)+(run.anchor??72)})),
      frameScales:Object.fromEntries(Array.from({length:run.poses},(_,i)=>[i,run.scale]))});
}
