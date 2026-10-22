import office from './cycling/player_1.png?url';
import student from './cycling/player_2.png?url';
import teleperforman from './cycling/player_3.png?url';
import gymbro from './cycling/player_4.png?url';
import magolita from './cycling/player_5.png?url';
import obstacles from './cycling/obstacles.png?url';
import dog from './cycling/dog.png?url';
import guardian from './cycling/guardian.png?url';
import background from '../scenes/ciclovia/background.png?url';
import {prepareSheet} from './spriteSheets.js';

export const CYCLING_PLAYERS={office,student,teleperforman,gymbro,magolita};
export const CYCLING_ASSETS={'cycling-background':background,'cycling-npcs':obstacles,'cycling-dog':dog,'cycling-guardian':guardian,
  ...Object.fromEntries(Object.entries(CYCLING_PLAYERS).map(([key,url])=>[`cycling-${key}`,url]))};
export function preloadCycling(scene){
  for(const [key,url] of Object.entries(CYCLING_ASSETS))if(!scene.textures.exists(key))scene.load.image(key==='cycling-background'?key:`${key}-source`,url);
}
export function prepareCycling(scene){
  for(const key of Object.keys(CYCLING_ASSETS).filter(k=>k!=='cycling-background')){
    prepareSheet(scene,key,{rows:key==='cycling-npcs'?[4,4,4]:[4,4]});
    if(scene.textures.exists(`${key}-source`))scene.textures.remove(`${key}-source`);
  }
  if(!scene.textures.exists('cycling-hole')){
    const t=scene.textures.createCanvas('cycling-hole',90,38),c=t.context;
    c.fillStyle='#918579';c.beginPath();c.moveTo(3,17);for(const p of [[16,6],[32,9],[43,2],[63,8],[76,5],[88,20],[75,29],[56,34],[38,31],[19,35]])c.lineTo(...p);c.closePath();c.fill();
    c.fillStyle='#15191d';c.beginPath();c.ellipse(45,20,34,11,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#4b4c46';c.lineWidth=3;c.beginPath();c.moveTo(15,24);c.lineTo(30,14);c.lineTo(61,12);c.stroke();t.refresh();
  }
}
