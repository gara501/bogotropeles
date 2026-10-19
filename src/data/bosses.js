// End-of-level bosses. kind 'enemy' reuses the enemy AI (combos, hurt, specials)
// with a big health bar and its own music; 'controller' is Dormilón's BossController.
export const BOSS_MUSIC={key:'boss-music',url:`${import.meta.env?.BASE_URL??'./'}assets/boss.mp3`};
export const BOSSES={
  barra:{kind:'enemy',enemy:'barra',name:'THE CHIKEN GOMEZ',music:BOSS_MUSIC.key,score:1500,deathMs:1300},
  palomera:{kind:'enemy',enemy:'palomera',name:'PALOMERA',music:BOSS_MUSIC.key,score:2000,deathMs:1500},
  grafitero:{kind:'enemy',enemy:'grafitero',name:'PINTURITA',music:BOSS_MUSIC.key,score:2500,deathMs:1500},
  cabecilla:{kind:'enemy',enemy:'cabecilla',name:'COLADIN',music:BOSS_MUSIC.key,score:3000,deathMs:1500},
  antidisturbios:{kind:'enemy',enemy:'antidisturbios',name:'ESMADIEGO',music:BOSS_MUSIC.key,score:3500,deathMs:1600},
  dormilon:{kind:'controller'},
};
export const bossFor=level=>BOSSES[level?.boss]??null;
