import url from './enemies/malabarista.png?url';
import clubUrl from './UI/juggling_club.png?url';

export const JUGGLING_CLUB_URL=clubUrl;
export const JUGGLING_CLUB_RECT={x:46,y:197,width:2081,height:371};
export const JUGGLER={name:'MALABARISTA',url,rows:[4,4,4,4,4],height:112,speed:220,hp:110,range:65,damage:5,idle:0,
  frameRects:[[68,35,179,289],[335,8,193,318],[590,10,210,315],[875,22,190,303],
    [59,334,180,247],[317,337,195,246],[579,335,219,248],[874,337,178,245],
    [42,590,213,272],[325,612,215,250],[563,618,390,244],[883,631,218,231],
    [64,871,188,246],[344,921,155,192],[560,941,268,148],[822,1033,281,71],
    [60,1185,203,187],[367,1116,131,199],[623,1111,157,261],[896,1123,170,249]]
    .map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:{0:149,1:410,2:680,3:958,4:150,5:435,6:705,7:1000,8:145,9:435,10:665,11:1010,
    12:170,13:420,14:680,15:980,16:160,17:425,18:705,19:995},
  isolateFrames:true,trimFrames:true,keepDetachedFrames:[1,2,3],keepDistance:270,
  juggler:{hopRange:100,hopDistance:155,hopFrames:20,hopCooldown:150,height:48},
  attackFrames:{startup:16,active:3,recovery:30,cooldown:72},
  throw:{minRange:175,maxRange:620,windup:500,active:7,recovery:540,cooldown:1800,
    speed:440,damage:18,texture:'juggling-club',width:43,height:9,lift:68,offset:58,spin:13,hitFrame:2,keepAway:true},
  animations:{idle:[0,1,2,3],walk:[4,5,6,7],attack:[8,10,11],throw:[8,9,10,11],hurt:[12,13],defeat:[14,15],jump:[16,17,16],struggle:[18,19]},
};
