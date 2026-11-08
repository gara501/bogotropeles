const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};

/** A smooth world centreline, viewed along the runner's current tangent.
 * At contact (z=0), every lane stays anchored: turns never shove the player. */
export function trailOffset(distance,z){
  if(!Number.isFinite(z) || z<=0)return 0;
  const k=Math.PI*2/168,amplitude=180;
  const centre=s=>amplitude*(Math.sin(s*k)+.28*Math.sin(s*k*.5+.6));
  const tangent=amplitude*k*(Math.cos(distance*k)+.14*Math.cos(distance*k*.5+.6));
  const relative=centre(distance+z)-centre(distance)-tangent*z;
  return clamp(relative/(1+z/12)*Math.min(1,60/z),-112,112);
}

export function trailSection(distance){
  const rock=smooth(300,380,distance)*(1-smooth(630,720,distance));
  const label=distance<320?'BOSQUE':distance<690?'ESCALINATA':distance<940?'LAS VELAS':'SANTUARIO';
  return {rock,label};
}

export function trailRow(y,distance){
  const depth=Math.max(.001,(y-156)/314),z=12*(1/depth-1);
  return {depth,z,width:610*depth,centre:480+trailOffset(distance,z)};
}

// Fixed positions on the inner shoulders, blocking the outer walking lanes. No following
// or walking motion: their apparent approach comes entirely from the runner.
export const TRAIL_VENDORS=[
  {at:60,side:-1,variant:0},{at:130,side:1,variant:1},{at:205,side:-1,variant:2},{at:270,side:1,variant:3},
  {at:720,side:1,variant:3},{at:765,side:-1,variant:0},{at:805,side:1,variant:2},{at:845,side:-1,variant:1},
  {at:880,side:1,variant:0},{at:915,side:-1,variant:3},{at:955,side:1,variant:1},{at:1000,side:-1,variant:2},
].map((vendor,i)=>({...vendor,id:`vendor-${i}`,kind:'vendor',lane:vendor.side*1.22,hitWidth:.45}));

export function cliffObjects(){
  return [
    ...Array.from({length:14},(_,i)=>({offset:i*64/14,lane:2.85+(i%2)*.08,frame:i%2,height:395+(i%3)*14})),
    // boulders rest right against the kerb so they always sit on the ridge, never on the treetops below
    ...Array.from({length:10},(_,i)=>({offset:i*6.4+2,lane:-(2.42+(i%3)*.06),frame:2+i%2,height:120+(i%3)*14})),
  ];
}

// Railing and kerb in lane units (projectHiker): stairs end at ±1.69, kerb to ±2.2, posts on it at ±1.98.
export const RAILING={post:2.6,lane:1.98,inner:1.69,outer:2.2,lip:0,height:122,top:.93,mid:.68,far:600};

// Fixed jump features (metres along the trail). 'gap': broken stairs across the whole trail, must be
// crossed in the air. 'log': a fallen trunk, jump it or (if it leaves a lane free) steer around it.
export const TRAIL_JUMPS=[
  {at:96,kind:'log',lanes:[-1,0,1]},
  {at:315,kind:'gap',length:6},{at:360,kind:'log',lanes:[-1,0,1]},{at:410,kind:'gap',length:6.5},
  {at:455,kind:'log',lanes:[-1,0]},{at:505,kind:'gap',length:7},{at:555,kind:'log',lanes:[-1,0,1]},
  {at:600,kind:'gap',length:7},{at:645,kind:'log',lanes:[0,1]},{at:690,kind:'gap',length:7},
  {at:785,kind:'log',lanes:[-1,0,1]},{at:862,kind:'gap',length:6},{at:935,kind:'log',lanes:[0]},{at:975,kind:'gap',length:6.5},
].map((jump,i)=>({...jump,id:`jump-${i}`,length:jump.length??1.2}));
/** Lateral span of a log in lane units (outer lanes reach the kerb). */
export const logSpan=log=>[Math.min(...log.lanes)===-1?-1.69:Math.min(...log.lanes)-.5,Math.max(...log.lanes)===1?1.69:Math.max(...log.lanes)+.5];
