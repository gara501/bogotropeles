import walkerUrl from './enemies/enemy_1.png?url';
import {MOTORATA} from './motorata.js';
import {HOMELESS} from './homeless.js';
import {MIME} from './mime.js';
import {ARCADE,toFrames} from './arcade.js';
import riderUrl from './enemies/enemy_2.png?url';
import throwerUrl from './enemies/enemy_3.png?url';
import guardUrl from './enemies/enemy_4.png?url';
import chainUrl from './enemies/enemy_5.png?url';
import brawlerUrl from './enemies/enemy_6.png?url';
import fanUrl from './enemies/enemy_7.png?url';
import sweeperUrl from './enemies/enemy_8.png?url';
import vendorUrl from './enemies/enemy_9.png?url';
import bellyUrl from './enemies/enemy_10.png?url';
import leashUrl from './enemies/enemy_11.png?url';
import knifeUrl from './UI/knife_clean.png?url';
import barraUrl from './bosses/enemy_boss_1.png?url';
import barraWhistleUrl from './bosses/enemy_boss_1_whistle.png?url';
import barristasUrl from './enemies/barristas.png?url';
import ballUrl from './UI/balon.png?url';
import palomeraUrl from './bosses/enemy_boss_3.png?url';
import palomeraSummonUrl from './bosses/enemy_boss_3_summon_pigeons.png?url';
import pigeonFlightUrl from './bosses/pigeon_flight.png?url';
import pigeonUrl from './UI/paloma.png?url';
import grafiteroUrl from './bosses/enemy_boss_2.png?url';
import sprayCanUrl from './UI/spray_can.png?url';
import cabecillaUrl from './bosses/enemy_boss_4.png?url';
import studentsUrl from './bosses/enemy_boss_4_2.png?url';
import riotUrl from './bosses/enemy_boss_5.png?url';
import yulitzaUrl from './enemies/enemy_12.png?url';
import walkerStruggleUrl from './enemies/enemy_1_grab_struggle.png?url';
import riderStruggleUrl from './enemies/enemy_2_grab_struggle.png?url';
import throwerStruggleUrl from './enemies/enemy_3_grab_struggle.png?url';
import guardStruggleUrl from './enemies/enemy_4_grab_struggle.png?url';
import chainStruggleUrl from './enemies/enemy_5_grab_struggle.png?url';
import brawlerStruggleUrl from './enemies/enemy_6_grab_struggle.png?url';
import fanStruggleUrl from './enemies/enemy_7_grab_struggle.png?url';
import sweeperStruggleUrl from './enemies/enemy_8_grab_struggle.png?url';
import vendorStruggleUrl from './enemies/enemy_9_grab_struggle.png?url';
import bellyStruggleUrl from './enemies/enemy_10_grab_struggle.png?url';
import leashStruggleUrl from './enemies/enemy_11_grab_struggle.png?url';
import yulitzaStruggleUrl from './enemies/enemy_12_grab_struggle.png?url';
import { sequence } from './spriteSheets.js';
import {RIOT_PHASE} from './riotPhase.js';
import {BRAYATAN_SPRITE} from './brayatan.js';
import {PACHO_SPRITE} from './pacho.js';
import {RAT_SPRITE} from './rat.js';
import {GUITARIST} from './guitarist.js';
import {JUGGLER,JUGGLING_CLUB_URL} from './juggler.js';

