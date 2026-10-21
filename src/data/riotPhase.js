import url from './bosses/enemy_boss_5_unshielded.png?url';

// Companion sheet is stacked below the original 948 × 1659 sheet.
export const RIOT_PHASE={url,below:.5,speedMultiplier:1.75,transitionMs:850,
  count:4,windup:450,interval:180,recovery:130,cooldown:3300,rest:550,margin:20,depthMovement:.35,hitFrame:1,
  idle:27,breakPoses:[24,25,26,27],
  animations:{walk:[28,29,30,31],throw:[32,33,34,35],attack:[36,37,38,39],hurt:[40,41,42,43],defeat:[44,45,46,47]},
  animationKeys:{walk:'bareWalk',throw:'bareThrow',attack:'bareAttack',hurt:'bareHurt',defeat:'bareDefeat'},
  rects:[
    [19,33,258,252],[287,32,239,253],[531,32,274,253],[828,32,164,253],
    [25,311,193,250],[309,313,154,250],[544,311,170,252],[802,311,188,252],
    [12,577,197,244],[264,579,283,242],[529,579,195,242],[796,578,185,243],
    [20,838,205,236],[285,839,226,235],[542,839,225,235],[799,840,183,234],
    [28,1097,184,238],[297,1089,208,246],[548,1110,214,223],[815,1113,183,222],
    [16,1340,231,165],[259,1362,238,152],[511,1419,251,87],[777,1434,233,73],
  ],
  anchors:[124,379,622,907,127,390,627,898,111,369,624,881,126,383,638,895,
    120,385,644,906,120,367,622,882],
};
