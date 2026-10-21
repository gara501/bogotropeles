import bossUrl from '../data/bosses/enemy_boss.png?url';
import effectsUrl from '../data/bosses/enemy_attacks.png?url';
import { sequence } from '../data/spriteSheets.js';

import { BOSS } from './balance.js';
export { BOSS } from './balance.js';

// Explicit rectangles isolate adjoining glows and detached props in generated art.
// x, y, width, height, body anchor X. All coordinates refer to the original PNG.
const cuts = [
  [79,2,128,170,143], [333,3,119,169,392], [585,3,128,169,649], [851,3,115,169,908],
  [62,176,128,168,126], [322,174,152,170,384], [552,190,220,155,626], [841,180,124,165,903],
  [64,351,140,167,134], [306,397,180,122,379], [527,348,285,171,651], [839,354,141,164,909],
  [62,526,138,173,131], [307,521,197,181,386], [566,534,225,167,643], [835,536,134,164,902],
  [63,708,132,171,129], [307,704,197,176,384], [564,704,180,176,638], [826,709,172,171,900],
  [62,884,138,168,131], [268,885,204,167,383], [515,884,310,169,637], [843,888,155,164,909],
  [46,1059,168,165,127], [309,1057,174,167,383], [543,1053,181,173,639], [842,1063,133,161,908],
  [53,1229,141,159,123], [320,1234,140,155,390], [559,1234,185,155,638], [834,1232,139,157,904],
  [49,1390,142,131,120], [307,1390,189,131,390], [524,1438,240,83,640], [782,1456,223,65,894],
];
export const bossSprite = {
  url: bossUrl, rows: Array(9).fill(4), height: 118, speed: BOSS.speed, hp: BOSS.hp, idle: 11,
  frameRects: cuts.map(([x,y,width,height,anchor]) => ({ x,y,width,height,anchor })),
  animations: { walk: sequence(0,3), melee: [11,15,23,15,11], pico: sequence(4,7), works: sequence(8,11), traffic: sequence(12,15), rain: sequence(16,19), paper: sequence(20,23), shield: sequence(24,27), hurt: sequence(28,31), defeat: sequence(32,35) },
};
export const bossEffects = {
  url: effectsUrl,
  frames: {
    zone1:[21,43,202,100], zone2:[236,43,181,100], zone3:[432,43,186,100],
    zone4:[631,43,180,100], zone5:[829,43,177,100], zone6:[1006,43,202,100], restricted:[1218,43,289,100],
    hole:[24,178,329,141], cone:[410,164,117,153], fence:[575,156,239,159], mesh:[851,157,308,155], rubble:[1179,173,333,144],
    taxi:[23,355,344,139], bus:[397,339,686,155], truck:[1113,326,398,170],
    cloud:[24,512,322,144], splash:[659,530,185,125], puddle:[911,546,313,118], umbrella:[1241,504,262,171],
    paper1:[82,672,181,140], paper2:[345,679,172,135], paper3:[581,677,163,137], papers:[817,653,326,163], stack:[1213,681,206,138],
    dome:[48,818,365,178], shield:[499,815,276,185], bubble:[867,822,190,185], tomorrow:[1216,822,183,167],
  },
};
