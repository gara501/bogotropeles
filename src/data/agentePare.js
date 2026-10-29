import url from './enemies/agente_pare.png?url';
export const AGENTE_PARE={name:'AGENTE PAREDES',url,rows:[4,4,4,4,4,4],height:120,hp:380,speed:90,range:135,damage:19,idle:0,
  isolateFrames:true,trimFrames:true,
  frameRects:[[52,18,157,237],[315,18,145,237],[571,21,182,238],[832,18,178,237],
    [22,281,173,243],[275,267,178,257],[509,309,300,215],[801,301,216,221],
    [24,540,187,213],[271,550,198,203],[501,540,268,217],[810,540,177,214],
    [35,753,177,303],[285,765,177,284],[508,854,266,192],[805,880,205,168],
    [22,1088,223,207],[296,1101,182,194],[494,1086,266,209],[803,1139,209,162],
    [17,1311,236,184],[276,1351,238,145],[516,1367,218,129],[763,1420,251,79]]
    .map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([120,380,635,900,115,370,625,895,115,370,620,890,120,375,615,890,125,375,620,890,125,380,620,880].map((x,i)=>[i,x])),
  combo:{stages:3,windup:900,interval:720,recovery:400,cooldown:2600,hitFrames:[2,2,2],ranges:[135,155,180],confirmFirst:false,followThrough:true},
  animations:{idle:[0,1],walk:[2,3],attack:[4,5,6,7],attack1:[4,5,6,7],attack2:[8,9,10,11],attack3:[12,13,14,15],hurt:[16,17],defeat:[20,21,22,23]},
};
