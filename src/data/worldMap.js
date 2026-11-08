// Between-levels world map of Bogotá (src/scenes/MapScene.js). Pure data and rules, so node --test can load it.
// x/y are fractions (0–1) of the map illustration (src/scenes/map/map.png). `downtown` stops sit close together: the camera zooms on them (WORLD_MAP.zoom).
// map: where the illustration sits on the 960×540 screen (a little smaller than the screen, centred above the caption band).
export const WORLD_MAP={width:960,height:540,map:{x:96,y:8,width:768,height:432},zoom:1.35,travelMs:1500,arriveMs:500,promptMs:700};
// Positions measured on src/scenes/map/map.png (1672 × 941), on each district's landmark icon.
export const MAP_STOPS={
  'Transmilleno · Exterior':{x:0.400,y:0.423,label:'AV. JIMÉNEZ',downtown:true},
  'Transmilleno · Estación':{x:0.420,y:0.446,label:'ESTACIÓN',downtown:true},
  'Monserrate · Ascenso':{x:0.471,y:0.315,label:'MONSERRATE',downtown:true},
  'La Candelaria':{x:0.500,y:0.412,label:'LA CANDELARIA',downtown:true},
  'Chorro de Quevedo':{x:0.569,y:0.359,label:'CHORRO DE QUEVEDO',downtown:true},
  'Plaza de Bolívar':{x:0.530,y:0.336,label:'PLAZA DE BOLÍVAR',downtown:true},
  'Calles del centro':{x:0.455,y:0.429,label:'CARRERA SÉPTIMA',downtown:true},
  'Ciclovía':{x:0.372,y:0.461,label:'CICLOVÍA'},
  'Plaza de Palomojao':{x:0.440,y:0.544,label:'PALOMOJAO'},
  'EL dorado':{x:0.239,y:0.731,label:'EL DORADO'},
  'Gran Estación · Batalla de aura':{x:0.328,y:0.436,label:'GRAN ESTACIÓN'},
  'Zona Rosa':{x:0.330,y:0.298,label:'ZONA ROSA'},
};
const clamp01=v=>Math.max(0,Math.min(1,v));
/** A level's stop; unknown levels get an evenly spaced fallback so a new level never breaks the map. */
export function mapStop(level,index=0,total=1){
  const stop=MAP_STOPS[level?.name];
  if(stop)return {...stop,x:clamp01(stop.x),y:clamp01(stop.y)};
  return {x:.1+.8*index/Math.max(1,total-1),y:.88,label:(level?.name??'').toUpperCase(),downtown:false};
}
/** Every stop with its state for a run that is about to play `current`: cleared before it, locked after it. */
export function mapRoute(levels,current){
  return levels.map((level,index)=>({...mapStop(level,index,levels.length),index,name:level.name,boss:Boolean(level.boss),
    state:index<current?'cleared':index===current?'current':'locked'}));
}
/** Pixel position of a stop on the 960×540 map. */
export const stopPoint=(stop,m=WORLD_MAP.map)=>({x:m.x+stop.x*m.width,y:m.y+stop.y*m.height});
/** Camera for a leg of the trip: zoomed on downtown when both ends are there, the whole city otherwise. */
export function legView(from,to,overview=false){
  const a=stopPoint(from??to),b=stopPoint(to);
  if(!overview && to.downtown && (!from || from.downtown))return {zoom:WORLD_MAP.zoom,x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  return {zoom:1,x:WORLD_MAP.width/2,y:WORLD_MAP.height/2,full:true};
}
