import url from './bosses/don_pacho_plomo.png?url';
import carUrl from './bosses/pacho_camioneta.png?url';
import {prepareCutout,needsSource} from './spriteSheets.js';

// Durations are simulation frames (60 Hz); healing is interruptible until contact.
export const PACHO={
  below:.5,speedMultiplier:1.5,cooldownMultiplier:.65,rest:30,hurt:18,rage:42,
  entry:{drive:110,exit:42,laugh:70,width:440,height:166,parkOffset:200,offscreen:300,floorOffset:5,stepX:75,stepY:58},
  hop:{startup:18,air:42,height:100,distance:250,margin:65},
  pistol:{startup:24,interval:22,count:3,recovery:20,flash:4,speed:550,damage:10,width:22,height:6,lift:78,offset:50,texture:'pacho-bullet'},
  machine:{startup:18,interval:7,count:10,recovery:24,flash:3,speed:660,damage:7,width:26,height:6,lift:78,offset:58,texture:'pacho-bullet'},
  heal:{fraction:.1,contact:75,frames:110,cooldown:720,interruptCooldown:300,firstDelay:240},
  poses:{idle:0,laugh:3,crouch:4,takeoff:5,air:6,land:7,pistolAim:9,pistolFire:10,machineDraw:12,machineAim:13,machineFire:14,healPrepare:16,heal:17},
};
export const PACHO_SPRITE={name:'DON PACHO PLOMO',url,rows:[4,4,4,4,4],height:120,speed:210,hp:2900,range:250,damage:12,idle:0,boss:true,pacho:PACHO,
  trimFrames:true,isolateFrames:true,keepDetachedFrames:[10,14,15,17],
  frameRects:[
    [49,4,175,284],[318,7,186,286],[592,6,207,287],[869,7,253,290],
    [42,349,186,172],[316,297,186,225],[600,283,200,194],[889,338,214,183],
    [29,513,203,287],[287,518,265,282],[577,519,296,281],[886,528,216,272],
    [26,799,219,273],[283,800,235,272],[574,801,304,271],[902,809,212,263],
    [27,1072,197,295],[312,1073,191,294],[575,1096,219,264],[789,1258,327,103],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([132,404,669,990,135,416,694,986,128,373,665,990,131,379,668,997,125,393,665,950].map((x,i)=>[i,x])),
  animations:{idle:[0],walk:[1,2],attack:[8,9,10,11],hurt:[18],defeat:[19]},
};
export const PACHO_CAR_RECTS=[[280,0,1180,450],[280,450,1180,437]];
export function preloadPacho(scene){if(needsSource(scene,'pacho-car-source'))scene.load.image('pacho-car-source',carUrl);}
export function preparePacho(scene){
  PACHO_CAR_RECTS.forEach(([x,y,width,height],i)=>prepareCutout(scene,`pacho-car-${i?'open':'closed'}`,'pacho-car-source',{x,y,width,height}));
  if(!scene.textures.exists('pacho-bullet')){
    const t=scene.textures.createCanvas('pacho-bullet',26,6),c=t.context;
    c.fillStyle='#ff8d29';c.fillRect(0,1,26,4);c.fillStyle='#fff8ba';c.fillRect(10,2,16,2);t.refresh();
  }
}
