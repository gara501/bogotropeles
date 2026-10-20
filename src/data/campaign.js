// Enemy keys retain their existing sprites: walker=1, rider=2, thrower=3,
import {ARCADE} from './arcade.js';
// guard=4, chain=5, brawler=6, fan=7, sweeper=8, vendor=9, belly=10, leash=11.
// Parallax art lives in src/scenes/<folder>/game/*.png (960×540, transparent PNG).
// factor: 0 = fixed sky … 1 = moves with the fighters; front layers are drawn over them.
const LEVEL1_ART={folder:'level1',
  layers:[{file:'sky',factor:.08},{file:'skyline',factor:.2},{file:'buildings',factor:.45},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}],
  traffic:{file:'bus',oneWay:true,after:'buildings',factor:.6,bottom:379,speed:260,every:[4000,9000],first:1500}};
// Plaza de Bolívar: the Cathedral layer moves slowly (.4) so it stays on screen for most of the level.
const LEVEL2_ART={folder:'level2',
  layers:[{file:'sky',factor:.06},{file:'hills',factor:.14},{file:'city',factor:.25},{file:'landmarks',factor:.4},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}]};
// La Candelaria: houses scaled to 85% (src/scenes/level3/game) so the skyline shows above the roofs.
const LEVEL3_ART={folder:'level3',
  layers:[{file:'sky',factor:.06},{file:'skyline',factor:.2},{file:'houses',factor:.6},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}]};
// Inside a TransMilenio: the bus interior moves almost as one body; the city drifts past the windows.
const LEVEL4_ART={folder:'level4',
  layers:[{file:'city',factor:.3,drift:140},{file:'wall',factor:.9},{file:'floor',factor:1},{file:'seats',factor:.9},{file:'poles',factor:1.25,front:true}]};
// Chorro de Quevedo: the fountain is a single prop on a 1920 px tile, at the back edge of the plaza (behind the fighters).
const LEVEL5_ART={folder:'level5',
  layers:[{file:'sky',factor:.06},{file:'skyline',factor:.2},{file:'houses',factor:.55},{file:'floor',factor:1},{file:'fountain',factor:1},{file:'front',factor:1.3,front:true}]};
// Calles del centro: the street is taken from the original level_6.png; clouds drift slowly.
const LEVEL6_ART={folder:'level6',
  layers:[{file:'sky',factor:.06,drift:6},{file:'skyline',factor:.2},{file:'buildings',factor:.6},{file:'floor',factor:1}]};
export const CAMPAIGN = [
  {name:'TransMilenio · Exterior',art:LEVEL1_ART,boss:'barra',top:400,enemies:['fan','brawler'],total:15,hp:.65,speed:.85,damage:.8,pressure:.8,gap:1100,props:{kinds:['station0','station4','station8','station5','station15','station9','station1','station10','station12','station6','station3','station13','station11','station14','station2','station7'],start:180,spacing:260,jitter:80,baseline:-18,depthJitter:3}},
  {name:'Plaza de Bolívar',art:LEVEL2_ART,boss:'palomera',top:410,enemies:['walker','rider','vendor','belly'],total:20,mode:'crossing',crossingEnemies:['rider'],hp:.75,speed:.95,damage:.9,pressure:.9,gap:1000},
  {name:'La Candelaria',art:LEVEL3_ART,boss:'grafitero',top:415,enemies:['thrower','brawler','fan','sweeper','vendor','belly','yulitza'],total:20,hp:.85,speed:1,damage:1,pressure:1,gap:900,props:{kinds:['lechona','merengon'],start:520,spacing:780,jitter:120,baseline:-4}},
  {name:'TransMilenio · Estación',art:LEVEL4_ART,boss:'cabecilla',top:355,enemies:['chain','brawler','fan','sweeper','belly','leash','yulitza'],total:20,hp:1,speed:1.08,damage:1.1,pressure:1.1,gap:800,props:{kinds:['passenger0','passenger6','passenger1','passenger9','passenger7','passenger5','passenger10'],scrollFactor:.9,slots:{period:595,offsets:[196,400,595],fill:.7},start:120,baseline:24,flip:false}},
  {name:'Chorro de Quevedo',art:LEVEL5_ART,boss:'antidisturbios',top:375,enemies:['guard','chain','walker','sweeper','belly','leash','yulitza'],total:20,hp:1.12,speed:1.15,damage:1.2,pressure:1.2,gap:700,props:{kinds:['chorro0','chorro5','chorro13','chorro9','chorro2','chorro11','chorro14','chorro7','chorro1','chorro10','chorro4','chorro15','chorro3','chorro8','chorro12','chorro6'],start:160,spacing:240,jitter:90,baseline:-14,depthJitter:3}},
  {name:'Calles del centro',art:LEVEL6_ART,top:410,enemies:['guard','rider','walker','sweeper','belly','leash','yulitza'],total:30,hp:1.25,speed:1.22,damage:1.3,pressure:1.3,gap:600,boss:'dormilon',props:{kinds:['samber0','samber4','samber13','samber9','samber2','samber10','samber15','samber5','samber3','samber8','samber12','samber6','samber1','samber11','samber14','samber7'],start:180,spacing:250,jitter:90,baseline:-14,depthJitter:3}},
];

export function waveSize(wave,remaining){return Math.min(wave%2?3:2,remaining);}
export function scaledEnemy(base,level) {
  return {...base,hp:Math.round(base.hp*level.hp),speed:base.speed*level.speed,
    damage:Math.max(1,Math.round(base.damage*level.damage))};
}
export function crossingHits(previousX,currentX,enemy,player,jumpHeight) {
  return !enemy.crossingHit && jumpHeight<ARCADE.body.projectileAvoidHeight && Math.abs(enemy.y-player.y)<ARCADE.body.lane &&
    player.x+ARCADE.body.halfWidth>=Math.min(previousX,currentX)-ARCADE.hazards.motoHalfWidth && player.x-ARCADE.body.halfWidth<=Math.max(previousX,currentX)+ARCADE.hazards.motoHalfWidth;
}
