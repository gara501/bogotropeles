import officeUrl from './players/player_1.png?url';
import studentUrl from './players/player_2.png?url';
import teleperformanUrl from './players/player_3.png?url';
import gymbroUrl from './players/player_4.png?url';
import magolitaUrl from './players/player_5.png?url';
import teleperformanComboUrl from './players/player_3_combo.png?url';
import gymbroGrabUrl from './players/player_4_agarre.png?url';
import officeGrabUrl from './players/player_1_agarre.png?url';
import officeWalkUrl from './players/player_1_walk.png?url';
import studentGrabUrl from './players/player_2_agarre.png?url';
import teleperformanGrabUrl from './players/player_3_agarre.png?url';
import magolitaGrabUrl from './players/player_5_agarre.png?url';
import { sequence } from './spriteSheets.js';
import { IPHONE } from './iphone.js';
import { BOOKS } from './books.js';
import { PLAYER_ATLASES } from './playerAtlases.js';
import {ARCADE} from './arcade.js';

export const characters = {
  office: {
    name: 'GOMELO', texture: 'office', url: officeUrl, rows:[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3],
    // Slightly smaller than the 116 px it had (the new sheet read too big next to the others).
    height: 106, speed: ARCADE.player.speeds.office, color: 0xd9dfcd, idle: 4, jump: 9,
    special:'iphone', specialLabel:'IPHONE', walkRate:8, trimFrames:true, isolateFrames:true,
    // The updated art has touching rows and a detached phone. Explicit cuts
    // preserve the combat poses without treating the phone as another fighter.
    frameRects:PLAYER_ATLASES.office,
    // player agarre sheet stacked under the main sheet: frames 44-47 grab, 48-51 knee, 52-55 throw.
    // Corrected walk follows the grab sheet: frames 56-61, one complete stride.
    appendUrls: [officeGrabUrl, officeWalkUrl],
    grab:{start:[44,45],hold:[46,47],knee:[48,49,50,51],kneeContact:50,throw:[52,53,54,55],throwContact:54},
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[44+i,157/295])),
      ...Object.fromEntries([396,398,399,382,386,379].map((height,i)=>[56+i,153/height]))},
    // Hip (or chest, for kicks) x of every pose, measured on the updated 11-row sheet.
    frameAnchors: {0:139,1:359,2:598,3:816,4:120,5:358,6:576,7:823,8:130,9:359,10:599,11:833,12:120,13:379,14:622,15:818,16:112,17:351,18:565,19:805,20:116,21:346,22:582,23:823,24:125,25:327,26:549,27:805,28:117,29:358,30:581,31:826,32:125,33:353,34:586,35:821,36:118,37:361,38:588,39:813,40:122,41:354,42:592,43:821,
      44:216,45:610,46:1016,47:1421,48:221,49:642,50:1041,51:1418,52:201,53:610,54:992,55:1421,
      56:240,57:694,58:1115,59:229,60:686,61:1110},
    // K, K, K: three-kick combo (rows 9-11); the third kick pushes the opponent back.
    combo:{inputs:['kick','kick','kick'],animations:['combo1','combo2','combo3'],knockback:40},
    animations: { walk: sequence(56,61), punch: sequence(4, 7), kick: sequence(8, 11), dash: sequence(12, 15), iphone:[16,17,18,19,4], hurt: sequence(20, 23), defeat: sequence(24, 27), victory:sequence(28,31),
      combo1:sequence(32,35), combo2:sequence(36,39), combo3:sequence(40,43) },
    attacks: {
      punch: { damage: 30, range: 88, duration: 260, hitAt: 110, knockback: 12 },
      kick: { damage: 45, range: 112, duration: 500, hitAt: 230, knockback: 30 },
      iphone: { ...IPHONE.attack },
    },
  },
  student: {
    name: 'UNIVERSITARIA', texture: 'student', url: studentUrl, rows:[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    height: 99, speed: ARCADE.player.speeds.student, walkRate: 13, color: 0xd6ed64, idle: 4, jump: 9,
    special:'books', specialLabel:'LIBROS', cleanFringes:true, isolateFrames:true, trimFrames:true,
    // Never animate frame 18: its embedded books would duplicate the orbit.
    frameRects:PLAYER_ATLASES.student,
    // player agarre sheet stacked under the main sheet: frames 40-43 grab, 44-47 knee, 48-51 throw.
    appendUrls: [studentGrabUrl],
    grab:{start:[40,41],hold:[42,43],knee:[44,45,46,47],kneeContact:46,throw:[48,49,50,51],throwContact:50},
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[40+i,181/312]))},
    frameAnchors: {0:145,1:334,2:542,3:761,4:94,5:310,6:520,7:743,8:93,9:299,10:519,11:741,12:109,13:313,14:496,15:740,16:98,17:287,18:537,19:749,20:99,21:323,22:512,23:743,24:101,25:289,26:469,27:712,28:97,29:294,30:521,31:749,32:97,33:286,34:529,35:713,36:93,37:312,38:542,39:731,
      40:173,41:556,42:953,43:1304,44:176,45:597,46:985,47:1306,48:187,49:545,50:926,51:1306},
    // H, H, J: jab, cross and a high kick (rows 9-10) that pushes the opponent back.
    combo:{inputs:['punch','punch','kick'],animations:['combo1','combo2','combo3'],knockback:40},
    animations: { walk: sequence(0, 3), punch: sequence(4, 7), kick: sequence(8, 11), lowKick: sequence(12, 15), books:[16,17,19,4], hurt: sequence(20, 23), defeat: sequence(24, 27), victory:sequence(28,31),
      combo1:[32,33,32], combo2:[32,35,32], combo3:sequence(36,39) },
    attacks: {
      punch: { damage: 20, range: 83, duration: 210, hitAt: 90, knockback: 8 },
      kick: { damage: 30, range: 108, duration: 420, hitAt: 200, knockback: 20 },
      lowKick: { damage: 24, range: 105, duration: 440, hitAt: 200, knockback: 24, stun: 650 },
      books:{...BOOKS.attack},
    },
  },
  teleperforman: {
    name: 'TELEPERFORMAN', texture: 'teleperforman', url: teleperformanUrl, rows:[6, 6, 5, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4],
    // player_3_combo.png is stacked under the main sheet (frames 41-52, drawn at the main sheet's scale).
    appendUrls: [teleperformanComboUrl, teleperformanGrabUrl],
    frameScales: {...Object.fromEntries(Array.from({length:12},(_,i)=>[41+i,178/303])),...Object.fromEntries(Array.from({length:12},(_,i)=>[53+i,178/318]))},
    // H, H, H: lanyard combo (longer reach); the third strike pushes the opponent back.
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],ranges:[150,170,150],knockback:40},
    height: 116, speed: ARCADE.player.speeds.teleperforman, color: 0xb3ace6, idle: 6, jump: 19,
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
      53:175,54:528,55:897,56:1261,57:171,58:548,59:913,60:1254,61:191,62:505,63:891,64:1248},
    animations: { walk: sequence(0, 5), punch: sequence(6, 11), headset: sequence(12, 16), kick: sequence(17, 22), dash: sequence(23, 28), hurt:[30,31,29], defeat:[30,31,32,34], victory:sequence(35,40),
      combo1:sequence(41,44), combo2:sequence(45,48), combo3:sequence(49,52) },
    attacks: {
      punch: { damage: 26, range: 88, duration: 250, hitAt: 110, knockback: 12 },
      kick: { damage: 36, range: 112, duration: 460, hitAt: 220, knockback: 24 },
      // Energy wave from the headset: longer wind-up and a 2.6 s recharge, heavier damage.
      headset: { damage: 75, range: 205, duration: 820, hitAt: 420, knockback: 34, stun: 550, cooldown: 2600, wave: true },
    },
  },
  gymbro: {
    name: 'GYMBRO', texture: 'gymbro', url: gymbroUrl, rows: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    // player_4_agarre.png stacked under the main sheet: frames 32-35 grab, 36-39 knee, 40-43 throw.
    appendUrls: [gymbroGrabUrl],
    grab:{start:[32,33],hold:[34,35],knee:[36,37,38,39],kneeContact:38,throw:[40,41,42,43],throwContact:42},
    // height +10% (106 → 117) so Gymbro reads at the same scale as the enemies.
    height: 117, speed: ARCADE.player.speeds.gymbro, color: 0xf0b36c, idle: 4, jump: 21, trimFrames:true,
    dash: true, special: 'stomp', specialLabel: 'PISOTÓN',
    // Updated 1024 × 1536 sheet: walk, cross, jab/uppercut, fall, dash,
    // kick, hurt, victory. The stomp reuses the raised knee and planted foot.
    frameRects:PLAYER_ATLASES.gymbro,
    isolateFrames:true,
    frameAnchors:{0:158,1:390,2:656,3:898,4:140,5:403,6:632,7:900,8:139,9:398,10:644,11:901,12:143,13:398,14:632,15:881,16:141,17:397,18:638,19:900,20:144,21:402,22:641,23:900,24:141,25:402,26:644,27:901,28:130,29:391,30:640,31:892,
      32:175,33:560,34:942,35:1338,36:188,37:602,38:994,39:1328,40:181,41:573,42:938,43:1318},
    // The front-facing victory row has a smaller body than the combat rows.
    frameScales:{28:198/182,29:198/182,30:198/182,31:198/182,...Object.fromEntries(Array.from({length:12},(_,i)=>[32+i,198/305]))},
    punchCombo:{animations:['punch','punch2','punch3'],stun:350},
    animations: { walk: sequence(0, 3), punch: [8], punch2:[5,6,7], punch3:[9,10,11], kick: sequence(20,23), stomp:[20,21,20,23], hurt:sequence(24,27), defeat:sequence(12,15), dash:sequence(16,19), victory:sequence(28,31) },
    attacks: {
      punch: { damage: 38, range: 90, duration: 260, hitAt: 90, knockback: 20 },
      kick: { damage: 42, range: 100, duration: 480, hitAt: 240, knockback: 26 },
      // Ground stomp: knocks every nearby enemy down.
      stomp: { damage: 70, range: 150, area: true, duration: 700, hitAt: 350, knockback: 38, stun: 850, cooldown: 1400, knockdown: true },
    },
  },
  magolita: {
    name:'MAGOLITA',texture:'magolita',url:magolitaUrl,rows:[4,4,4,4,4,3,4,4,4,4, 4, 4, 4],
    height:98,speed:ARCADE.player.speeds.magolita,color:0x78b7e8,idle:0,jump:5,
    special:'mop',specialLabel:'TRAPERO',trimFrames:true,isolateFrames:true,
    frameRects:PLAYER_ATLASES.magolita,
    // player agarre sheet stacked under the main sheet: frames 39-42 grab, 43-46 knee, 47-50 throw.
    appendUrls: [magolitaGrabUrl],
    grab:{start:[39,40],hold:[41,42],knee:[43,44,45,46],kneeContact:45,throw:[47,48,49,50],throwContact:49},
    frameScales:{...Object.fromEntries(Array.from({length:12},(_,i)=>[39+i,153/258]))},
    // The raised mop overlaps the bucket row; keep each pose's own pixels.
    frameClips:{16:{bottom:629,left:35,right:111},37:{bottom:1341,left:583,right:616}},
    // Re-measured on the updated sheet (new walk cycle, whole sheet shifted a few px).
    frameAnchors:{0:160,1:392,2:641,3:894,4:161,5:404,6:656,7:925,
      8:157,9:398,10:616,11:905,12:167,13:409,14:650,15:910,16:144,17:406,18:616,19:906,
      20:155,21:398,22:907,23:131,24:392,25:641,26:885,27:140,28:386,29:617,30:882,
      31:133,32:389,33:628,34:886,35:137,36:370,37:644,38:913,
      39:293,40:766,41:1304,42:1763,43:283,44:811,45:1311,46:1752,47:311,48:767,49:1275,50:1740},
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],knockback:30},
    animations:{walk:sequence(4,7),punch:sequence(8,11),combo1:sequence(8,11),combo2:[13,14,15],combo3:sequence(23,26),
      kick:[20,21,22],mop:sequence(16,19),dash:sequence(23,26),hurt:sequence(27,30),defeat:[31,32,34,34],victory:sequence(35,38)},
    attacks:{
      punch:{damage:28,range:105,duration:280,hitAt:120,knockback:10},
      kick:{damage:36,range:170,duration:480,hitAt:230,knockback:24},
      // Mop swing: heavy hit that knocks down, with a soapy water wave sweeping the floor ahead (splash effect).
      mop:{damage:95,range:175,duration:700,hitAt:350,knockback:36,finisherKnockback:36,cooldown:1200,sound:'bar',knockdown:true,splash:true},
    },
  },
};
