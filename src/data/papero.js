import url from './enemies/papero.png?url';
import potatoUrl from './items/papero_potatoes.png?url';
export const POTATO_URL=potatoUrl;
export const PAPERO={name:'EL PAPERO',url,rows:Array(8).fill(4),height:121,speed:85,hp:520,range:92,damage:5,idle:0,papero:true,
  frameRects:[
    [77,33,151,167],[319,33,151,167],[570,32,152,168],[822,32,152,168],
    [77,217,152,178],[314,217,164,175],[569,217,165,174],[822,217,159,173],
    [64,425,163,167],[321,430,163,164],[569,406,146,193],[823,402,143,197],
    [52,595,158,194],[301,640,215,145],[573,625,179,163],[801,636,203,153],
    [54,805,148,162],[309,804,153,161],[569,806,151,162],[826,806,146,162],
    [54,983,157,170],[307,986,166,167],[562,987,184,166],[817,985,161,169],
    [50,1185,181,147],[300,1172,193,160],[579,1171,164,172],[818,1167,167,178],
    [76,1350,163,163],[302,1353,164,160],[531,1366,206,144],[763,1420,232,89],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  trimFrames:true,isolateFrames:true,
  attackFrames:{startup:28,active:3,recovery:38,cooldown:100},
  animations:{idle:[0,1],walk:[4,5,6,7],lift:[8,9,10,11],slam:[12,13],throw:[14,15],emptyIdle:[20],emptyWalk:[16,17,18,19],
    attack:[20,21,22,23],reload:[24,25,26,27],hurt:[28,29],defeat:[30,31],struggle:[28,29]},
};
