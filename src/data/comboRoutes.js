// Shared PPKKK plus explicitly enabled character-specific routes.
export const COMBO_ROUTES = [
  {id:'ppkkk', notation:'PPKKK', inputs:['punch','punch','kick','kick','kick'], animations:['chainPunch1','chainPunch2','chainKick1','chainKick2','chainKick3']},
];
export const STUDENT_KICK_ROUTE={id:'kkk',notation:'KKK',inputs:['kick','kick','kick'],animations:['chainStudentKick1','chainStudentKick2','chainStudentCircleKick']};
export const OFFICE_PUNCH_ROUTE={id:'ppp',notation:'PPP',inputs:['punch','punch','punch'],animations:['chainGomeloPunch1','chainGomeloPunch2','chainGomeloPunch3']};
export const TELEPERFORMAN_PUNCH_ROUTE={id:'ppp',notation:'PPP',inputs:['punch','punch','punch'],animations:['chainPunch1','chainPunch2','chainPunch3']};
export const TELEPERFORMAN_KICK_ROUTE={id:'kkk',notation:'KKK',inputs:['kick','kick','kick'],animations:['chainPhoneRise','chainPhoneSpin','chainPhoneSlam']};
export const routesFor=character=>Array.isArray(character?.comboRoutes)?character.comboRoutes:COMBO_ROUTES;
export const routeAnimations=(character,route)=>character.comboRouteAnimations?.[route.id]??route.animations;
// Only the final strike of a route bursts out faster and harder.
export const COMBO_FINISH={speed:1.6,damage:1.25};
export const comboSpeed=(stage,finisher=false)=>finisher?COMBO_FINISH.speed:1;
export function matchingRoutes(path,character){return routesFor(character).filter(r=>path.every((input,i)=>r.inputs[i]===input));}
export function sequenceOptions(data,character){
  if(!data?.path || data.combo===false || data.comboBroken)return [];
  return [...new Set(matchingRoutes(data.path,character).map(r=>r.inputs[data.path.length]).filter(Boolean))];
}
// Joystick depth movement must not turn P/K into retired directional combo commands.
export function directionalStrike(type,dy){return type;}
