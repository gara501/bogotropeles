// End-of-level bosses. kind 'enemy' reuses the enemy AI (combos, hurt, specials)
// with a big health bar and its own music; 'controller' is Dormilón's BossController.
export const BOSS_MUSIC={key:'boss-music',url:`${import.meta.env?.BASE_URL??'./'}assets/boss.mp3`};
export const BOSSES={
  barra:{kind:'enemy',enemy:'barra',name:'EL BARRA',music:BOSS_MUSIC.key,score:1500,deathMs:1300},
  palomera:{kind:'enemy',enemy:'palomera',name:'LA PALOMERA',music:BOSS_MUSIC.key,score:2000,deathMs:1500},
  grafitero:{kind:'enemy',enemy:'grafitero',name:'EL GRAFITERO',music:BOSS_MUSIC.key,score:2500,deathMs:1500},
  cabecilla:{kind:'enemy',enemy:'cabecilla',name:'EL CABECILLA',music:BOSS_MUSIC.key,score:3000,deathMs:1500},
  antidisturbios:{kind:'enemy',enemy:'antidisturbios',name:'EL ANTIDISTURBIOS',music:BOSS_MUSIC.key,score:3500,deathMs:1600},
  dormilon:{kind:'controller'},
};
export const bossFor=level=>BOSSES[level?.boss]??null;
