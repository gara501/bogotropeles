import officeHorn from './players/office_vuvuzela_motion_v2.png?url';
import officePanela from './players/office_panela_motion_v2.png?url';
import studentHorn from './players/student_vuvuzela_motion_v2.png?url';
import studentPanela from './players/student_panela_motion_v2.png?url';
import teleperformanHorn from './players/teleperforman_vuvuzela_motion_v2.png?url';
import teleperformanPanela from './players/teleperforman_panela_motion_v2.png?url';
import gymbroHorn from './players/gymbro_vuvuzela_motion_v2.png?url';
import gymbroPanela from './players/gymbro_panela_motion_v2.png?url';
import magolitaHorn from './players/magolita_vuvuzela_motion_v2.png?url';
import magolitaPanela from './players/magolita_panela_motion_v2.png?url';
import {ARMED_RUN,armedRunTexture} from './armedRun.js';
import {needsSource,prepareSheet} from './spriteSheets.js';

export const HELD_LOCOMOTION={
  office:{vuvuzela:officeHorn,panela:officePanela},student:{vuvuzela:studentHorn,panela:studentPanela},
  teleperforman:{vuvuzela:teleperformanHorn,panela:teleperformanPanela},gymbro:{vuvuzela:gymbroHorn,panela:gymbroPanela},
  magolita:{vuvuzela:magolitaHorn,panela:magolitaPanela},
};
export function preloadHeldLocomotion(scene,character,item){
  const key=armedRunTexture(character,item),url=HELD_LOCOMOTION[character]?.[item];
  if(url && !scene.textures.exists(key) && needsSource(scene,`${key}-source`))scene.load.image(`${key}-source`,url);
}
export function prepareHeldLocomotion(scene,character,item){
  const key=armedRunTexture(character,item),run=ARMED_RUN[character];
  if(!run || scene.textures.exists(key) || !scene.textures.exists(`${key}-source`))return;
  prepareSheet(scene,key,{rows:[run.poses],trimFrames:true,
    frameRects:Array.from({length:run.poses},(_,i)=>({x:i*256,y:0,width:256,height:256,anchor:i*256+128})),
  });
}