const animations = { walk: sequence(0, 5), attack: sequence(6, 11), hurt: sequence(12, 17), defeat: sequence(18, 23) };
export const enemies = {
  motorata:MOTORATA,
  homeless:HOMELESS,
  parlanchin:MIME,
  brayatan:BRAYATAN_SPRITE,
  pacho:PACHO_SPRITE,
  rat:RAT_SPRITE,
  guitarist:GUITARIST,
  malabarista:JUGGLER,
  // enemy_12.png (4×6): guard · run · machete slash · leaping slash · crouch/hop · lunges. The fastest fighter in the game:
  // a 2-slash machete combo and, when the player swings at her up close, a lightning hop to the other side of the player.
  // No hurt/defeat rows in the sheet: the crouch poses stand in for them.
  yulitza:{name:'YULITZA',url:yulitzaUrl,rows:[4,4,4,4,4,4],height:116,speed:360,hp:375,range:115,damage:8,idle:0,aggressive:true,
    frameRects:[[18,12,221,244],[282,14,210,242],[531,12,206,244],[782,12,202,244],[15,276,235,228],[270,277,228,230],[526,277,229,231],[779,278,218,231],[22,508,215,270],[284,529,207,247],[519,553,273,222],[775,583,240,192],[19,841,224,199],[305,807,198,233],[557,773,220,253],[797,799,212,241],[13,1105,229,177],[275,1077,207,205],[530,1046,198,189],[786,1108,221,174],[15,1332,227,190],[271,1317,235,205],[521,1280,246,232],[788,1359,220,159]].map(([x,y,width,height])=>({x,y,width,height})),
    isolateFrames:true,keepDetachedFrames:[10,14], // the cyan machete trails
    frameAnchors:{0:150,1:397,2:642,3:892,4:152,5:392,6:647,7:905,8:134,9:388,10:658,11:898,12:159,13:422,14:642,15:908,16:124,17:376,18:645,19:895,20:137,21:373,22:654,23:890},
    combo:{stages:2,windup:300,interval:220,recovery:420,cooldown:1300,hitFrames:[2,2],ranges:[115,135],confirmFirst:false,followThrough:true},
    // Dodge: when the player starts a strike within `range`, `chance` of hopping over to the player's other side.
    dodge:{range:150,chance:.55,cooldown:1400,distance:130,height:58,duration:300,poses:[16,18,18,19]},
    animations:{walk:sequence(4,7),attack:sequence(8,11),attack1:sequence(8,11),attack2:sequence(12,15),hurt:[17],defeat:[16,16]}},
  // Level 5 boss (enemy_boss_5.png, 4×7): idle · walk · tear-gas launcher · shield bash · hurt · defeat · gas art.
  // The shield covers his front: hits from the front only do `frontDamage` and don't stagger him, so the player
  // has to get behind him. He turns around slowly (`turnMs`) and only attacks forward.
  // The last sheet row (canister, burst, clouds) is cut into the gas-0…gas-3 textures.
  antidisturbios:{name:'ESMADIEGO',url:riotUrl,rows:[4,4,4,4,4,4],height:128,speed:120,hp:2400,range:118,damage:12,idle:0,boss:true,
    frameRects:[[53,22,153,240],[285,22,152,240],[514,21,153,241],[746,22,151,240],[32,283,165,240],[280,284,146,238],[505,284,169,239],[768,284,135,239],[26,541,163,231],[252,544,190,227],[485,546,262,226],[755,542,149,230],[26,808,181,204],[257,793,190,221],[473,797,252,218],[759,793,152,222],[33,1032,152,230],[247,1040,191,216],[491,1077,181,183],[747,1034,165,226],[32,1280,190,207],[247,1314,225,173],[467,1364,240,120],[717,1395,217,89]]
      .map(([x,y,width,height])=>({x,y,width,height})),
    isolateFrames:true,
    frameAnchors:{0:137,1:369,2:598,3:829,4:122,5:367,6:600,7:845,8:111,9:350,10:581,11:834,12:129,13:348,14:602,15:840,16:117,17:342,18:585,19:838,20:116,21:349,22:575,23:815},
    attackFrames:{startup:26,active:4,recovery:26,cooldown:80},followThrough:true,
    shield:{frontDamage:.1,turnMs:900},
    // Tear gas: a lobbed canister that bursts where the player stood (blast) and leaves a cloud that keeps hurting.
    throw:{minRange:200,maxRange:620,windup:700,active:3,recovery:520,cooldown:2600,speed:380,damage:0,texture:'gas-0',width:46,height:14,lift:110,offset:95,hitFrame:2,
      gas:{radius:78,depth:30,blast:10,damage:4,every:600,ms:2800,arc:90}},
    gasRects:[[69,1556,101,29],[267,1538,136,87],[458,1533,199,93],[695,1506,217,129]],
    animations:{walk:sequence(4,7),attack:sequence(12,15),throw:sequence(8,11),hurt:[17,18],defeat:sequence(20,23)}},
  // Level 4 boss (enemy_boss_4.png, 4×4): idle/walk · summon (shout, raise arm, point) · hurt · defeat.
  // He hangs back and calls waves of fast students; his own close attack is a weak open-hand shove (pose 3).
  cabecilla:{name:'COLADIN',url:cabecillaUrl,rows:[4,4,4,4],height:120,speed:150,hp:1600,range:95,damage:7,idle:0,boss:true,keepDistance:380,
    frameAnchors:{0:213,1:587,2:934,3:1278,4:213,5:618,6:938,7:1293,8:215,9:587,10:942,11:1303,12:206,13:567,14:936,15:1334},
    attackFrames:{startup:18,active:4,recovery:24,cooldown:80},
    // Summon: every 6.5 s (or right after an evade) a wave of 2–3 students, at most 4 alive at once.
    summon:{enemy:'estudiante',variants:4,counts:[2,3],maxAlive:4,cooldown:6500,first:1200,windup:650,recovery:500,poses:[4,5,6,7],hitFrame:2},
    evade:{hits:3,window:1500,distance:200,height:44,duration:460,pose:5,summonAfter:true},
    animations:{walk:[1,2],attack:[0,3],summon:sequence(4,7),hurt:[9,10],defeat:sequence(12,15)}},
  // His students (enemy_boss_4_2.png, 6×4): one row per student (run ×4, running punch, hurt). A single texture;
  // each instance gets frameOffset = row × 6. Very fast, fragile, not part of the level's wave count.
  estudiante:{name:'ESTUDIANTE',url:studentsUrl,rows:[6,6,6,6],height:112,speed:340,hp:90,range:85,damage:6,idle:0,minion:true,
    frameAnchors:{0:159,1:404,2:662,3:909,4:1153,5:1437,6:148,7:412,8:660,9:923,10:1170,11:1433,12:150,13:389,14:657,15:909,
      16:1166,17:1438,18:146,19:412,20:660,21:921,22:1186,23:1446},
    attackFrames:{startup:10,active:4,recovery:16,cooldown:40},
    animations:{walk:sequence(0,3),attack:[3,4,4],hurt:[5],defeat:[5]}},
  // Level 3 boss (enemy_boss_2.png, 4×6 poses): run · spray-can throw · jump (crouch, airborne spray, land) ·
  // pink spray · idle/hurt · defeat. No knife combo: his close attack is the pink spray, which paints the floor.
  grafitero:{name:'PINTURITA',url:grafiteroUrl,rows:[4,4,4,4,4,4],height:120,speed:190,hp:1500,range:200,damage:10,idle:16,boss:true,
    frameAnchors:{0:169,1:467,2:790,3:1126,4:140,5:472,6:772,7:1125,8:138,9:462,10:823,11:1122,12:140,13:441,14:776,15:1091,
      16:132,17:491,18:787,19:1133,20:151,21:484,22:814,23:1136},
    // The pink cloud stays on screen: 14 hurting frames on pose 14, then pose 15 while it dissipates.
    attackFrames:{startup:30,active:14,recovery:28,cooldown:90},followThrough:true,
    // The short-lived paint opens a safe path again after 1.2 s.
    paint:{stains:3,spacing:70,start:80,width:72,height:22,color:0xff2fb4,ms:1200,damage:6},
    throw:{minRange:240,maxRange:680,windup:520,active:3,recovery:420,cooldown:2200,speed:400,damage:9,texture:'spraycan',width:30,height:30,spin:8,lift:92,offset:110,hitFrame:2},
    // Phase two: faster movement and random volleys across the visible arena, with marked landing spots.
    barrage:{below:.5,speedMultiplier:1.2,first:350,cooldown:[4500,6500],count:[8,11],windup:700,recovery:500,
      damage:6,stagger:55,flight:[800,1250],arc:150,radius:24,depth:16,
      stain:{width:48,height:18,color:0xff43c6,ms:800,damage:3}},
    // The jump (3rd row): after 3 quick hits, or right after painting if the player is still close,
    // he hops backwards spraying, leaving cyan stains where he takes off and where he lands.
    evade:{hits:3,window:1500,distance:220,height:60,duration:560,poses:[8,9,9,9,10,11],rushSpeed:1.2,afterAttack:150,
      stain:{width:84,height:24,color:0x2fd6ff,ms:1200,damage:6}},
    animations:{walk:sequence(0,3),attack:sequence(12,15),throw:sequence(4,7),jump:sequence(8,11),hurt:[17,18],defeat:sequence(20,23)}},
  // Level 2 boss (enemy_boss_3.png, 4×7 poses). Detached pigeons are separate blobs, so poses use explicit
  // rects (pigeon included) and isolate the body except where a loose pigeon belongs to the drawing.
  // Rows: walk · pigeon jab · pigeon thrust · white-dove ritual (heal, pose 14) · big pigeon push/throw · idle/hurt · defeat.
  palomera:{name:'PALOMERA',url:palomeraUrl,rows:[4,4,4,4,4,4,4,6],height:118,speed:170,hp:1300,range:125,damage:10,idle:20,boss:true,
    frameRects:[[83,8,157,193],[374,8,155,191],[667,8,163,192],[966,5,158,195],[66,214,140,170],[325,221,199,163],[586,214,325,170],[958,213,163,171],
      [59,390,185,181],[344,393,184,177],[584,395,349,175],[979,390,168,182],[71,580,151,186],[341,563,184,203],[604,599,339,167],[984,578,179,188],
      [67,776,150,179],[326,776,205,179],[593,790,375,167],[1005,777,150,180],[66,961,165,176],[333,962,233,186],[657,982,149,157],[968,966,153,175],
      [51,1154,185,150],[324,1155,228,151],[590,1151,275,146],[903,1173,262,124],
      // 28-33: enemy_boss_3_summon_pigeons.png (6 cells of 256×256) appended under the main sheet (y + 1312).
      ...Array.from({length:6},(_,i)=>[i*256,1312,256,256])].map(([x,y,width,height])=>({x,y,width,height})),
    appendUrls:[palomeraSummonUrl],
    isolateFrames:true,keepDetachedFrames:[6,10,14,18,21,24,25,26,28,29,30,31,32,33],
    frameScales:{28:1.3,29:1.3,30:1.3,31:1.3,32:1.3,33:1.3}, // the summon sheet is drawn smaller than the main one
    frameAnchors:{0:159,1:443,2:732,3:1032,4:134,5:424,6:661,7:1042,8:129,9:438,10:667,11:1059,12:134,13:433,14:682,15:1056,
      16:135,17:424,18:668,19:1067,20:142,21:443,22:719,23:1038,24:135,25:438,26:727,27:1034,28:128,29:384,30:640,31:896,32:1152,33:1408},
    // recovery: how long she holds each strike's last pose (was 560 ms: she looked frozen after every punch).
    combo:{windup:420,interval:300,recovery:200,cooldown:1300,hitFrames:[2,2,2],ranges:[125,125,175],confirmFirst:false,followThrough:true},
    // Her main ranged attack: thrown often and from a little closer than before.
    throw:{keepAway:true,minRange:200,maxRange:700,windup:520,active:3,recovery:400,cooldown:1300,speed:380,damage:9,texture:'paloma',width:58,height:34,lift:80,offset:120,hitFrame:2},
    // From half health: "nube de palomas". She raises her arms (poses 28-33) and `birds` pigeons fly over the player, each
    // dropping `drops` poops around them (`spread` px apart). A shadow marks each landing spot for `fall` ms;
    // a poop landing within `hitRadius`/`depth` of the player takes `damage` health. See boss/PigeonFlock.js.
    flock:{below:.5,first:500,cooldown:7500,windup:750,recovery:650,poses:[28,29,30,31,32,33],hitFrame:3,
      birds:8,stagger:120,speed:300,altitude:[115,175],scale:.42,drops:2,spread:140,fall:650,hitRadius:24,depth:16,damage:6,url:pigeonFlightUrl},
    // Right after each pigeon cloud: "escudo de palomas". For `duration` ms `birds` pigeons circle her and she can't be hurt
    // (multicolour glow, `colors`); she throws a pigeon every `interval` ms at the player's lane (± `laneSpread` px).
    // Touching the ring (`radius`/`depth`) hurts and pushes the player back: the answer is to back off and dodge.
    pigeonShield:{duration:5000,interval:450,throwPoses:[16,17,18,19],release:.55,laneSpread:30,birds:7,radius:82,depth:26,height:62,spin:.11,damage:7,scale:.36,
      colors:[0xff8a8a,0xffd36b,0x9dff8a,0x7ad8ff,0xc9a0ff,0xff9ee6]},
    evade:{hits:3,window:1500,distance:200,height:40,duration:440,pose:20,rushSpeed:1.25},
    // Below 60% health and with the player far away she raises the white dove and holds pose 14,
    // regaining 5% of max health per second for up to 5 s. Any hit interrupts it.
    // loopPoses: the ritual is animated (cycles these poses, `framesPerPose` each) instead of holding pose 14, which looked frozen.
    heal:{below:.6,minDistance:280,windup:500,duration:3000,perSecond:.07,cooldown:10000,interruptCooldown:4000,startPoses:[12,13],pose:14,
      loopPoses:[13,14,15,14],framesPerPose:9},
    animations:{walk:sequence(0,3),attack:sequence(4,7),attack1:sequence(4,7),attack2:sequence(8,11),attack3:sequence(16,19),
      throw:sequence(16,19),heal:sequence(12,15),hurt:[21,22],defeat:sequence(24,27)}},
  // Level 1 boss (bosses/enemy_boss_1.png, 4×7 poses): runs in fast, 3-slash knife combo, throws footballs from range.
  // Anchors are the hip centre of each pose so lunges and wind-ups do not shift the body.
  barra:{name:'THE CHIKEN GOMEZ',url:barraUrl,rows:[4,4,4,4,4,4,4,6],height:122,speed:250,hp:900,range:118,damage:9,idle:20,boss:true,
    appendUrls:[barraWhistleUrl],
    frameScales:{28:.85,29:.85,30:.85,31:.85,32:.85,33:.85},
    frameAnchors:{0:172,1:413,2:662,3:948,4:152,5:388,6:634,7:904,8:143,9:395,10:698,11:952,12:140,13:391,14:642,15:948,
      16:129,17:407,18:625,19:945,20:135,21:419,22:673,23:948,24:136,25:396,26:662,27:923,
      28:128,29:384,30:640,31:896,32:1152,33:1408},
    combo:{windup:380,interval:260,recovery:520,cooldown:1400,hitFrames:[2,1,2],ranges:[118,118,150],confirmFirst:false,followThrough:true},
    // After `hits` hits inside `window` ms (e.g. Gymbro's full combo) he hops back out of reach,
    // untouchable while airborne, then runs straight back in with the knife combo.
    evade:{hits:3,window:1500,distance:190,height:46,duration:420,pose:4,rushSpeed:1.35},
    throw:{minRange:260,maxRange:640,windup:520,active:3,recovery:420,cooldown:2600,speed:430,damage:8,texture:'balon',width:30,height:30,spin:14,lift:70,offset:70,hitFrame:2},
    // Below half health he whistles for stick-carrying supporters. Never more than four of his minions alive.
    summon:{enemy:'barrista',variants:2,counts:[2,3],maxAlive:4,below:.5,first:300,cooldown:10000,windup:800,recovery:550,
      poses:[28,29,30,31,32,33],hitFrame:3,sound:'whistle',label:'¡REFUERZOS!'},
    animations:{walk:sequence(0,3),attack:sequence(4,7),attack1:sequence(4,7),attack2:sequence(8,11),attack3:sequence(12,15),
      throw:sequence(16,19),summon:sequence(28,33),hurt:[21,22],defeat:sequence(24,27)}},
  // Two supporters: four running poses, one stick strike and one recoil pose per row.
  barrista:{name:'BARRISTA',url:barristasUrl,rows:[6,6],height:112,speed:310,hp:100,range:110,damage:7,idle:0,minion:true,
    frameRects:Array.from({length:12},(_,i)=>({x:i%6*256,y:Math.floor(i/6)*256,width:256,height:256,anchor:i%6*256+128})),trimFrames:true,
    attackFrames:{startup:16,active:4,recovery:20,cooldown:55},
    animations:{walk:sequence(0,3),attack:[3,4,3],hurt:[5],defeat:[5]}},
  belly:{name:'UBER JOSE',url:bellyUrl,taunt:{text:'¡POR ALLÁ NO VOY!',ms:2500},rows:[4,4,4,4,4,4],height:120,speed:78,hp:305,range:110,damage:12,idle:4,melee:true,
    charge:{windup:750,speed:510,distance:510,recovery:650,cooldown:1600,triggerRange:440},
    frameRects:[
      [56,7,175,248],[312,7,152,249],[559,7,180,249],[820,7,158,248],
      [28,267,204,237],[288,257,195,247],[515,283,291,221],[810,269,206,235],
      [11,560,215,183],[270,527,214,215],[527,531,240,210],[811,520,200,223],
      [30,767,200,231],[279,759,230,238],[544,762,220,235],[809,765,195,232],
      [32,1016,198,242],[298,1020,199,238],[539,1036,251,223],[809,1016,189,241],
      [23,1295,198,219],[248,1330,228,194],[493,1394,250,124],[770,1407,248,107],
    ].map(([x,y,width,height])=>({x,y,width,height})),
    frameAnchors:{4:125,5:385,6:625,7:895,8:145,9:390,10:650,11:900,12:130,13:385,14:640,15:900},
    animations:{walk:sequence(0,3),attack:sequence(4,7),prepare:[8],rush:[9,10],chargeImpact:[13,14],brake:[15,4],hurt:sequence(16,19),defeat:sequence(20,23)}},
  leash:{name:'BENDECIDA',url:leashUrl,taunt:{text:'¡HOLA MOR!',ms:2500},rows:[4,4,4,4,4,4],height:112,speed:230,hp:320,range:220,damage:6,idle:4,aggressive:true,
    keepDistance:155,retreatDistance:100,
    combo:{windup:430,interval:340,recovery:600,cooldown:2700,hitFrame:2,confirmFirst:false,ranges:[160,220,170]},
    // Keep the extended leash and detached dog in the same pose as its owner.
    frameRects:[
      [71,2,241,172],[446,2,257,172],[846,2,269,169],[1229,2,268,171],
      [79,176,226,181],[450,170,205,186],[805,179,245,182],[1215,182,308,168],
      [36,363,240,166],[398,363,289,164],[784,362,468,167],[1267,354,238,175],
      [38,523,244,198],[431,525,254,197],[818,528,313,193],[1273,538,222,182],
      [96,722,206,173],[474,721,218,172],[832,718,261,174],[1261,719,198,175],
      [60,896,252,122],[388,901,361,116],[773,923,369,92],[1163,921,360,94],
    ].map(([x,y,width,height])=>({x,y,width,height})),
    frameAnchors:{0:190,1:565,2:960,3:1335,4:180,5:560,6:960,7:1320,8:180,9:585,10:925,11:1350,12:195,13:550,14:925,15:1350,16:180,17:560,18:930,19:1350},
    animations:{walk:sequence(0,3),attack:sequence(4,7),attack1:[4,5,7,4],attack2:sequence(8,11),attack3:sequence(12,15),hurt:sequence(16,19),defeat:sequence(20,23)}},
  vendor:{name:'CHICLEMANICARAMELO',url:vendorUrl,rows:[4,4,4,4,4],height:112,speed:95,hp:125,range:520,damage:12,idle:0,aggressive:true,
    charge:{windup:1000,speed:680,distance:700,recovery:650,cooldown:1500},
    // Include detached snacks, motion lines and dust in their corresponding pose.
    trimFrames:true,
    frameRects:[...[0,384,768,1180].map((x,i)=>({x,y:0,width:[384,384,412,356][i],height:240})),
      ...[0,384,768,1152].map(x=>({x,y:250,width:384,height:183})),
      ...[0,384,768,1180].map((x,i)=>({x,y:433,width:[384,384,412,356][i],height:200})),
      ...[0,384,768,1152].map(x=>({x,y:636,width:384,height:207})),
      ...[0,384,768,1152].map(x=>({x,y:847,width:384,height:177}))],
    animations:{walk:sequence(0,3),prepare:[4],rush:[5,6,7,8],brake:[9,10,11],attack:sequence(4,8),hurt:sequence(12,15),defeat:sequence(16,19)}},
  // Toughness in hits of the strongest normal strike (kick 45), at their original introduction multipliers:
  // walker/brawler/fan 7, belly (enemy_10) 6, leash (enemy_11) 8, thrower (enemy_3) 9.
  walker: {name:'VERCETI', url: walkerUrl, taunt:{text:'¡DESPÉGUELO PAPU!',ms:2500}, rows: [6, 6, 6, 6], height: 116, speed: 70, hp: 365, range: 60, damage: 6, animations },
  rider: {name:'COROMOTO', url: riderUrl, rows: [6, 6, 6, 6], height: 108, speed: 200, walkRate: 12, hp: 120, range: 80, damage: 8, animations },
  // Fast knife thrower: after 3 quick hits he hops back (crouch, recoil, land) and keeps throwing from range.
  thrower: {name:'VRALLAN', url: throwerUrl, rows: [6, 6, 6, 6], height: 116, speed: 160, hp: 430, range: 380, damage: 9, ranged: true, animations,
    evade:{hits:3,window:1500,distance:180,height:42,duration:440,poses:[14,12,12,14]} },
  guard: {name:'TONFABIO', url: guardUrl, taunt:{text:'¡PAPELES!',ms:2500}, rows: [6, 6, 6, 6], height: 116, speed: 150, hp: 120, range: 85, damage: 6, aggressive:true,
    combo:{windup:300,interval:230,recovery:400,cooldown:1450,hitFrame:2,confirmFirst:true},
    animations:{...animations,attack1:[6,7,9,11],attack2:[6,8,10,11],attack3:[7,8,9,11]} },
  chain: {name:'PUNKETO',
    url: chainUrl, rows: [4, 4, 4, 4], height: 116, speed: 75, hp: 100, range: 155, damage: 8, idle: 4,
    // Keep the body planted when the chain extends far beyond the torso.
    frameAnchors: { 6: 850 },
    animations: { walk: sequence(0, 3), attack: sequence(4, 7), hurt: sequence(8, 11), defeat: sequence(12, 15) },
  },
  // taunt: speech bubble shown over the enemy's head when it enters the screen.
  brawler: {name:'EZTIBEN', url: brawlerUrl, rows: [6, 6, 6, 6], height: 114, ...ARCADE.enemies.brawler, aggressive:true, taunt:{text:'¡SOLO MILLOS LOK!',ms:2500,color:'#0b3b8c'}, hp: 430, range: 108, damage: 7, animations },
  fan: {name:'GARSON',url:fanUrl,taunt:{text:'¡EL CIELO ES ROJO!',ms:2500,color:'#b3121b'},rows:[6,6,6,6],height:112,...ARCADE.enemies.fan,aggressive:true,hp:420,range:105,damage:6,
    frameAnchors:{9:861},animations},
  sweeper:{name:'TIBISAY',url:sweeperUrl,taunt:{text:'¡BÓTESE LA LIGA MONO!',ms:2500},rows:[4,4,4,4,4,4],height:112,speed:100,hp:110,range:148,damage:5,idle:4,
    // Quick broom strikes: short windup and little time between the three hits.
    combo:{windup:260,interval:190,recovery:380,cooldown:1700,hitFrame:2,confirmFirst:false},
    // Hurt pose 18 has a detached broom; explicit cuts keep both in one frame.
    frameRects:[
      [93,5,199,209],[476,6,166,208],[830,6,198,208],[1187,6,183,208],
      [85,218,214,190],[437,224,214,183],[776,230,322,177],[1182,223,252,183],
      [65,415,253,180],[411,417,238,177],[767,422,324,172],[1179,412,228,186],
      [66,601,236,203],[436,591,197,213],[788,628,276,173],[1182,650,238,153],
      [86,809,193,171],[490,815,190,165],[818,815,267,163],[1179,819,219,160],
      [82,979,233,106],[423,970,270,114],[772,998,291,75],[1140,1015,294,58],
    ].map(([x,y,width,height])=>({x,y,width,height})),
    frameAnchors:{4:170,5:542,6:885,7:1260,8:155,9:545,10:875,11:1270,12:170,13:545,14:880,15:1280,16:180,17:565,18:910,19:1265},
    animations:{walk:sequence(0,3),attack:sequence(4,7),attack1:sequence(4,7),attack2:[11,9,10,11],attack3:sequence(12,15),hurt:sequence(16,19),defeat:sequence(20,23)}},
};
const riot=enemies.antidisturbios;
riot.appendUrls=[RIOT_PHASE.url];riot.shieldBreak=RIOT_PHASE;
riot.rows.push(4,4,4,4,4,4);
riot.frameRects.push(...RIOT_PHASE.rects.map(([x,y,width,height],i)=>({x,y:y+1659,width,height,anchor:RIOT_PHASE.anchors[i]})));
riot.frameScales=Object.fromEntries(RIOT_PHASE.rects.map((_,i)=>[24+i,240/253]));
riot.keepDetachedFrames=[24,25,26];
for(const [state,frames] of Object.entries(RIOT_PHASE.animations))riot.animations[RIOT_PHASE.animationKeys[state]]=frames;
for(const enemy of Object.values(enemies)){
  enemy.attackFrames={startup:ARCADE.ai.windup,active:ARCADE.ai.active,recovery:ARCADE.ai.recovery,cooldown:enemy.ranged?ARCADE.ai.rangedCooldown:ARCADE.ai.cooldown,...enemy.attackFrames};
  if(enemy.charge)enemy.charge.frames={startup:toFrames(enemy.charge.windup),activePoses:[...enemy.animations.rush],recovery:toFrames(enemy.charge.recovery),...enemy.charge.frames};
}
// Grabbed by the player: enemies/enemy_N_grab_struggle.png, 6 poses of 256×256 (feet on the bottom edge), looped while held.
// struggle.scale: size relative to the main sheet's pixels (1 = same pixel scale as enemy_N.png).
const STRUGGLE = { walker: walkerStruggleUrl, rider: riderStruggleUrl, thrower: throwerStruggleUrl, guard: guardStruggleUrl, chain: chainStruggleUrl, brawler: brawlerStruggleUrl, fan: fanStruggleUrl, sweeper: sweeperStruggleUrl, vendor: vendorStruggleUrl, belly: bellyStruggleUrl, leash: leashStruggleUrl, yulitza: yulitzaStruggleUrl };
for (const [key, url] of Object.entries(STRUGGLE)) enemies[key].struggle = { url, ...enemies[key].struggle };
enemies.leash.struggle.scale = .74; // her struggle sheet is drawn bigger than enemy_11.png
export const STRUGGLE_SHEET = { rows: [6], trimFrames: true,
  frameRects: Array.from({ length: 6 }, (_, i) => ({ x: i * 256, y: 0, width: 256, height: 256, anchor: i * 256 + 128 })) };
export const knife = { url: knifeUrl, speed: 280, width: 34 };
// Textures thrown by enemies (throw.texture → url).
export const projectileTextures = { balon: ballUrl, paloma: pigeonUrl, spraycan: sprayCanUrl, 'juggling-club-source':JUGGLING_CLUB_URL };
