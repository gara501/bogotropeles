import jugoUrl from './bosses/jugo_boss.png?url';
import meterUrl from './items/taximetro.png?url';
import attacksUrl from './bosses/jugo_attacks.png?url';

const extraCuts=[[47,19,329,257],[433,14,303,260],[805,16,281,267],[1158,15,330,262],
  [33,285,385,239],[444,284,301,239],[814,271,287,254],[1171,292,341,232],
  [97,539,216,193],[469,534,232,204],[851,535,221,213],[1236,542,217,195],
  [63,739,281,275],[429,779,283,218],[805,781,344,227],[1235,744,233,269]];
const extraAnchors=[210,600,937,1333,210,580,930,1310,203,587,960,1346,200,570,956,1353];

// Rows: guard/walk, throw, headbutts, belly/recovery, radio, defeat.
// Pose 6 excludes the loose meter: it is animated by the projectile atlas.
export const JUGO={name:'JUGO ESPINAS',url:jugoUrl,appendUrls:[attacksUrl],rows:[4,4,4,4,4,4,4,4,4,4],boss:true,
  isolateFrames:true,trimFrames:true,
  frameAnchors:Object.fromEntries(extraAnchors.map((x,i)=>[24+i,x])),
  frameScales:Object.fromEntries(extraCuts.map((_,i)=>[24+i,247/265])),
  jugo:{rage:60,hurt:18,rest:54,grabWindup:36,runSpeed:520,runDistance:570,runFrames:66,
    reach:36,grabDepth:17,hold:46,headWindup:18,headInterval:28,grabRecovery:55,
    rollWindup:54,rollSpeed:940,rollPasses:3,rollFrames:240,rollRadius:36,rollDepth:25,rollDamage:22,rollRecovery:70,bellyWindup:30},
  height:136,hp:2900,speed:175,range:112,damage:12,idle:0,
  frameRects:[[39,25,188,247],[283,28,200,244],[545,26,211,247],[809,28,204,245],
    [29,300,206,239],[274,287,237,252],[515,310,212,229],[778,311,240,228],
    [26,547,218,245],[280,564,217,228],[530,569,224,223],[794,577,206,215],
    [22,803,236,242],[279,805,219,240],[522,807,243,238],[809,806,190,239],
    [20,1050,215,260],[280,1067,214,243],[530,1064,254,246],[807,1066,202,244],
    [22,1319,233,209],[290,1328,194,200],[500,1331,274,193],[802,1353,213,174]]
    .map(([x,y,width,height])=>({x,y,width,height})).concat(extraCuts.map(([x,y,width,height])=>({x,y:y+1536,width,height}))),
  combo:{stages:3,windup:480,interval:260,recovery:180,cooldown:1600,
    hitFrames:[1,1,1],ranges:[112,122,155],confirmFirst:false,followThrough:true},
  throw:{minRange:200,maxRange:680,windup:650,active:2,recovery:480,cooldown:2400,
    speed:430,damage:15,texture:'taximeter',width:48,height:48,lift:76,offset:85,hitFrame:2,
    taximeter:{distance:720,flightFps:18,blastFps:20,blastSize:130}},
  animations:{idle:[0,1],walk:[2,3],throw:[4,5,6,7],attack:[8,9,11],run:[24,25,26,27],
    grabReach:[28],hold:[29],headbutt:[30,31],roll:[32,33,34,35],rage:[36],curl:[37],recover:[38,39],
    attack1:[8,9,11],attack2:[8,10,11],attack3:[12,13,15],hurt:[14,21],defeat:[20,21,22,23]},
};

export const TAXIMETER={url:meterUrl,frames:Object.fromEntries(Array.from({length:16},(_,i)=>{
  const x=Math.round(i%4*1254/4),y=Math.round(Math.floor(i/4)*1254/4);
  return [String(i),[x,y,Math.round((i%4+1)*1254/4)-x,Math.round((Math.floor(i/4)+1)*1254/4)-y]];
}))};
