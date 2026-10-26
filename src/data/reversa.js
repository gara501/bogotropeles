import url from './bosses/don_reversa.png?url';
import truckUrl from './bosses/reversa_truck.png?url';
import eggUrl from './items/reversa_eggs.png?url';
export const REVERSA_TRUCK_URL=truckUrl,REVERSA_EGG_URL=eggUrl;
export const DON_REVERSA={name:'DON REVERSA',url,rows:Array(6).fill(4),height:128,speed:90,hp:3000,range:145,damage:28,idle:0,boss:true,reversa:true,crew:'estibador',
frameRects:[[55,27,163,223],[318,30,173,219],[572,29,168,219],[821,28,168,221],[28,337,222,177],[293,288,187,230],[560,253,172,265],[792,354,218,158],[41,580,187,173],[299,572,213,180],[547,570,232,183],[816,559,177,203],[48,786,157,221],[312,791,172,219],[561,785,180,225],[821,788,168,222],[37,1024,174,250],[286,1055,191,135],[522,1066,266,152],[819,1056,185,217],[32,1274,219,232],[292,1299,184,207],[529,1320,234,186],[792,1329,219,179]].map(([x,y,width,height])=>({x,y,width,height})),
trimFrames:true,isolateFrames:true,animations:{idle:[0],walk:[1,2,3],attack:[4,5,6,7],hurt:[20,21],defeat:[22,23]}};
