// Motion-comic intro (src/scenes/ComicIntroScene.js), played after the title screen. Pure data so node --test can load it.
// Art lives in src/scenes/comic/<file>; a missing panel is drawn as a placeholder so the timing can be tuned first.
// camera: Ken Burns move over the illustration. zoom ≥ 1 (1 = cover the screen); x/y = point of the image (0–1)
// kept at the screen centre. layout 'strips' slides the image in as three diagonal comic cuts; 'cards' shows the
// five player_N_intro.png portraits as cards. Prompts and art direction: prompts/intro/intro-prompts.md.
export const COMIC={typeMs:34,hold:900,captionGap:250,panelTail:500,fadeMs:320,music:'music3.ogg',volume:.35};
export const COMIC_PANELS=[
  {id:'ciudad',file:'comic_01_ciudad.png',title:'LA CIUDAD',tint:0x22305a,
    captions:['Bogotá. Viernes, seis de la tarde.','Hoy no pasa nadie.'],camera:{from:{zoom:1.22,x:.28,y:.4},to:{zoom:1.36,x:.72,y:.62}}},
  {id:'pacho',file:'comic_02_pacho.png',title:'DON PACHO PLOMO',tint:0x4a1f3a,
    captions:['Don Pacho Plomo no se tomó la ciudad.','La alquiló por una noche.'],camera:{from:{zoom:1.06,x:.5,y:.5},to:{zoom:1.55,x:.53,y:.28}}},
  {id:'operativo',file:'comic_03_operativo.png',title:'EL OPERATIVO',tint:0x5a2a1a,layout:'strips',
    // Match the painted separators; a zoom would pull them away from the static masks.
    stripCuts:[[734/1672,503/1672],[1169/1672,952/1672]],bakedGutters:true,
    captions:['No contrató un ejército.','Contrató el trancón.'],camera:{from:{zoom:1,x:.5,y:.5},to:{zoom:1,x:.5,y:.5}}},
  {id:'destinos',title:'CINCO DESTINOS',tint:0x1f3a3a,layout:'cards',
    captions:['Cinco desconocidos.','Cinco destinos.','Un mismo andén.']},
  {id:'estacion',file:'comic_05_estacion.png',title:'LA PUERTA',tint:0x5a1a1a,
    captions:['El que sigue caminando, estorba.'],camera:{from:{zoom:1.08,x:.5,y:.56},to:{zoom:1.42,x:.54,y:.36}}},
  {id:'heroes',file:'comic_06_heroes.png',title:'QUE ESTORBEN',tint:0x2a1a4a,finale:true,
    captions:['Entonces...','¡que estorben!'],camera:{from:{zoom:1.42,x:.5,y:.42},to:{zoom:1,x:.5,y:.5}}},
];
export const CARD_CHARACTERS=['office','student','teleperforman','gymbro','magolita'];
// The source introductions are landscapes: their heroes do not stand at image centre.
export const CARD_FOCUS_X={office:.35,student:.275,teleperforman:.43,gymbro:.43,magolita:.40};
/** ms a caption takes to type and stay readable. */
export const captionMs=(text,c=COMIC)=>text.length*c.typeMs+c.hold;
/** Whole panel: its captions one after the other plus a tail before the cut. */
export const panelMs=(panel,c=COMIC)=>panel.captions.reduce((t,text)=>t+captionMs(text,c)+c.captionGap,0)+c.panelTail;
export const comicMs=(panels=COMIC_PANELS,c=COMIC)=>panels.reduce((t,p)=>t+panelMs(p,c)+c.fadeMs,0);
/** Image placement for a camera key: scale and top-left so (x, y) of the image sits at the screen centre, never showing an edge. */
export function framing(imageWidth,imageHeight,{zoom,x,y},screen={width:960,height:540}){
  const scale=Math.max(screen.width/imageWidth,screen.height/imageHeight)*Math.max(1,zoom),w=imageWidth*scale,h=imageHeight*scale;
  const left=Math.min(0,Math.max(screen.width-w,screen.width/2-x*w)),top=Math.min(0,Math.max(screen.height-h,screen.height/2-y*h));
  return {scale,x:left+w/2,y:top+h/2};
}
