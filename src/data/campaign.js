// Enemy keys retain their existing sprites: walker=1, rider=2, thrower=3,
import {ARCADE} from './arcade.js';
// guard=4, chain=5, brawler=6, fan=7, sweeper=8, vendor=9, belly=10, leash=11.
// Parallax art lives in src/scenes/<folder>/game/*.png or directly in <folder> (960×540 PNG).
// factor: 0 = fixed sky … 1 = moves with the fighters; front layers are drawn over them.
const LEVEL1_ART={folder:'level1',
  layers:[{file:'sky',factor:.08},{file:'skyline',factor:.2},{file:'buildings',factor:.45},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}],
  traffic:{file:'bus',oneWay:true,after:'buildings',factor:.6,bottom:379,speed:260,every:[4000,9000],first:1500,
    frameRect:[0,151,2170,427],displaySize:[717,140]}};
// Plaza de Bolívar: the Cathedral layer moves slowly (.4) so it stays on screen for most of the level.
const LEVEL2_ART={folder:'level2',
  layers:[{file:'sky',factor:.06},{file:'hills',factor:.14},{file:'city',factor:.25},{file:'landmarks',factor:.4},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}]};
// La Candelaria: houses scaled to 85% (src/scenes/level3/game) so the skyline shows above the roofs.
const LEVEL3_ART={folder:'level3',
  layers:[{file:'sky',factor:.06},{file:'skyline',factor:.2},{file:'houses',factor:.6},{file:'floor',factor:1},{file:'front',factor:1.3,front:true}]};
// Inside a Transmilleno: the bus interior moves almost as one body; the city drifts past the windows.
const LEVEL4_ART={folder:'level4',
  layers:[{file:'city',factor:.3,drift:140},{file:'wall',factor:.9},{file:'floor',factor:1},{file:'seats',factor:.9},{file:'poles',factor:1.25,front:true}]};
// Chorro de Quevedo: the fountain is a single prop on a 1920 px tile, at the back edge of the plaza (behind the fighters).
const LEVEL5_ART={folder:'level5',
  layers:[{file:'sky',factor:.06},{file:'skyline',factor:.2},{file:'houses',factor:.55},{file:'floor',factor:1},{file:'fountain',factor:1},{file:'front',factor:1.3,front:true}]};
// Calles del centro: the street is taken from the original level_6.png; clouds drift slowly.
const LEVEL6_ART={folder:'level6',
  layers:[{file:'sky',factor:.06,drift:6},{file:'skyline',factor:.2},{file:'buildings',factor:.6},{file:'floor',factor:1}]};
const LEVEL7_ART={folder:'level7',
  // The panorama's curb aligns at y=402 with the original independent floor.
  layers:[{file:'panorama',factor:1,height:560,repeat:false},{file:'floor',factor:1}]};
const ORIGINAL_COMBAT_CAMPAIGN = [
  {name:'Transmilleno · Exterior',art:LEVEL1_ART,boss:'barra',top:400,enemies:['fan','brawler'],total:15,hp:.65,speed:.85,damage:.8,pressure:.8,gap:1100,props:{kinds:['station0','station4','station8','station5','station15','station9','station1','station10','station12','station6','station3','station13','station11','station14','station2','station7'],start:180,spacing:260,jitter:80,baseline:-18,depthJitter:3}},
  {name:'Plaza de Bolívar',art:LEVEL2_ART,boss:'palomera',top:410,enemies:['walker','rider','vendor','belly'],total:20,mode:'crossing',crossingEnemies:['rider'],hp:.75,speed:.95,damage:.9,pressure:.9,gap:1000,
    groundPigeons:{at:.5,groups:3,birds:4,respawn:4500,radius:95,depth:32,hitDepth:20,tell:450,flight:1700,damage:5}},
  {name:'La Candelaria',art:LEVEL3_ART,boss:'grafitero',top:415,enemies:['guitarist','vendor','sweeper','chain','guard','leash'],total:20,hp:.85,speed:1,damage:1,pressure:1,gap:900,props:{kinds:['lechona','merengon'],start:520,spacing:780,jitter:120,baseline:-4}},
  {name:'Transmilleno · Estación',art:LEVEL4_ART,boss:'cabecilla',top:355,enemies:['brawler','fan','sweeper','guard','yulitza'],total:20,hp:1,speed:1.08,damage:1.1,pressure:1.1,gap:800,props:{kinds:['passenger0','passenger6','passenger1','passenger9','passenger7','passenger5','passenger10'],scrollFactor:.9,slots:{period:595,offsets:[196,400,595],fill:.7},start:120,baseline:24,flip:false}},
  {name:'Chorro de Quevedo',art:LEVEL5_ART,boss:'antidisturbios',top:375,enemies:['guitarist','motorata','vendor','thrower','belly'],total:20,hp:1.12,speed:1.15,damage:1.2,pressure:1.2,gap:700,props:{kinds:['chorro0','chorro5','chorro13','chorro9','chorro2','chorro11','chorro14','chorro7','chorro1','chorro10','chorro4','chorro15','chorro3','chorro8','chorro12','chorro6'],start:160,spacing:240,jitter:90,baseline:-14,depthJitter:3}},
  {name:'Calles del centro',art:LEVEL6_ART,top:410,enemies:['motorata','walker','thrower','sweeper','belly','yulitza'],total:30,hp:1.25,speed:1.22,damage:1.3,pressure:1.3,gap:600,boss:'brayatan',props:{kinds:['samber0','samber4','samber13','samber9','samber2','samber10','samber15','samber5','samber3','samber8','samber12','samber6','samber1','samber11','samber14','samber7'],start:180,spacing:250,jitter:90,baseline:-14,depthJitter:3}},
  {name:'Zona Rosa',art:LEVEL7_ART,top:415,enemies:['guard','belly','motorata','leash','vendor'],total:30,hp:1.35,speed:1.26,damage:1.4,pressure:1.4,gap:550,boss:'pacho',
    props:{kinds:['politico0','politico1','politico2','politico3','politico4','politico5','politico6','politico7'],scrollFactor:.55,
      slots:{period:960,offsets:[210,340,630,765],fill:1},baseline:-4,depthJitter:3,edgeMargin:32,edgeFade:24}},
].map((level,index)=>({...level,combatIndex:index,enemies:[...(index>=2?[...level.enemies,'homeless']:level.enemies),...([1,2,4,5,6].includes(index)?['malabarista']:[]),...([1,2,4].includes(index)?['parlanchin']:[])],
  ...(index===3?{}:{rain:{delay:[3000,60000],duration:20000}})}));

