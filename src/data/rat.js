import url from './enemies/rat.png?url';

export const RAT_SPRITE={
  name:'RATA',url,rows:[4,4,4,4],height:42,speed:185,hp:90,range:155,damage:8,idle:0,grabbable:false,
  hurtbox:{halfWidth:16,halfDepth:7},
  attackFrames:{startup:30,active:24,recovery:25,cooldown:100,range:44,lane:22},
  leap:{distance:145,height:58,landingGap:18,contactFrames:[9,21]},followThrough:true,
  trimFrames:true,isolateFrames:true,
  frameRects:[
    [19,86,354,140],[385,99,370,127],[764,97,366,130],[1144,98,378,129],
    [24,263,270,240],[378,374,372,129],[771,322,395,161],[1148,373,364,130],
    [19,528,279,227],[391,564,326,191],[771,608,337,147],[1148,610,368,139],
    [19,803,350,174],[404,831,339,137],[771,862,363,106],[1149,870,369,93],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([250,638,1018,1400,202,631,1008,1390,210,614,1009,1399,235,619,1006,1396].map((x,i)=>[i,x])),
  animations:{walk:[0,1,2,3],attack:[4,5,6,7],hurt:[8,9,10,11],defeat:[12,13,14,15]},
};
