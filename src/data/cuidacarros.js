import url from './enemies/cuidacarros.png?url';
import {sequence} from './spriteSheets.js';

export const CUIDACARROS={name:'EL CUIDACARROS',url,rows:[4,4,4,4],height:106,speed:95,hp:100,range:0,damage:0,idle:0,
  trimFrames:true,isolateFrames:true,
  frameRects:Array.from({length:16},(_,i)=>({x:i%4*256,y:Math.floor(i/4)*256,width:256,height:256,anchor:i%4*256+128})),
  callReinforcements:{first:3600,windup:1000,cooldown:6500,recover:500,interrupt:1800,keepDistance:150},
  animations:{idle:[0],walk:sequence(0,3),signal:sequence(4,7),hurt:sequence(8,11),defeat:sequence(12,15)},
};
