import url from './enemies/don_pico.png?url';
import henUrl from './enemies/pico_hen.png?url';

export const DON_PICO={name:'DON PICO',url,rows:Array(6).fill(4),height:115,speed:175,hp:210,range:112,damage:14,idle:0,pollero:true,
  frameRects:[
    [99,7,158,223],[404,8,156,222],[716,8,152,222],[1027,8,151,222],
    [87,237,176,197],[395,238,180,195],[708,240,181,194],[1012,238,184,196],
    [89,472,183,173],[395,478,220,171],[687,454,243,191],[1027,439,163,207],
    [64,642,216,223],[390,646,187,221],[656,684,340,179],[1014,658,180,209],
    [75,873,225,175],[395,886,171,162],[636,867,293,177],[942,937,280,102],
    [101,1054,187,196],[403,1058,196,190],[697,1048,204,199],[992,1066,229,179],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  isolateFrames:true,trimFrames:true,frameAnchors:{8:175,9:483,10:777,14:764},
  attackFrames:{startup:30,active:3,recovery:35,cooldown:90},followThrough:true,
  animations:{idle:[0,1,2,3],walk:[4,5,6,7],release:[8,9,10,11],attack:[12,13,14,15],hurt:[16,17],defeat:[18,19],struggle:[20,21,22,23]},
};
export const HEN_SHEET={url:henUrl,rows:[4,4,4],height:25,idle:0,isolateFrames:true,trimFrames:true,
  frameRects:[
    [44,120,303,229],[409,128,304,225],[771,128,307,225],[1135,132,284,222],
    [35,446,313,235],[411,445,285,235],[771,445,260,241],[1122,445,303,234],
    [25,754,289,251],[414,779,297,215],[767,766,304,232],[1132,754,294,251],
  ].map(([x,y,width,height])=>({x,y,width,height})),animations:{run:[0,1,2,3],peck:[4,5,6,7],tumble:[8,9,10,11]},
};
