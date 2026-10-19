/** @typedef {'pico'|'works'|'traffic'|'rain'|'paper'|'shield'} BossAttack */
/** @typedef {{label:string, windup:number, duration:number, recovery:number, cooldown:number, damage:number}} AttackConfig */
/** @type {{hp:number, speed:number, entry:number, transition:number, phaseThresholds:number[], phaseRest:number[], melee:AttackConfig & {range:number,lane:number}, attacks:Record<BossAttack,AttackConfig>, pico:{immobilize:number,escapeMargin:number}, works:{limit:number,holeCooldown:number,coneHp:number,fenceHp:number}, paper:{speed:number,lifetime:number,maxStacks:number,slowPerStack:number,shakePresses:number,volleyCount:number,shotInterval:number,projectileLifetime:number}, rain:{guard:number}, traffic:{speed:number,barrierDuration:number,escapeMargin:number,vehicles:Record<string,{width:number,height:number}>}}} */
export const BOSS = {
  attackPoses:{melee:23,pico:6,works:10,traffic:14,rain:18,paper:22,shield:26},
  hp: 900, speed: 150, entry: 1800, transition: 1500,
  phaseThresholds: [.70, .35], phaseRest: [1700, 1300, 1000],
  melee: { label:'PUÑO', windup:480, duration:180, recovery:750, cooldown:1800, damage:10, range:78, lane:26 },
  attacks: {
    pico: { label: 'PICO Y PLACA', windup: 2000, duration: 1000, recovery: 1500, cooldown: 8000, damage: 12 },
    works: { label: 'OBRA ETERNA', windup: 1200, duration: 500, recovery: 1700, cooldown: 10000, damage: 8 },
    traffic: { label: 'TRANCÓN', windup: 1800, duration: 1600, recovery: 1600, cooldown: 9000, damage: 14 },
    rain: { label: 'AGUACERO BOGOTANO', windup: 1200, duration: 6000, recovery: 1600, cooldown: 14000, damage: 0 },
    paper: { label: 'TRÁMITE INFINITO', windup: 1100, duration: 950, recovery: 1600, cooldown: 7000, damage: 4 },
    shield: { label: 'VUELVA MAÑANA', windup: 850, duration: 2500, recovery: 1500, cooldown: 16000, damage: 0 },
  },
  pico: { immobilize:600, escapeMargin:1200 },
  works: { limit: 6, holeCooldown: 1800, coneHp: 40, fenceHp: 70 },
  paper: { speed: 230, lifetime: 18000, maxStacks: 3, slowPerStack: .13, shakePresses: 3, volleyCount:3, shotInterval:260, projectileLifetime:4500 },
  rain: { guard:850 },
  traffic: { speed: 560, barrierDuration: 3200, escapeMargin:1100, vehicles:{taxi:{width:200,height:81},bus:{width:380,height:86},truck:{width:250,height:107}} },
};

