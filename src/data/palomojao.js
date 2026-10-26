import backgroundUrl from '../scenes/palomojao/background.png?url';
import roofUrl from '../scenes/palomojao/game/roof.png?url';
import stallsUrl from '../scenes/palomojao/game/stalls.png?url';
import floorUrl from '../scenes/palomojao/game/floor.png?url';
import frontUrl from '../scenes/palomojao/game/front.png?url';
import propsUrl from '../scenes/palomojao/props/market.png?url';
import {needsSource,prepareCutout} from './spriteSheets.js';

// Art pack shared by the campaign market stage and the standalone preview.
export const PALOMOJAO_LAYERS=[
  // Roof and stalls share their structural plane; columns stay joined while scrolling.
  {file:'roof',key:'palomojao-roof',url:roofUrl,factor:.75},
  {file:'stalls',key:'palomojao-stalls',url:stallsUrl,factor:.75},
  {file:'floor',key:'palomojao-floor',url:floorUrl,factor:1},
  {file:'front',key:'palomojao-front',url:frontUrl,factor:1.2,front:true},
];
export const PALOMOJAO_BACKGROUND={key:'palomojao-background',url:backgroundUrl};
export const PALOMOJAO_PROP_SOURCE={key:'palomojao-props-source',url:propsUrl};
// Twelve isolated props, measured from the final transparent atlas.
export const PALOMOJAO_PROPS=[
  ['tomatoCrates','Canastas de tomate',[37,50,290,323],68],
  ['oranges','Canasta de naranjas',[378,131,339,227],35],
  ['potatoes','Canasta de papas',[751,132,345,230],35],
  ['onions','Costal de cebollas',[1140,37,307,325],50],
  ['grain','Costal de grano',[32,417,320,359],60],
  ['plantains','Racimo de plátanos',[430,390,243,374],65],
  ['handTruck','Carretilla de canastas',[789,389,310,390],88],
  ['scale','Báscula colgante',[1194,404,198,371],60],
  ['vegetables','Mesa de verduras',[33,832,324,213],70],
  ['flowers','Balde de flores',[446,779,273,288],70],
  ['basket','Canasto de frutas',[752,844,308,219],36],
  ['pushcart','Carro de mercado',[1091,802,334,264],76],
].map(([id,name,rect,height])=>({id,name,rect,height,texture:`palomojao-prop-${id}`,source:PALOMOJAO_PROP_SOURCE.key,noFlip:true}));
export const PALOMOJAO_ART={
  name:'Plaza de Palomojao',background:PALOMOJAO_BACKGROUND,layers:PALOMOJAO_LAYERS,
  floor:{top:390,bottom:500},rain:null,props:PALOMOJAO_PROPS,
};
export function preloadPalomojao(scene){
  for(const asset of [PALOMOJAO_BACKGROUND,...PALOMOJAO_LAYERS,PALOMOJAO_PROP_SOURCE])
    if(needsSource(scene,asset.key))scene.load.image(asset.key,asset.url);
}
export function preparePalomojao(scene){
  for(const prop of PALOMOJAO_PROPS){
    const [x,y,width,height]=prop.rect;
    prepareCutout(scene,prop.texture,prop.source,{x,y,width,height});
  }
}
