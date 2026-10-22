export const BOSS_CORNER={edge:120,hits:2,windowMs:1400,pinMs:900,pressureRange:180,depth:48,
  durationMs:600,height:64,landingGuardMs:180,cooldownMs:900};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const nearBossCorner=(actor,floor)=>actor.x>=floor.left && actor.x<=floor.right
  && Math.min(actor.x-floor.left,floor.right-actor.x)<=BOSS_CORNER.edge;

/** Land inside the arena, over/past the attacker, instead of hopping backwards into a wall. */
export function bossEscapeTarget(actor,player,floor){
  const side=actor.x-floor.left<=floor.right-actor.x?1:-1;
  const margin=Math.min(170,(floor.right-floor.left)*.23);
  const x=side>0?Math.max(actor.x+260,player.x+220):Math.min(actor.x-260,player.x-220);
  const depth=player.y>(floor.top+floor.bottom)/2?-1:1;
  return {x:clamp(x,floor.left+margin,floor.right-margin),y:clamp(player.y+depth*42,floor.top+8,floor.bottom-8)};
}
