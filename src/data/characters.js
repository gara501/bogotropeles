import {COMBO_ART_LAYOUT} from './comboArtLayout.js';
import {COMBO_ROUTES} from './comboRoutes.js';
import officeChainUrl from './players/office_combos_v1.png?url';
import studentChainUrl from './players/student_combos_v1.png?url';
import teleperformanChainUrl from './players/teleperforman_combos_v1.png?url';
import gymbroChainUrl from './players/gymbro_combos_v1.png?url';
import magolitaChainUrl from './players/magolita_combos_v1.png?url';
import officeUrl from './players/player_1.png?url';
import studentUrl from './players/player_2.png?url';
import teleperformanUrl from './players/player_3.png?url';
import gymbroUrl from './players/player_4.png?url';
import magolitaUrl from './players/player_5.png?url';
import teleperformanComboUrl from './players/player_3_combo.png?url';
import teleperformanWalkUrl from './players/player_3_walking.png?url';
import gymbroGrabUrl from './players/player_4_agarre.png?url';
import officeGrabUrl from './players/player_1_agarre.png?url';
import officeWalkUrl from './players/player_1_walk.png?url';
import officeRunUrl from './players/player_1_run_clean.png?url';
import officeSlideUrl from './players/player_1_slide.png?url';
import studentGrabUrl from './players/player_2_agarre.png?url';
import studentWalkUrl from './players/player_2_walk.png?url';
import teleperformanGrabUrl from './players/player_3_agarre_consistent.png?url';
import magolitaGrabUrl from './players/player_5_agarre_clean.png?url';
import studentSlideUrl from './players/player_2_slide.png?url';
import studentKicksAirUrl from './players/player_2_kicks_air.png?url';
import teleperformanSlideUrl from './players/player_3_slide_clean.png?url';
import magolitaSlideUrl from './players/player_5_slide_clean.png?url';
import magolitaKicksUrl from './players/player_5_kicks.png?url';
import gymbroShoulderUrl from './players/player_4_shoulder.png?url';
import gymbroPiledriverUrl from './players/player_4_piledriver.png?url';
import teleperformanWalkPixelLabUrl from './players/player_3_walk.png?url';
import magolitaWalkUrl from './players/player_5_walk.png?url';
import gymbroRunUrl from './players/player_4_run.png?url';
import { sequence } from './spriteSheets.js';
import { IPHONE } from './iphone.js';
import { BOOKS } from './books.js';
import { PLAYER_ATLASES } from './playerAtlases.js';
import {ARCADE} from './arcade.js';

