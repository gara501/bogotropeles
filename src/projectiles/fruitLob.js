const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

/** Choose once during windup, so the held fruit and the released projectile agree. */
export function chooseFruitThrow(config,random=Math.random){
  if(!config.fruit)return config;
  return random()<config.watermelonChance?{...config,...config.watermelon,fruit:'watermelon'}:config;
}

/** Lock the target on release; movement after release lets the player dodge. */
export function createFruitFlight(start,player,config,floor){
  const targetX=clamp(player.x,floor.left,floor.right),targetY=clamp(player.y,floor.top,floor.bottom);
  return {startX:start.x,startY:start.y,targetX,targetY,elapsed:0,
    duration:clamp(Math.hypot(targetX-start.x,targetY-start.y)/config.speed,.55,1.35),
    lift:config.lift,arc:config.arc};
}

export function fruitPosition(flight,dt){
  flight.elapsed+=dt;
  const t=clamp(flight.elapsed/flight.duration,0,1);
  const x=flight.startX+(flight.targetX-flight.startX)*t;
  const groundY=flight.startY+(flight.targetY-flight.startY)*t;
  return {x,groundY,y:groundY-flight.lift*(1-t)-flight.arc*4*t*(1-t),landed:t===1};
}

export function fruitHitsPlayer(flight,player,config,jumpHeight=0){
  return jumpHeight<40 && Math.abs(player.x-flight.targetX)<=config.radius+16 &&
    Math.abs(player.y-flight.targetY)<=config.depth+10;
}
