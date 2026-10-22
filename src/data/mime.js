import url from './enemies/parlanchin.png?url';

export const MIME={name:'PARLANCHÍN',url,rows:Array(7).fill(4),height:119,speed:305,hp:160,range:225,damage:12,idle:0,mime:true,walkRate:15,
  frameRects:[
    [40,19,174,218],[303,16,164,222],[570,9,149,228],[837,56,182,182],
    [39,248,193,185],[276,244,216,189],[542,250,228,183],[843,253,183,182],
    [41,497,168,144],[295,441,169,175],[539,441,284,152],[822,500,208,147],
    [41,661,176,193],[318,661,197,195],[547,637,171,225],[795,715,238,147],
    [23,864,180,211],[300,872,163,205],[552,869,195,206],[799,868,233,217],
    [54,1084,187,184],[300,1106,132,159],[525,1083,220,182],[787,1195,267,55],
    [50,1275,146,197],[282,1276,225,192],[562,1261,186,209],[809,1300,226,168],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:{8:125,9:380,10:625,11:910},trimFrames:true,isolateFrames:true,
  attackFrames:{startup:22,active:30,recovery:30,cooldown:72,range:62,lane:29},
  leap:{label:'¡PATADA!',distance:215,height:52,landingGap:24,contactFrames:[12,27]},followThrough:true,
  dodge:{range:155,chance:.7,cooldown:1150,distance:130,height:48,duration:330,poses:[12,13,14,15]},
  heal:{below:.9,minDistance:120,inRange:true,windup:450,duration:1350,amount:.1,cooldown:6500,interruptCooldown:4500,
    label:'MÍMICA +10%',effect:true,startPoses:[16,17],loopPoses:[18,19,17,16],framesPerPose:10},
  animations:{idle:[0,1,2,3],walk:[4,5,6,7],attack:[8,9,10,11],jump:[12,13,14,15],heal:[16,17,18,19],hurt:[20,21],defeat:[22,23],struggle:[24,25,26,27]},
};
