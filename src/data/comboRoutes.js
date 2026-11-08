// Shared inputs, character-specific artwork. Prefixes may finish AND branch.
export const COMBO_ROUTES = [
  {id:'ppp', notation:'PPP', inputs:['punch','punch','punch'], animations:['chainPunch1','chainPunch2','chainPunch3']},
  {id:'pppkk', notation:'PPP + KK', inputs:['punch','punch','punch','kick','kick'], animations:['chainPunch1','chainPunch2','chainPunch3','chainKick2','chainKick3']},
  {id:'kkk', notation:'KKK', inputs:['kick','kick','kick'], animations:['chainKick1','chainKick2','chainKick3']},
  {id:'kkkDownK', notation:'KKK + ABAJO K', inputs:['kick','kick','kick','lowKick'], animations:['chainKick1','chainKick2','chainKick3','chainSweep']},
  {id:'ppkkUpP', notation:'PP + KK + ARRIBA P', inputs:['punch','punch','kick','kick','upperPunch'], animations:['chainPunch1','chainPunch2','chainKick1','chainKick2','chainUppercut']},
];
// Martial-arts cadence: the opening strikes of a route come out at normal speed; the strike that COMPLETES a route
// (3rd punch of PPP, last kick of PPP + KK, the sweep, the uppercut…) bursts out faster and hits harder.
export const COMBO_FINISH={speed:1.6,damage:1.25};
export const comboSpeed=(stage,finisher=false)=>finisher?COMBO_FINISH.speed:1;
export function matchingRoutes(path){return COMBO_ROUTES.filter(r=>path.every((input,i)=>r.inputs[i]===input));}
export function sequenceOptions(data){
  if(!data?.path || data.combo===false || data.comboBroken)return [];
  return [...new Set(matchingRoutes(data.path).map(r=>r.inputs[data.path.length]).filter(Boolean))];
}
export function directionalStrike(type,dy){return type==='punch' && dy<0?'upperPunch':type==='kick' && dy>0?'lowKick':type;}
