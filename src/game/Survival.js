// Survival ("Trancón infinito"): endless waves on one screen of Calles del centro. Every wave is a little larger and
// the street a little meaner; one life, no continues. Pure rules (survivalLevel, rampFor, waveCount) are testable.
export const SURVIVAL={
  combat:5,lives:1,total:9999,
  // Regular enemies of the later streets (no crossing riders, no bosses): their sheets load with the level.
  pool:['walker','thrower','sweeper','belly','yulitza','motorata','guitarist','vendor','chain','guard','leash','brawler','fan'],
  // Per cleared wave: multipliers on top of the street's own ladder, capped.
  ramp:{hp:.045,damage:.03,speed:.012,pressure:.035,maxHp:3,maxDamage:2.4,maxSpeed:1.45,maxPressure:2.6,gap:.96,minGap:280},
  healEvery:5,heal:30,waveBonus:40,recordKey:'street-bogota-survival-v1',
};
/** The survival level: the street's art and hazards, a shuffled mixed pool, a single locked arena. */
export function survivalLevel(base,random=Math.random){
  const pool=[...SURVIVAL.pool];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return {...base,name:'SUPERVIVENCIA · TRANCÓN INFINITO',mode:'survival',survival:true,total:SURVIVAL.total,boss:null,
    enemies:pool,crossingEnemies:[],taxiRush:null,wavesPerArena:Infinity,collectible:null,
    hp:.8,speed:1,damage:.9,pressure:.9,gap:1100,base:{hp:.8,speed:1,damage:.9,pressure:.9,gap:1100}};
}
/** Enemies in wave `n` (0-based): 2, then one more every three waves, up to 6. */
export const waveCount=n=>Math.min(6,2+Math.floor(n/3));
/** Level stats after `n` cleared waves. */
export function rampFor(base,n,r=SURVIVAL.ramp){
  return {hp:Math.min(r.maxHp,base.hp*(1+r.hp*n)),damage:Math.min(r.maxDamage,base.damage*(1+r.damage*n)),
    speed:Math.min(r.maxSpeed,base.speed*(1+r.speed*n)),pressure:Math.min(r.maxPressure,base.pressure*(1+r.pressure*n)),
    gap:Math.max(r.minGap,base.gap*r.gap**n)};
}
export function loadSurvivalRecord(storage){
  try{const r=JSON.parse(storage?.getItem(SURVIVAL.recordKey)??'null');return r && Number.isFinite(r.wave)?r:{wave:0,score:0,character:''};}
  catch{return {wave:0,score:0,character:''};}
}
/** Saves when the run beat the best wave (score breaks ties). Returns {record, isNew}. */
export function saveSurvivalRecord(entry,storage){
  const record=loadSurvivalRecord(storage),isNew=entry.wave>record.wave || (entry.wave===record.wave && entry.score>record.score);
  if(isNew)try{storage?.setItem(SURVIVAL.recordKey,JSON.stringify(entry));}catch{/* storage blocked */}
  return {record:isNew?entry:record,isNew};
}
/** Scene side: ramps the level when a wave spawns, heals every few waves, announces the wave. */
export class Survival {
  constructor(scene){this.scene=scene;this.wave=0;}
  /** Called by WaveDirector right before wave `n` (0-based) spawns. */
  onWave(n){
    const s=this.scene;this.wave=n+1;
    Object.assign(s.level,rampFor(s.level.base,n));
    if(n>0){s.addScore?.(SURVIVAL.waveBonus*n);}
    if(n>0 && n%SURVIVAL.healEvery===0 && s.health>0){
      s.health=Math.min(100,s.health+SURVIVAL.heal);if(s.healthBar)s.healthBar.width=s.health*2;this.banner(`OLEADA ${this.wave} · +${SURVIVAL.heal} VIDA`,'#6fd36b');
    }else this.banner(`OLEADA ${this.wave}`,'#ffd36b');
  }
  banner(text,color){
    const s=this.scene;if(!s.add?.text)return;
    const label=s.add.text(480,150,text,{fontFamily:"'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",fontSize:'44px',fontStyle:'bold',color,stroke:'#14141a',strokeThickness:7})
      .setOrigin(.5).setScrollFactor(0).setDepth(1004).setAlpha(0);
    s.tweens?.add?.({targets:label,alpha:1,y:140,duration:220,onComplete:()=>s.tweens?.add?.({targets:label,alpha:0,duration:400,delay:900,onComplete:()=>label.destroy()})});
  }
}
