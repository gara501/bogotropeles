import url from './enemies/guitarist.png?url';
import struggleUrl from './enemies/guitarist_grab_struggle.png?url';

export const GUITARIST_STRUGGLE={rows:[3,3],trimFrames:true,isolateFrames:true,
  frameRects:[[150,5,337,501],[632,16,359,490],[1110,9,348,497],[129,536,321,476],[614,517,340,498],[1110,518,337,498]]
    .map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([321,800,1288,295,772,1285].map((x,i)=>[i,x])),
};
export const GUITARIST={
  name:'GUITARRISTA',url,rows:[4,4,4,4,4,4],height:119,speed:115,hp:280,range:155,damage:14,idle:0,
  attackFrames:{active:4},
  combo:{stages:2,windup:600,interval:240,recovery:320,cooldown:1800,hitFrames:[2,2],ranges:[155,175],confirmFirst:false,followThrough:true},
  struggle:{url:struggleUrl,sheet:GUITARIST_STRUGGLE,scale:252/493},
  trimFrames:true,isolateFrames:true,
  frameRects:[
    [79,10,177,260],[331,11,167,259],[576,22,164,248],[834,15,167,255],
    [23,284,210,237],[280,278,171,243],[541,291,304,230],[858,294,149,227],
    [52,532,163,277],[316,524,162,285],[537,566,255,243],[805,592,215,217],
    [39,829,213,230],[280,830,244,227],[585,849,151,214],[834,829,178,236],
    [7,1070,254,174],[277,1097,209,184],[495,1148,261,122],[761,1145,261,120],
    [41,1287,179,242],[300,1331,174,172],[527,1308,203,198],[839,1281,173,248],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([166,418,667,926,128,381,654,945,135,400,648,910,132,385,668,936,124,367,627,905,133,379,642,935].map((x,i)=>[i,x])),
  animations:{walk:[0,1,2,3],attack:[4,5,6,7],attack1:[4,5,6,7],attack2:[8,9,10,11],hurt:[12,13,14,15],defeat:[16,17,18,19],evade:[21,22,22,23],getup:[22,23]},
};