export const characters = {
  office: {
    name: 'GOMELORD', texture: 'office', url: officeUrl, rows:[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 3, 5, 5, 6],
    // Slightly smaller than the 116 px it had (the new sheet read too big next to the others).
    height: 106, speed: ARCADE.player.speeds.office, color: 0xd9dfcd, idle: 4, jump: 9,
    special:'iphone', specialLabel:'IPHONE', walkRate:24, walkFramesPerPose:3, /* run cycle: 3 ticks per pose (global default is 6) */ trimFrames:true, isolateFrames:true,
    // The updated art has touching rows and a detached phone. Explicit cuts
    // preserve the combat poses without treating the phone as another fighter.
    frameRects:PLAYER_ATLASES.office,
    // player agarre sheet stacked under the main sheet: frames 44-47 grab, 48-51 knee, 52-55 throw.
    // Corrected walk follows the grab sheet: frames 56-73 from the updated 18-pose sheet.
    // Frames 74-83: clean 10-frame run cycle (player_1_run_clean.png, 128x128 cells, alternating legs), stacked after the walk sheet.
    // Frames 84-89: native-scale slide, 320px cells and original guard exit.
    appendUrls: [officeGrabUrl, officeWalkUrl, officeRunUrl, officeSlideUrl],
    grab:{start:[44,45],hold:[46,47],knee:[48,49,50,51],kneeContact:50,throw:[52,53,54,55],throwContact:54},
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[44+i,157/295])),
      ...Object.fromEntries([180,184,172,183,180,187,183,179,185,171,182,180,178,181,180,184,171,182].map((height,i)=>[56+i,153/height])),
      // The run cells are drawn at ~104 px tall; one shared scale keeps the cycle's relative stride/lean.
      ...Object.fromEntries(Array.from({length:10},(_,i)=>[74+i,1.45]))},
    // Hip (or chest, for kicks) x of every pose, measured on the updated 11-row sheet.
    frameAnchors: {0:139,1:359,2:598,3:816,4:120,5:358,6:576,7:823,8:130,9:359,10:599,11:833,12:120,13:379,14:622,15:818,16:112,17:351,18:565,19:805,20:116,21:346,22:582,23:823,24:125,25:327,26:549,27:805,28:117,29:358,30:581,31:826,32:125,33:353,34:586,35:821,36:118,37:361,38:588,39:813,40:122,41:354,42:592,43:821,
      44:216,45:610,46:1016,47:1421,48:221,49:642,50:1041,51:1418,52:201,53:610,54:992,55:1421,
      56:114,57:380,58:637,59:874,60:1140,61:120,62:356,63:619,64:892,65:1149,66:112,67:369,68:634,69:868,70:1131,71:123,72:381,73:622,
      74:72,75:200,76:328,77:456,78:584,79:712,80:840,81:968,82:1096,83:1224,
      ...Object.fromEntries(Array.from({length:6},(_,i)=>[84+i,i*320+160]))},
    // K, K, K: three-kick combo (rows 9-11); the third kick pushes the opponent back.
    combo:{inputs:['kick','kick','kick'],animations:['combo1','combo2','combo3'],knockback:40},
    // Dash + K: a single slide kick that knocks the target down (the one-hit dash route is its own finisher).
    dashCombo:{inputs:['slide'],animations:['slide'],knockback:30},
    animations: { walk: sequence(74,83) /* previous 18-pose walk: sequence(56,73) */, punch: sequence(4, 7), kick: sequence(8, 11), dash: sequence(12, 15), iphone:[16,17,18,19,4], hurt: sequence(20, 23), defeat: sequence(24, 27), victory:sequence(28,31),
      combo1:sequence(32,35), combo2:sequence(36,39), combo3:sequence(40,43), slide:sequence(84,89) },
    attacks: {
      punch: { damage: 30, range: 88, duration: 260, hitAt: 110, knockback: 12 },
      kick: { damage: 45, range: 112, duration: 500, hitAt: 230, knockback: 30 },
      // slide: moves forward through startup/active until it connects; active shows both slide drawings.
      slide: { damage: 32, range: 80, duration: 500, hitAt: 150, knockback: 0, slide: true, activePoses:[86,87], recoveryPoses:[88,89] },
      iphone: { ...IPHONE.attack },
    },
  },
  student: {
    name: 'MACA DEMIA', texture: 'student', url: studentUrl, rows:[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 8, 4,4,4,4,4],
    height: 93, speed: ARCADE.player.speeds.student, walkRate: 15, walkFramesPerPose:4, color: 0xd6ed64, idle: 4, jump: 9,
    special:'books', specialLabel:'LIBROS', cleanFringes:true, isolateFrames:true, trimFrames:true,
    // Never animate frame 18: its embedded books would duplicate the orbit.
    frameRects:PLAYER_ATLASES.student,
    // player agarre sheet stacked under the main sheet: frames 40-43 grab, 44-47 knee, 48-51 throw.
    // PixelLab walk strip precedes the slide in the source stack; frames 58-65.
    appendUrls: [studentGrabUrl, studentWalkUrl, studentSlideUrl, studentKicksAirUrl],
    grab:{start:[40,41],hold:[42,43],knee:[44,45,46,47],kneeContact:46,throw:[48,49,50,51],throwContact:50},
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[40+i,181/312]))},
    frameAnchors: {0:145,1:334,2:542,3:761,4:94,5:310,6:520,7:743,8:93,9:299,10:519,11:741,12:109,13:313,14:496,15:740,16:98,17:287,18:537,19:749,20:99,21:323,22:512,23:743,24:101,25:289,26:469,27:712,28:97,29:294,30:521,31:749,32:97,33:286,34:529,35:713,36:93,37:312,38:542,39:731,
      40:173,41:556,42:953,43:1304,44:176,45:597,46:985,47:1306,48:187,49:545,50:926,51:1306,
      ...Object.fromEntries(Array.from({length:6},(_,i)=>[52+i,i*320+160])),
      // Shared hip axis in the fixed-size PixelLab walk cells.
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[58+i,i*224+132])),
      ...Object.fromEntries(Array.from({length:20},(_,i)=>[66+i,(i%4)*384+192]))},
    // H, H, J: jab, cross and a high kick (rows 9-10) that pushes the opponent back.
    combo:{inputs:['punch','punch','kick'],animations:['combo1','combo2','combo3'],knockback:40},
    kickCombo:{inputs:['kick','kick','kick'],animations:['kick1','kick2','kick3'],damages:[22,24,32],ranges:[100,104,118],knockback:32},
    airDashKick:{speed:660,window:12,flightFrames:28,flightHeight:14,bounceFrames:34,bounceHeight:60},
    // Dash + K: a single slide kick that knocks the target down (the one-hit dash route is its own finisher).
    dashCombo:{inputs:['slide'],animations:['slide'],knockback:30},
    animations: { walk: sequence(58, 65), punch: sequence(4, 7), kick:sequence(66,69),kick1:sequence(66,69),kick2:sequence(70,73),kick3:sequence(74,77),airDashKick:sequence(78,81),airBounce:sequence(82,85),lowKick: sequence(12, 15), books:[16,17,19,4], hurt: sequence(20, 23), defeat: sequence(24, 27), victory:sequence(28,31),
      combo1:[32,33,32], combo2:[32,35,32], combo3:sequence(36,39), slide:sequence(52,57) },
    attacks: {
      // slide: travels forward until it connects, then knocks down.
      slide: { damage: 30, range: 75, duration: 500, hitAt: 150, knockback: 0, slide: true, activePoses:[54,55], recoveryPoses:[56,57] },
      punch: { damage: 20, range: 83, duration: 210, hitAt: 90, knockback: 8 },
      kick: { damage: 30, range: 108, duration: 420, hitAt: 200, knockback: 20 },
      airDashKick:{damage:26,range:86,duration:350,hitAt:70,knockback:32,finisherKnockback:32,knockdown:true,airDash:true},
      lowKick: { damage: 24, range: 105, duration: 440, hitAt: 200, knockback: 24, stun: 650 },
      books:{...BOOKS.attack},
    },
  },
  teleperforman: {
    name: 'TELEPERFORMAN', texture: 'teleperforman', url: teleperformanUrl, rows:[6, 6, 5, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 2, 6, 8],
    // player_3_combo.png is stacked under the main sheet (frames 41-52, drawn at the main sheet's scale).
    // New PixelLab gait is stacked before the slide; its atlas indices are 93-100.
    appendUrls: [teleperformanComboUrl, teleperformanGrabUrl, teleperformanWalkUrl, teleperformanWalkPixelLabUrl, teleperformanSlideUrl],
    // The grab is rebuilt from the native guard instead of rescaling the older,
    // wider body. It uses the main fighter's anatomy and native pixel scale.
    // H,H,H combo (41-52): 178/308 puts the upright combo pose at the 178 px guard and its head (hair 34.7 px on screen)
    // at the guard's 34.5 px; .50 drew every punch about 12% smaller than the kick.
    frameScales: {...Object.fromEntries(Array.from({length:12},(_,i)=>[41+i,178/308])),...Object.fromEntries(Array.from({length:12},(_,i)=>[53+i,1])),
      ...Object.fromEntries([.935,.889,.958,.909,.832,.904].map((scale,i)=>[23+i,scale])),
      ...Object.fromEntries([170,168,165,164,164,164,167,165,163,163,166,168,168,165,164,163,166,167,165,162,163,166].map((height,i)=>[65+i,178/height])),
      // Locomotion must match the 178 px guard, not the unused 195 px opening pose.
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[93+i,178/195]))},
    // H, H, H: lanyard combo (longer reach); the third strike pushes the opponent back.
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],ranges:[150,170,150],knockback:40},
    // Dash + K: a single slide kick that knocks the target down (the one-hit dash route is its own finisher).
    dashCombo:{inputs:['slide'],animations:['slide'],knockback:30},
    height: 116, walkRate:15, walkFramesPerPose:4, speed: ARCADE.player.speeds.teleperforman, color: 0xb3ace6, idle: 6, jump: 19,
    special: 'headset', specialLabel: 'DIADEMA', cleanFringes:true,
    // Follow the hips, not the bounds of the extended arm, leg or headset.
    frameRects:PLAYER_ATLASES.teleperforman,
    // player agarre sheet stacked under the main sheet: frames 53-56 grab, 57-60 knee, 61-64 throw.
    grab:{start:[53,54],hold:[55,56],knee:[57,58,59,60],kneeContact:59,throw:[61,62,63,64],throwContact:63},
    isolateFrames:true, trimFrames:true,
    frameAnchors: {
      0:103,1:297,2:477,3:659,4:846,5:1019,
      6:85,7:272,8:451,9:642,10:838,11:1009,
      12:80,13:249,14:450,15:824,16:1015,
      17:84,18:272,19:461,20:652,21:850,22:1019,
      23:88,24:279,25:445,26:639,27:824,28:1013,
      29:85,30:289,31:460,32:628,33:811,34:970,
      35:87,36:271,37:462,38:645,39:825,40:1005,
      41:180,42:553,43:847,44:1295,45:170,46:548,47:962,48:1308,49:208,50:549,51:898,52:1292,
      ...Object.fromEntries(Array.from({length:12},(_,i)=>[53+i,(i%4)*362+181])),
      65:123,66:381,67:638,68:893,69:1148,70:126,71:379,72:637,73:892,74:1147,75:125,76:381,77:637,78:893,79:1148,80:125,81:381,82:635,83:893,84:1146,85:123,86:381,
      ...Object.fromEntries(Array.from({length:6},(_,i)=>[87+i,i*320+160])),
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[93+i,i*256+127]))},
    animations: { walk: sequence(93, 100), punch: sequence(6, 11), headset: sequence(12, 16), kick: sequence(17, 22), dash: sequence(23, 28), hurt:[30,31,29], defeat:[30,31,32,34], victory:sequence(35,40),
      combo1:sequence(41,44), combo2:sequence(45,48), combo3:sequence(49,52), slide:sequence(87,92) },
    attacks: {
      // slide: travels forward until it connects, then knocks down.
      slide: { damage: 30, range: 80, duration: 500, hitAt: 150, knockback: 0, slide: true, activePoses:[89,90], recoveryPoses:[91,92] },
      punch: { damage: 26, range: 88, duration: 250, hitAt: 110, knockback: 12 },
      kick: { damage: 36, range: 112, duration: 460, hitAt: 220, knockback: 24 },
      // Energy wave from the headset: longer wind-up and a 2.6 s recharge, heavier damage.
      headset: { damage: 75, range: 205, duration: 820, hitAt: 420, knockback: 34, stun: 550, cooldown: 2600, wave: true },
    },
  },
  gymbro: {
    name: 'GYMBRO', texture: 'gymbro', url: gymbroUrl, rows: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 8, 4,4,4],
    // player_4_agarre.png stacked under the main sheet: frames 32-35 grab, 36-39 knee, 40-43 throw.
    // Frames 44-49: native-scale shoulder charge, 320px cells.
    // PixelLab running replaces locomotion; frames 50-57. Shoulder keeps 44-49.
    appendUrls: [gymbroGrabUrl, gymbroRunUrl, gymbroShoulderUrl, gymbroPiledriverUrl],
    grab:{start:[32,33],hold:[34,35],knee:[36,37,38,39],kneeContact:38,throw:[40,41,42,43],throwContact:42},
    piledriver:{jumpFrames:36,jumpHeight:76,flightFrames:34,height:100,maxHeight:130,recovery:20,damage:110,stunMs:1500,landingRange:56,
      lift:[58,59,60],spin:[60,61,62,63,64,61,62,63,64,65],descend:66,impact:67,release:68,guard:69},
    // height +10% (106 → 117) so Gymbro reads at the same scale as the enemies.
    height: 117, speed: ARCADE.player.speeds.gymbro, walkRate:20, walkFramesPerPose:3, color: 0xf0b36c, idle: 4, jump: 21, trimFrames:true,
    dash: true, special: 'stomp', specialLabel: 'PISOTÓN',
    // Updated 1024 × 1536 sheet: walk, cross, jab/uppercut, fall, dash,
    // kick, hurt, victory. The stomp reuses the raised knee and planted foot.
    frameRects:PLAYER_ATLASES.gymbro,
    isolateFrames:true,
    frameAnchors:{0:158,1:390,2:656,3:898,4:140,5:403,6:632,7:900,8:139,9:398,10:644,11:901,12:143,13:398,14:632,15:881,16:141,17:397,18:638,19:900,20:144,21:402,22:641,23:900,24:141,25:402,26:644,27:901,28:130,29:391,30:640,31:892,
      32:175,33:560,34:942,35:1338,36:188,37:602,38:994,39:1328,40:181,41:573,42:938,43:1318,
      ...Object.fromEntries(Array.from({length:6},(_,i)=>[44+i,i*320+160])),
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[50+i,i*256+128])),
      ...Object.fromEntries(Array.from({length:12},(_,i)=>[58+i,(i%4)*256+128]))},
    // The front-facing victory row has a smaller body than the combat rows.
    // The older grab sheet is larger; shoulder poses now use native guard scale.
    frameScales:{...Object.fromEntries([0,1,2,3].map(i=>[i,.96])),28:198/182,29:198/182,30:198/182,31:198/182,
      ...Object.fromEntries(Array.from({length:12},(_,i)=>[32+i,198/305*.88])),
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[50+i,.96]))},
    punchCombo:{animations:['punch','punch2','punch3'],stun:350},
    // Dash + K: a single shoulder charge that knocks the target down (the one-hit dash route is its own finisher).
    dashCombo:{inputs:['shoulder'],animations:['shoulder'],knockback:30},
    animations: { walk: sequence(50, 57), punch: [8], punch2:[5,6,7], punch3:[9,10,11], kick: sequence(20,23), stomp:[20,21,20,23], hurt:sequence(24,27), defeat:sequence(12,15), dash:sequence(16,19), victory:sequence(28,31), shoulder:sequence(44,49),piledriver:sequence(58,69) },
    attacks: {
      // shoulder: travels forward until it connects, then knocks down.
      shoulder: { damage: 34, range: 82, duration: 500, hitAt: 150, knockback: 0, slide: true, activePoses:[46,47], recoveryPoses:[48,49] },
      punch: { damage: 38, range: 90, duration: 260, hitAt: 90, knockback: 20 },
      kick: { damage: 42, range: 100, duration: 480, hitAt: 240, knockback: 26 },
      // Ground stomp: knocks every nearby enemy down.
      stomp: { damage: 70, range: 150, area: true, duration: 700, hitAt: 350, knockback: 38, stun: 850, cooldown: 1400, knockdown: true },
    },
  },
  magolita: {
    name:'MAGOLITA',texture:'magolita',url:magolitaUrl,rows:[4,4,4,4,4,3,4,4,4,4, 4, 4, 4, 6, 8, 4,4,4,4],
    height:98,speed:ARCADE.player.speeds.magolita,walkRate:15,walkFramesPerPose:4,color:0x78b7e8,idle:0,jump:5,
    special:'mop',specialLabel:'TRAPERO',trimFrames:true,isolateFrames:true,
    frameRects:PLAYER_ATLASES.magolita,
    // player agarre sheet stacked under the main sheet: frames 39-42 grab, 43-46 knee, 47-50 throw.
    // PixelLab gait uses frames 57-64 and is stacked before the slide source.
    appendUrls: [magolitaGrabUrl, magolitaWalkUrl, magolitaSlideUrl, magolitaKicksUrl],
    grab:{start:[39,40],hold:[41,42],knee:[43,44,45,46],kneeContact:45,throw:[47,48,49,50],throwContact:49},
    // Slide poses are normalized in the source; only the older grab needs scaling.
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[39+i,34/61]))},
    // The raised mop overlaps the bucket row; keep each pose's own pixels.
    frameClips:{16:{bottom:629,left:35,right:111},37:{bottom:1341,left:583,right:616}},
    // Re-measured on the updated sheet (new walk cycle, whole sheet shifted a few px).
    frameAnchors:{0:160,1:392,2:641,3:894,4:161,5:404,6:656,7:925,
      8:157,9:398,10:616,11:905,12:167,13:409,14:650,15:910,16:144,17:406,18:616,19:906,
      20:155,21:398,22:907,23:131,24:392,25:641,26:885,27:140,28:386,29:617,30:882,
      31:133,32:389,33:628,34:886,35:137,36:370,37:644,38:913,
      ...Object.fromEntries(Array.from({length:12},(_,i)=>[39+i,(i%4)*512+256])),
      ...Object.fromEntries(Array.from({length:6},(_,i)=>[51+i,i*320+160])),
      ...Object.fromEntries(Array.from({length:8},(_,i)=>[57+i,i*256+145])),
      ...Object.fromEntries(Array.from({length:16},(_,i)=>[65+i,(i%4)*256+128]))},
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],knockback:30},
    kickCombo:{inputs:['kick','kick','kick','kick'],animations:['kick1','kick2','kick3','kick4'],
      damages:[12,14,16,22],ranges:[96,96,104,112],knockback:28},
    // Dash + K: a single slide kick that knocks the target down (the one-hit dash route is its own finisher).
    dashCombo:{inputs:['slide'],animations:['slide'],knockback:30},
    animations:{walk:sequence(57,64),punch:sequence(8,11),combo1:sequence(8,11),combo2:[13,14,15],combo3:sequence(23,26),
      kick:sequence(65,68),kick1:sequence(65,68),kick2:sequence(69,72),kick3:sequence(73,76),kick4:sequence(77,80),
      mop:sequence(16,19),dash:sequence(23,26),hurt:sequence(27,30),defeat:[31,32,34,34],victory:sequence(35,38), slide:sequence(51,56) },
    attacks:{
      // slide: travels forward until it connects, then knocks down.
      slide: { damage: 30, range: 80, duration: 500, hitAt: 150, knockback: 0, slide: true, activePoses:[53,54], recoveryPoses:[55,56] },
      punch:{damage:28,range:105,duration:280,hitAt:120,knockback:10},
      kick:{damage:12,range:96,duration:340,hitAt:120,knockback:12,finisherKnockback:18},
      // Mop swing: heavy hit that knocks down, with a soapy water wave sweeping the floor ahead (splash effect).
      mop:{damage:95,range:175,duration:700,hitAt:350,knockback:36,finisherKnockback:36,cooldown:1200,sound:'bar',knockdown:true,splash:true},
    },
  },
};

