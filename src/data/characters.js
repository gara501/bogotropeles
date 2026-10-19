import officeUrl from './player_1.png?url';
import studentUrl from './player_2.png?url';
import teleperformanUrl from './player_3.png?url';
import gymbroUrl from './player_4.png?url';
import magolitaUrl from './player_5.png?url';
import teleperformanComboUrl from './player_3_combo.png?url';
import { sequence } from './spriteSheets.js';
import { IPHONE } from './iphone.js';
import { BOOKS } from './books.js';
import { PLAYER_ATLASES } from './playerAtlases.js';
import {ARCADE} from './arcade.js';

export const characters = {
  office: {
    name: 'GOMELO', texture: 'office', url: officeUrl, rows: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    // Slightly smaller than the 116 px it had (the new sheet read too big next to the others).
    height: 106, speed: ARCADE.player.speeds.office, color: 0xd9dfcd, idle: 4, jump: 9,
    special:'iphone', specialLabel:'IPHONE', walkRate:8, trimFrames:true, isolateFrames:true,
    // The updated art has touching rows and a detached phone. Explicit cuts
    // preserve all 32 poses without treating the phone as another fighter.
    frameRects:PLAYER_ATLASES.office,
    // Hip (or chest, for kicks) x of every pose, measured on the updated 11-row sheet.
    frameAnchors: {0:139,1:359,2:598,3:816,4:120,5:358,6:576,7:823,8:130,9:359,10:599,11:833,12:120,13:379,14:622,15:818,16:112,17:351,18:565,19:805,20:116,21:346,22:582,23:823,24:125,25:327,26:549,27:805,28:117,29:358,30:581,31:826,32:125,33:353,34:586,35:821,36:118,37:361,38:588,39:813,40:122,41:354,42:592,43:821},
    // K, K, K: three-kick combo (rows 9-11); the third kick pushes the opponent back.
    combo:{inputs:['kick','kick','kick'],animations:['combo1','combo2','combo3'],knockback:40},
    animations: { walk: [0,1,3,1], punch: sequence(4, 7), kick: sequence(8, 11), dash: sequence(12, 15), iphone:[16,17,18,19,4], hurt: sequence(20, 23), defeat: sequence(24, 27), victory:sequence(28,31),
      combo1:sequence(32,35), combo2:sequence(36,39), combo3:sequence(40,43) },
    attacks: {
      punch: { damage: 30, range: 88, duration: 260, hitAt: 110, knockback: 12 },
      kick: { damage: 45, range: 112, duration: 500, hitAt: 230, knockback: 30 },
      iphone: { ...IPHONE.attack },
    },
  },
  student: {
    name: 'UNIVERSITARIA', texture: 'student', url: studentUrl, rows: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    height: 99, speed: ARCADE.player.speeds.student, walkRate: 13, color: 0xd6ed64, idle: 4, jump: 9,
    special:'books', specialLabel:'LIBROS', cleanFringes:true, isolateFrames:true, trimFrames:true,
    // Never animate frame 18: its embedded books would duplicate the orbit.
    frameRects:PLAYER_ATLASES.student,
    frameAnchors: {0:145,1:334,2:542,3:761,4:94,5:310,6:520,7:743,8:93,9:299,10:519,11:741,12:109,13:313,14:496,15:740,16:98,17:287,18:537,19:749,20:99,21:323,22:512,23:743,24:101,25:289,26:469,27:712,28:97,29:294,30:521,31:749,32:97,33:286,34:529,35:713,36:93,37:312,38:542,39:731},
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
    name: 'TELEPERFORMAN', texture: 'teleperforman', url: teleperformanUrl, rows: [6, 6, 5, 6, 6, 6, 6, 4, 4, 4],
    // player_3_combo.png is stacked under the main sheet (frames 41-52, drawn at the main sheet's scale).
    appendUrl: teleperformanComboUrl,
    frameScales: Object.fromEntries(Array.from({length:12},(_,i)=>[41+i,178/303])),
    // H, H, H: lanyard combo (longer reach); the third strike pushes the opponent back.
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],ranges:[150,170,150],knockback:40},
    height: 116, speed: ARCADE.player.speeds.teleperforman, color: 0xb3ace6, idle: 6, jump: 19,
    special: 'headset', specialLabel: 'DIADEMA', cleanFringes:true,
    // Follow the hips, not the bounds of the extended arm, leg or headset.
    frameRects:PLAYER_ATLASES.teleperforman,
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
    },
    animations: { walk: sequence(0, 5), punch: sequence(6, 11), headset: sequence(12, 16), kick: sequence(17, 22), dash: sequence(23, 28), hurt:[30,31,29], defeat:[30,31,32,34], victory:sequence(35,40),
      combo1:sequence(41,44), combo2:sequence(45,48), combo3:sequence(49,52) },
    attacks: {
      punch: { damage: 26, range: 88, duration: 250, hitAt: 110, knockback: 12 },
      kick: { damage: 36, range: 112, duration: 460, hitAt: 220, knockback: 24 },
      headset: { damage: 40, range: 185, duration: 620, hitAt: 300, knockback: 30, stun: 450 },
    },
  },
  gymbro: {
    name: 'GYMBRO', texture: 'gymbro', url: gymbroUrl, rows: [4, 4, 4, 4, 4, 4, 4, 4],
    // height +10% (106 → 117) so Gymbro reads at the same scale as the enemies.
    height: 117, speed: ARCADE.player.speeds.gymbro, color: 0xf0b36c, idle: 4, jump: 21, trimFrames:true,
    dash: true, special: 'stomp', specialLabel: 'PISOTÓN',
    // Updated 1024 × 1536 sheet: walk, cross, jab/uppercut, fall, dash,
    // kick, hurt, victory. The stomp reuses the raised knee and planted foot.
    frameRects:PLAYER_ATLASES.gymbro,
    isolateFrames:true,
    frameAnchors:{0:158,1:390,2:656,3:898,4:140,5:403,6:632,7:900,8:139,9:398,10:644,11:901,12:143,13:398,14:632,15:881,16:141,17:397,18:638,19:900,20:144,21:402,22:641,23:900,24:141,25:402,26:644,27:901,28:130,29:391,30:640,31:892},
    // The front-facing victory row has a smaller body than the combat rows.
    frameScales:{28:198/182,29:198/182,30:198/182,31:198/182},
    punchCombo:{animations:['punch','punch2','punch3'],stun:350},
    animations: { walk: sequence(0, 3), punch: [8], punch2:[5,6,7], punch3:[9,10,11], kick: sequence(20,23), stomp:[20,21,20,23], hurt:sequence(24,27), defeat:sequence(12,15), dash:sequence(16,19), victory:sequence(28,31) },
    attacks: {
      punch: { damage: 38, range: 90, duration: 260, hitAt: 90, knockback: 20 },
      kick: { damage: 42, range: 100, duration: 480, hitAt: 240, knockback: 26 },
      stomp: { damage: 45, range: 145, area: true, duration: 700, hitAt: 350, knockback: 38, stun: 850, cooldown: 1400 },
    },
  },
  magolita: {
    name:'MAGOLITA',texture:'magolita',url:magolitaUrl,rows:[4,4,4,4,4,3,4,4,4,4],
    height:106,speed:ARCADE.player.speeds.magolita,color:0x78b7e8,idle:0,jump:5,
    special:'mop',specialLabel:'TRAPERO',trimFrames:true,isolateFrames:true,
    frameRects:PLAYER_ATLASES.magolita,
    // The raised mop overlaps the bucket row; keep each pose's own pixels.
    frameClips:{16:{bottom:627,left:36,right:109},37:{bottom:1330,left:575,right:638}},
    frameAnchors:{0:155,1:393,2:638,3:895,4:151,5:387,6:635,7:880,
      8:137,9:383,10:627,11:890,12:145,13:382,14:625,15:892,16:137,17:377,18:626,19:904,
      20:137,21:380,22:895,23:140,24:375,25:626,26:888,27:142,28:382,29:622,30:891,
      31:130,32:385,33:620,34:880,35:142,36:383,37:629,38:895},
    combo:{inputs:['punch','punch','punch'],animations:['combo1','combo2','combo3'],knockback:30},
    animations:{walk:sequence(4,7),punch:sequence(8,11),combo1:sequence(8,11),combo2:[13,14,15],combo3:sequence(23,26),
      kick:[20,21,22],mop:sequence(16,19),dash:sequence(23,26),hurt:sequence(27,30),defeat:[31,32,34,34],victory:sequence(35,38)},
    attacks:{
      punch:{damage:28,range:105,duration:280,hitAt:120,knockback:10},
      kick:{damage:36,range:170,duration:480,hitAt:230,knockback:24},
      mop:{damage:56,range:165,duration:700,hitAt:350,knockback:32,finisherKnockback:32,cooldown:1200,sound:'bar'},
    },
  },
};
