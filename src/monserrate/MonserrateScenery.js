import {projectHiker} from './MonserrateRun.js';

// The centre above the trail stays free for the sanctuary. Foreground foliage
// uses world distance, so it stops on pause/death and slows with a collision.
export const MONSERRATE_HUD={left:{x:12,y:10,width:258,height:78},right:{x:690,y:10,width:258,height:122},progressWidth:230};
export function mountainTransform(progress){
  const scale=1+Math.max(0,Math.min(1,progress))*.18;
  return {x:480,y:24,scale,originY:24/540};
}
export function forestObjects(){
  const objects=[];
  for(const side of [-1,1]){
    for(let i=0;i<8;i++)objects.push({side,offset:i*8+(side===1?3:0),lane:side*(3.1+(i%3)*.12),frame:i%3,height:310+(i%3)*24});
    for(let i=0;i<12;i++)objects.push({side,offset:i*64/12+(side===1?1.8:0),lane:side*(2.75+(i%3)*.1),frame:3+i%3,height:96+(i%3)*13});
  }
  return objects;
}
export function projectForest(object,distance){
  const z=((object.offset-distance)%64+64)%64-5;
  const p=projectHiker(object.lane,z,distance);
  return {...p,z,alpha:Math.max(0,Math.min(1,(59-z)/10)),height:object.height*p.scale};
}