export const CYCLING_LEVEL={name:'Ciclovía',mode:'cycling',top:300,bottom:485,enemies:[],total:0,boss:null,rain:null,
  hp:.7,speed:.9,damage:.85,pressure:.85,gap:0};
export const PALOMOJAO_LEVEL={name:'Plaza de Palomojao',combatIndex:7,
  art:{folder:'palomojao',background:'background',layers:[{file:'roof',factor:.75},{file:'stalls',factor:.75},
    {file:'floor',factor:1},{file:'front',factor:1.2,front:true}]},
  top:390,bottom:500,enemies:['frutatiana','don_diablo','don_pico','papero'],total:20,boss:'reversa',rain:null,potatoSupplies:true,
  hp:1.18,speed:1.18,damage:1.25,pressure:1.25,gap:650,
  props:{kinds:['palomojao-flowers','palomojao-onions','palomojao-oranges','palomojao-basket'],start:350,spacing:630,jitter:80,baseline:-10,flip:false}};
// Combat IDs remain stable for art, containers and boss previews. CAMPAIGN defines the playable order.
export const DORADO_LEVEL={name:'EL dorado',combatIndex:8,
  art:{folder:'level8',layers:[{file:'panorama',factor:1,repeat:false},
    {file:'panorama',factor:1,y:405,height:135,frameRect:[0,559,2109,186]}]},
  top:405,bottom:500,enemies:['ortencio','agente_pare','belly'],total:25,boss:'jugo',rain:null,
  taxiRush:{arena:3,min:8,max:15,leadIn:500,warning:900,spacing:1100,speed:1100,width:230,height:95,hitDepth:13,avoidHeight:35,damage:22,tail:400},
  hp:1.3,speed:1.24,damage:1.35,pressure:1.35,gap:575};
export const COMBAT_CAMPAIGN=[...ORIGINAL_COMBAT_CAMPAIGN,PALOMOJAO_LEVEL,DORADO_LEVEL];
export const CAMPAIGN=[COMBAT_CAMPAIGN[0],CYCLING_LEVEL,...COMBAT_CAMPAIGN.slice(1,5),PALOMOJAO_LEVEL,COMBAT_CAMPAIGN[5],DORADO_LEVEL,COMBAT_CAMPAIGN[6]];
export const campaignIndexForCombat=index=>CAMPAIGN.findIndex(level=>level.combatIndex===index);

export function waveSize(wave,remaining){return Math.min(wave%2?3:2,remaining);}
export function scaledEnemy(base,level) {
  return {...base,hp:Math.round(base.hp*level.hp),speed:base.speed*level.speed,
    damage:Math.max(1,Math.round(base.damage*level.damage))};
}
export function crossingHits(previousX,currentX,enemy,player,jumpHeight) {
  return !enemy.crossingHit && jumpHeight<ARCADE.body.projectileAvoidHeight && Math.abs(enemy.y-player.y)<ARCADE.body.lane &&
    player.x+ARCADE.body.halfWidth>=Math.min(previousX,currentX)-ARCADE.hazards.motoHalfWidth && player.x-ARCADE.body.halfWidth<=Math.max(previousX,currentX)+ARCADE.hazards.motoHalfWidth;
}
