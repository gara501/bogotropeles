/** @typedef {{count:number, activeMs:number, cooldownMs:number, periodMs:number,
 * startRadius:number, blastRadius:number, expandMs:number, perspective:number, flightHeight:number,
 * targetRadius:number, summonFrame:number, colors:readonly string[], shock:{color:number, flash:number},
 * attack:{damage:number, range:number, duration:number, hitAt:number, knockback:number,
 * stun:number, area:boolean, radialKnockback:boolean, summon:string}}} BooksBalance */

/** @type {BooksBalance} Book explosion: lasts activeMs, recharges in cooldownMs (scene's paused combat clock, ms).
 * The books burst outward from where she casts; every enemy the blast front reaches is hit once. */
export const BOOKS = {
  count:8, activeMs:1000, cooldownMs:3000, periodMs:1600,
  startRadius:20, blastRadius:165, expandMs:450, perspective:.48, flightHeight:54,
  targetRadius:18, summonFrame:19,
  colors:['#4e9d51','#a34853','#417ba7','#d1a335'],
  shock:{color:0xffd54a, flash:0xffffff},
  // Regular enemies (minions included) lose at least `enemyShare` of their max energy per blast;
  // bosses take `bossDamage`, more than any normal strike.
  enemyShare:.5, bossDamage:90,
  attack:{damage:20*2.2, range:165, duration:480, hitAt:240, knockback:42,
    stun:600, area:true, radialKnockback:true, summon:'books'},
};

/** Blast front radius at `elapsed` ms: a fast ease-out to blastRadius. */
export function blastRadius(elapsed, balance=BOOKS) {
  const p=Math.max(0,Math.min(1,elapsed/balance.expandMs));
  return balance.startRadius+(balance.blastRadius-balance.startRadius)*(1-(1-p)**3);
}

/** Ground distance from the blast center, with depth stretched back by the perspective. */
export function blastReaches(center, target, radius, balance=BOOKS) {
  return Math.hypot(target.x-center.x,(target.y-center.y)/balance.perspective)<=radius+balance.targetRadius;
}

// Perspective affects the ground footprint; visual elevation never affects contact.
export function positionBook(book, center, angle, radius, balance=BOOKS) {
  book.x=center.x+Math.cos(angle)*radius;
  book.y=center.y+Math.sin(angle)*radius*balance.perspective;
}

export function bookTouches(book, target, radius) {
  return (book.x-target.x)**2+(book.y-target.y)**2<=radius**2;
}

// Only the source's near-pure chroma spill is removed. Denim and skin are muted.
export function isStudentFringe(r,g,b) {
  const high=Math.max(r,g,b),low=Math.min(r,g,b);
  return high>=180 && low<=25 && (high-low)/high>=.9;
}
