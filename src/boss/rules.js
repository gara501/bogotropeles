import { BOSS } from './balance.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function phaseFor(hp) {
  return hp / BOSS.hp > BOSS.phaseThresholds[0] ? 1 : hp / BOSS.hp >= BOSS.phaseThresholds[1] ? 2 : 3;
}
export function slowMultiplier(stacks) { return 1 - Math.min(.4, Math.min(BOSS.paper.maxStacks, stacks) * BOSS.paper.slowPerStack); }
export function inRect(point, rect, padding = 0) {
  return Math.abs(point.x - rect.x) <= rect.w / 2 + padding && Math.abs(point.y - rect.y) <= rect.h / 2 + padding;
}
export function sweptFootprint(previous, current, y, point, width, lane) {
  return point.x >= Math.min(previous, current) - width / 2 - 16
    && point.x <= Math.max(previous, current) + width / 2 + 16 && Math.abs(point.y - y) <= lane;
}

// Keep the top lane completely free of permanent collision. A player can always
// walk horizontally there, then approach the boss along the nearest open column.
export function workSites(floor, player, existing = []) {
  const y = floor.bottom - 12;
  const width=floor.right-floor.left;
  const candidates=[0,2,4,1,3,5].map(index=>floor.left+width*(index+.5)/6)
    .filter(x => Math.abs(player.x - x) > 60 || Math.abs(player.y - y) > 26)
    .map(x=>({x,y}));
  const free=candidates.filter(site=>!existing.some(obstacle=>obstacle.active && Math.abs(obstacle.x-site.x)<62));
  return (free.length?free:candidates).slice(0,3).map((site,index)=>({...site,kind:['hole','cone','fence'][index]}));
}

// Restrict only one column; both adjacent exits are checked against slow movement.
// The floor's upper corridor is not part of any restricted column.
export function picoPlan(floor, player, speed, blocked = []) {
  const w = (floor.right - floor.left) / 6;
  const zones = Array.from({length:6}, (_,i) => ({ x:floor.left + w * (i + .5), y:(floor.top + 32 + floor.bottom) / 2, w, h:floor.bottom - floor.top - 32, number:i+1 }));
  const nearest = clamp(Math.floor((player.x - floor.left) / w), 0, 5);
  const free=zones.map((zone,index)=>({zone,index})).filter(({zone})=>!blocked.some(rect=>Math.abs(zone.x-rect.x)<(zone.w+rect.w)/2 && Math.abs(zone.y-rect.y)<(zone.h+rect.h)/2));
  const restricted=free.length?free.reduce((best,item)=>Math.abs(item.zone.x-player.x)<Math.abs(best.zone.x-player.x)?item:best).index:nearest;
  if(!free.length) {
    // If all columns contain works, restrict only the open strip above their footprints.
    const bottom=Math.min(floor.bottom,...blocked.map(rect=>rect.y-rect.h/2-10));
    for(const zone of zones){zone.h=Math.max(8,bottom-floor.top-32);zone.y=floor.top+32+zone.h/2;}
  }
  const zone = zones[restricted];
  const exits = [zone.x - w / 2 - 20, zone.x + w / 2 + 20].filter(x => x >= floor.left && x <= floor.right)
    .filter(x => !blocked.some(rect => inRect({x,y:player.y}, rect, 18)));
  const verticalEscape = Math.max(0, player.y - (floor.top + 18)) / Math.max(1, speed * .65);
  const horizontalEscape = exits.length ? Math.min(...exits.map(x => Math.abs(x - player.x))) / Math.max(1, speed) : Infinity;
  const windup = Math.max(BOSS.attacks.pico.windup, Math.ceil(Math.min(verticalEscape, horizontalEscape) * 1000 + BOSS.pico.escapeMargin));
  return { zones, restricted, windup };
}

export function availableAttacks({phase, now, readyAt, lastAttack, activeSystems, frozen, distance, random = Math.random}) {
  const allowed = ['pico','works','paper', ...(phase >= 2 ? ['traffic','rain'] : []), ...(phase === 3 ? ['shield'] : [])];
  // At most two hazard systems, including persistent roadworks and weather.
  const pool = allowed.filter(key => key !== lastAttack && now >= (readyAt[key] ?? 0))
    .filter(key => activeSystems.every(system => system === 'rain' || system === 'works') && activeSystems.length < 2)
    .filter(key => !(key === 'traffic' && frozen) && !(key === 'rain' && activeSystems.includes('rain')));
  const weighted = pool.map(key => ({key, weight: key === 'paper' ? (distance > 190 ? 3 : 1) : key === 'shield' ? 1 : 2}));
  let pick = random() * weighted.reduce((sum,item) => sum + item.weight, 0);
  for (const item of weighted) { pick -= item.weight; if (pick <= 0) return item.key; }
  return null;
}
