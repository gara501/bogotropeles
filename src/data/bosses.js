// End-of-level bosses. kind 'enemy' reuses the enemy AI (combos, hurt, specials)
// with a big health bar and its own music; 'controller' is Dormilón's BossController.
export const BOSS_MUSIC={key:'boss-music',url:`${import.meta.env?.BASE_URL??'./'}assets/boss.mp3`};
export const FINAL_BOSS_MUSIC={key:'boss-final-music',url:`${import.meta.env?.BASE_URL??'./'}assets/boss_final.mp3`};
export const BOSSES={
  barra:{kind:'enemy',enemy:'barra',name:'THE CHIKEN GOMEZ',music:BOSS_MUSIC.key,score:1500,deathMs:1300},
  palomera:{kind:'enemy',enemy:'palomera',name:'PALOMERA',music:BOSS_MUSIC.key,score:2000,deathMs:1500},
  grafitero:{kind:'enemy',enemy:'grafitero',name:'PINTURITA',music:BOSS_MUSIC.key,score:2500,deathMs:1500},
  cabecilla:{kind:'enemy',enemy:'cabecilla',name:'COLADIN',music:BOSS_MUSIC.key,score:3000,deathMs:1500},
  antidisturbios:{kind:'enemy',enemy:'antidisturbios',name:'ESMADIEGO',music:BOSS_MUSIC.key,score:3500,deathMs:1600},
  brayatan:{kind:'enemy',enemy:'brayatan',name:'BRAYATAN',music:BOSS_MUSIC.key,score:4000,deathMs:1700},
  pacho:{kind:'enemy',enemy:'pacho',name:'DON PACHO PLOMO',music:FINAL_BOSS_MUSIC.key,score:5000,deathMs:1800},
  reversa:{kind:'enemy',enemy:'reversa',name:'DON REVERSA',music:BOSS_MUSIC.key,score:4500,deathMs:4000},
  dormilon:{kind:'controller'},
};
export const bossFor=level=>BOSSES[level?.boss]??null;
export const bossMusicFor=level=>[BOSS_MUSIC,FINAL_BOSS_MUSIC].find(track=>track.key===bossFor(level)?.music)??null;
