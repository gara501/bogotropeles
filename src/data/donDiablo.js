import url from './enemies/don_diablo.png?url';
import cartUrl from './items/diablito.png?url';
export const DIABLITO_URL=cartUrl;
export const DON_DIABLO={name:'DON DIABLO',url,rows:Array(5).fill(4),height:116,speed:155,hp:260,range:70,damage:8,idle:16,diablito:true,
  frameRects:[
    [102,8,232,223],[452,8,208,224],[786,8,214,224],[1127,8,209,224],
    [57,246,260,206],[427,243,242,212],[758,249,260,204],[1120,246,252,207],
    [97,472,229,218],[439,483,230,212],[817,461,149,240],[1152,461,178,235],
    [86,695,233,190],[418,710,217,176],[760,742,247,139],[1077,780,298,96],
    [97,893,180,220],[444,892,174,223],[733,896,273,213],[1117,895,225,219],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  isolateFrames:true,trimFrames:true,frameAnchors:{0:198,1:541,2:877,3:1226,4:183,5:547,6:881,7:1241,18:839},
  attackFrames:{startup:24,active:3,recovery:34,cooldown:96},
  animations:{idle:[16],walk:[17,16],cartWalk:[0,1,2,3],push:[4,5,6,7],recoverCart:[8,9,10,11],attack:[16,18,16],hurt:[12,13],defeat:[14,15],struggle:[12,19]},
};
