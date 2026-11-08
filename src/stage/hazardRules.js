// Pure rules for the street hazards (no Phaser), so they can be tested with node --test.
// Holes are ellipses on the floor (x, y = feet). Walkers cannot step into an open manhole; bodies that land in one
// (thrown or knocked down) fall in. Potholes slow walkers and hurt bodies that land on them.
export const HAZARDS={
  hole:{
    pothole:{rx:44,ry:12,damage:35,playerDamage:8,slow:.55,label:'¡AL HUECO!'},
    manhole:{rx:30,ry:10,pad:8,points:200,playerDamage:18,label:'¡AL CAÑO!'},
  },
  // A taxi crosses one floor lane during arena fights; it knocks down the player AND any enemy in that lane.
  taxi:{every:[8000,13000],first:5000,warn:1100,speed:880,width:250,height:104,hitDepth:20,damage:18,enemyDamage:40,aimChance:.6},
};
const sq=v=>v*v;
/** Ellipse test in floor space; `pad` grows the hole (walkers keep their feet off the rim). */
export const insideHole=(hole,x,y,pad=0)=>sq((x-hole.x)/(hole.rx+pad))+sq((y-hole.y)/(hole.ry+pad))<=1;
/** World positions: `arena` (0-based) and x/y as fractions of the arena view and of the floor depth. */
export function placeHoles(spec=[],layout,floor,view=960){
  return spec.filter(h=>HAZARDS.hole[h.kind] && (h.arena??0)<layout.arenas).map(h=>{
    const d=HAZARDS.hole[h.kind];
    return {kind:h.kind,x:Math.round((h.arena??0)*layout.advance+h.x*view),y:Math.round(floor.top+h.y*(floor.bottom-floor.top)),rx:d.rx,ry:d.ry,pad:d.pad??0};
  });
}
/** Nearest point on the (padded) rim along the ray from the centre: walkers slide around the hole. */
export function pushOut(hole,x,y,pad=hole.pad??0){
  const dx=x-hole.x,dy=y-hole.y,k=Math.sqrt(sq(dx/(hole.rx+pad))+sq(dy/(hole.ry+pad)));
  if(k>=1)return {x,y};
  if(k<1e-6)return {x:hole.x+hole.rx+pad,y};
  return {x:hole.x+dx/k*1.001,y:hole.y+dy/k*1.001};
}
/** A crossing car in screen space hits a body (world x) between its previous and current front. */
export function taxiSweeps(previous,current,laneY,body,left,c=HAZARDS.taxi){
  if(Math.abs(body.y-laneY)>=c.hitDepth || (body.z??0)>=40)return false;
  const x=body.x-left,from=Math.min(previous,current)-c.width/2,to=Math.max(previous,current)+c.width/2;
  return x>=from && x<=to;
}
export const nextTaxiDelay=(random,c=HAZARDS.taxi)=>c.every[0]+random()*(c.every[1]-c.every[0]);