// All fighters share the command tree; artwork and combat stats remain individual.
const chainUrls={office:officeChainUrl,student:studentChainUrl,teleperforman:teleperformanChainUrl,gymbro:gymbroChainUrl,magolita:magolitaChainUrl};
const chainAnimations=['chainPunch1','chainPunch2','chainPunch3','chainKick1','chainKick2','chainKick3','chainSweep','chainUppercut'];
for(const [key,c] of Object.entries(characters)){
  const {start,y}=COMBO_ART_LAYOUT[key];
  c.comboRoutes=COMBO_ROUTES;c.comboArtStart=start;
  c.appendUrls=[...c.appendUrls,chainUrls[key]];
  c.rows=[...c.rows,...Array(8).fill(4)];
  c.frameRects=[...c.frameRects,...Array.from({length:32},(_,i)=>({x:(i%4)*256,y:y+Math.floor(i/4)*256,width:256,height:256}))];
  c.keepDetachedFrames=[...(c.keepDetachedFrames??[]),...Array.from({length:32},(_,i)=>start+i)];
  c.frameAnchors={...c.frameAnchors,...Object.fromEntries(Array.from({length:32},(_,i)=>[start+i,(i%4)*256+128]))};
  chainAnimations.forEach((name,row)=>c.animations[name]=sequence(start+row*4,start+row*4+3));
  c.animations.lowKick=c.animations.chainSweep;
  c.attacks.lowKick??={...c.attacks.kick};
}
