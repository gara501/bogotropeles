import url from './enemies/ortencio.png?url';

export const ORTENCIO={name:'ORTENCIO',url,rows:[4,4,4,4,4,4],height:118,hp:260,speed:185,range:75,damage:0,idle:0,
  isolateFrames:true,trimFrames:true,
  frameRects:[[34,23,202,248],[296,23,182,248],[550,19,160,252],[800,22,174,249],
    [16,295,221,212],[271,295,194,212],[524,294,216,215],[780,296,234,212],
    [22,523,197,229],[246,533,286,218],[529,523,223,229],[792,516,213,236],
    [33,806,171,182],[274,754,227,182],[520,781,239,181],[800,818,209,178],
    [35,1011,209,236],[286,1006,184,243],[508,1038,256,189],[774,1103,227,151],
    [28,1265,172,236],[252,1329,228,167],[486,1375,263,114],[768,1401,244,92]]
    .map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([130,385,632,875,127,375,640,900,124,353,630,900,120,381,625,888,137,379,636,885,127,363,618,890].map((x,i)=>[i,x])),
  ortencio:{windup:48,runSpeed:480,distance:520,runFrames:78,startRange:520,reach:30,depth:17,
    holdOffset:48,holdFrames:180,escapePresses:6,releaseGuard:350,cooldown:155},
  dodge:{range:155,chance:.8,cooldown:1300,distance:110,height:38,duration:300,poses:[12,13,14,15]},
  animations:{idle:[0,1],walk:[2,3],run:[4,5,6,7],prepare:[8],reach:[9,10],hold:[11],
    attack:[9,10],jump:[12,13,14,15],hurt:[16,17],defeat:[20,21,22,23],getup:[15],struggle:[10,11]},
};
