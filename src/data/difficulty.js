// Difficulty for a run, chosen on the character selection. Multiplies the level's own ladder (src/data/campaign.js:
// hp/speed/damage/pressure of enemies and bosses, gap between waves) and sets the lives per credit.
// `score` keeps rankings fair: easy runs earn fewer points, rush hour more.
export const DIFFICULTIES=[
  {id:'facil',name:'FÁCIL',note:'5 vidas · rivales más blandos y lentos · puntos ×0,75',hp:.75,speed:.9,damage:.65,pressure:.8,gap:1.25,lives:5,score:.75},
  {id:'normal',name:'NORMAL',note:'3 vidas · la Bogotá de siempre',hp:1,speed:1,damage:1,pressure:1,gap:1,lives:3,score:1},
  {id:'hora_pico',name:'HORA PICO',note:'3 vidas · rivales más duros, rápidos y seguidos · puntos ×1,25',hp:1.3,speed:1.12,damage:1.35,pressure:1.3,gap:.8,lives:3,score:1.25},
];
export const DEFAULT_DIFFICULTY='normal';
export const DIFFICULTY_KEY='street-bogota-difficulty-v1';
export const difficultyFor=id=>DIFFICULTIES.find(d=>d.id===id)??DIFFICULTIES.find(d=>d.id===DEFAULT_DIFFICULTY);
/** The level with the difficulty applied on top of its own ladder. */
export function applyDifficulty(level,difficulty=difficultyFor()){
  if(!level || difficulty.id===DEFAULT_DIFFICULTY)return level;
  const scale=(key,factor,from=level)=>from[key]==null?from[key]:from[key]*factor;
  // Survival ramps from `base` every wave: scale it too, or the first wave would erase the difficulty.
  const base=level.base && Object.fromEntries(['hp','speed','damage','pressure','gap'].map(key=>[key,scale(key,difficulty[key],level.base)]));
  return {...level,...(base?{base}:{}),hp:scale('hp',difficulty.hp),speed:scale('speed',difficulty.speed),damage:scale('damage',difficulty.damage),
    pressure:scale('pressure',difficulty.pressure),gap:scale('gap',difficulty.gap),difficulty:difficulty.id};
}
export function loadDifficulty(storage){try{return difficultyFor(storage?.getItem(DIFFICULTY_KEY)).id;}catch{return DEFAULT_DIFFICULTY;}}
export function saveDifficulty(id,storage){try{storage?.setItem(DIFFICULTY_KEY,id);}catch{/* storage blocked */}}
