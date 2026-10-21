import url from './bosses/brayatan.png?url';
export const BRAYATAN={
  below:.5,speedMultiplier:1.45,cooldownMultiplier:.72,initialWait:45,rest:38,hurt:20,rage:40,
  cycle:['knives','dance','charge','stomp'],rageCycle:['knives','charge','knives','dance','stomp'],
  poses:{knifeStartup:[4,5],knifeActive:6,knifeRecovery:7,danceStartup:8,danceRecovery:11,chargeWindup:8,chargeContact:10,chargeCycle:16,crouch:12,takeoff:13,land:15,rage:8},
  knives:{count:2,rageCount:5,startup:27,interval:12,active:3,recovery:9,speed:430,damage:12,width:32,height:32,lift:78,offset:48,texture:'knife',retreat:180,move:.45},
  dance:{startup:24,between:11,active:3,recovery:20,range:145,depth:24,damage:13,poses:[9,10,9],advance:.3},
  charge:{startup:30,frames:48,speed:620,distance:470,range:65,damage:22,recovery:32},
  stomp:{startup:30,air:66,travel:.65,height:650,land:36,damage:28,radius:92,depth:30,
    shadowWidth:100,shadowHeight:26,shakeMs:260,shakeStrength:.012,shockFrames:28,shockRadius:150},
};
export const BRAYATAN_SPRITE={name:'BRAYATAN',url,rows:[4,4,4,4,4,4,4],height:124,speed:195,hp:2600,range:125,damage:14,idle:0,boss:true,brayatan:BRAYATAN,
  isolateFrames:true,trimFrames:true,
  frameRects:[
    [42,9,135,215],[263,8,146,216],[472,9,165,215],[698,9,161,215],
    [17,241,153,207],[219,235,193,213],[422,244,221,204],[676,246,203,202],
    [18,462,195,219],[234,494,203,187],[443,505,287,176],[696,457,187,224],
    [9,735,192,180],[230,701,191,211],[441,706,198,175],[666,695,209,236],
    [23,972,188,211],[246,919,182,269],[459,990,151,193],[684,972,170,211],
    [17,1230,211,225],[231,1282,196,174],[420,1345,219,114],[634,1366,248,90],
    [13,1500,207,235],[215,1505,225,224],[443,1506,217,225],[655,1502,215,220],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  frameAnchors:Object.fromEntries([105,335,543,775,80,294,500,761,111,324,540,797,101,321,540,769,107,330,535,771,118,328,520,759,104,327,552,756].map((x,i)=>[i,x])),
  animations:{walk:[0,1,2,3],throw:[4,5,6,7],dance:[8,9,10,11],attack:[8,9,10,11],charge:[24,25,26,10],stomp:[12,13,14,15],hurt:[16,17,18,19],defeat:[20,21,22,23],run:[24,25,26,27]},
};
