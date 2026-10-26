import url from './enemies/frutatiana.png?url';
import fruitUrl from './UI/frutatiana_fruit.png?url';

export const FRUIT_URL=fruitUrl;
export const FRUTATIANA={name:'DOÑA FRUTATIANA',url,rows:Array(6).fill(4),height:113,speed:145,hp:190,range:65,damage:5,idle:0,
  frameRects:[
    [95,5,169,208],[417,5,159,208],[700,4,163,209],[998,4,158,209],
    [90,218,176,211],[393,217,179,212],[673,219,198,210],[988,217,183,212],
    [96,444,202,198],[398,439,217,203],[667,439,291,204],[992,441,209,202],
    [95,678,165,176],[402,638,163,214],[645,661,286,193],[989,661,214,198],
    [108,853,193,192],[404,866,158,178],[651,856,274,166],[948,919,276,85],
    [85,1042,230,194],[374,1045,244,190],[699,1025,190,212],[992,1032,181,205],
  ].map(([x,y,width,height])=>({x,y,width,height})),
  trimFrames:true,isolateFrames:true,frameAnchors:{10:770,14:745,20:180,21:480},
  keepDistance:285,attackFrames:{startup:22,active:3,recovery:32,cooldown:90},
  throw:{fruit:'orange',minRange:150,maxRange:650,windup:650,active:2,recovery:520,cooldown:1900,
    speed:390,damage:12,texture:'frutatiana-orange',width:19,height:19,lift:78,offset:28,arc:105,
    radius:17,depth:17,spin:5,hitFrame:2,keepAway:true,label:'¡NARANJA!',watermelonChance:.28,
    watermelon:{texture:'frutatiana-watermelon',width:34,height:32,lift:110,arc:135,speed:330,
      damage:22,radius:80,depth:34,poses:[12,13,14,15],label:'¡PATILLA!'}},
  animations:{idle:[0,1,2,3],walk:[4,5,6,7],throw:[8,9,10,11],attack:[20,21,20],hurt:[16,17],defeat:[18,19],struggle:[22,23]},
};
