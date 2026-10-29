import {ARCADE} from '../data/arcade.js';

export function taxiRushPlan(config,random=Math.random){
  const count=config.min+Math.min(config.max-config.min,Math.floor(random()*(config.max-config.min+1)));
  const plan=[];let lanes=[];
  for(let i=0;i<count;i++){
    // Shuffled groups cover every lane; no two consecutive taxis use one lane.
    if(!lanes.length){
      lanes=[0,1,2];for(let j=lanes.length-1;j>0;j--){const k=Math.min(j,Math.floor(random()*(j+1)));[lanes[j],lanes[k]]=[lanes[k],lanes[j]];}
      if(plan.length && lanes[0]===plan.at(-1).lane)[lanes[0],lanes[1]]=[lanes[1],lanes[0]];
    }
    const warnAt=config.leadIn+i*config.spacing;
    plan.push({lane:lanes.shift(),direction:random()<.5?1:-1,warnAt,launchAt:warnAt+config.warning});
  }
  return plan;
}

export function taxiTouches(previousX,currentX,laneY,player,scrollX,config){
  const x=player.x-scrollX;
  return (player.z??0)<config.avoidHeight && Math.abs(player.y-laneY)<config.hitDepth
    && x+ARCADE.body.halfWidth>=Math.min(previousX,currentX)-config.width/2
    && x-ARCADE.body.halfWidth<=Math.max(previousX,currentX)+config.width/2;
}
