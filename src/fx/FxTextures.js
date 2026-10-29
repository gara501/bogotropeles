// Procedural textures for particles and lights, generated once per game (no extra assets to load).
// Everything shares ONE atlas ('fx') so particles and glows batch into a single draw call.
export const FX_ATLAS='fx';
export const FRAMES={
  glow:{x:0,y:0,w:64,h:64},   // banded radial glow (hard bands read as pixel art)
  ring:{x:65,y:0,w:48,h:48},  // thin ring for shockwaves and ripples
  px:{x:114,y:0,w:2,h:2},     // 2x2 white square: sparks, chips, dust
};
export const RAIN_TEXTURE='fx-rain';
export const VIGNETTE_TEXTURE='fx-vignette';

const GLOW_BANDS=7,ATLAS_W=118,ATLAS_H=64;
const noise=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);

function paintAtlas(ctx){
  const img=ctx.createImageData(ATLAS_W,ATLAS_H),d=img.data;
  const put=(x,y,a)=>{const i=(y*ATLAS_W+x)*4;d[i]=d[i+1]=d[i+2]=255;d[i+3]=Math.round(a*255);};
  const {glow,ring,px}=FRAMES;
  for(let y=0;y<glow.h;y++)for(let x=0;x<glow.w;x++){
    const r=Math.hypot(x-(glow.w-1)/2,y-(glow.h-1)/2)/(glow.w/2);
    if(r<1)put(x+glow.x,y,Math.pow(Math.ceil((1-r)*GLOW_BANDS)/GLOW_BANDS,2));
  }
  for(let y=0;y<ring.h;y++)for(let x=0;x<ring.w;x++){
    const q=Math.hypot(x-23.5,y-23.5);
    put(x+ring.x,y,q>=19&&q<=22.5?1:(q>=16.5&&q<19)||(q>22.5&&q<=24)?.3:0);
  }
  for(let y=0;y<px.h;y++)for(let x=0;x<px.w;x++)put(px.x+x,y,1);
  ctx.putImageData(img,0,0);
}

// Diagonal streaks that wrap around the tile edges, so a tileSprite scrolls without seams.
function paintRain(ctx,size=64){
  const rnd=noise(7),img=ctx.createImageData(size,size),d=img.data;
  for(let n=0;n<7;n++){
    const x0=Math.floor(rnd()*size),y0=Math.floor(rnd()*size);
    for(let i=0;i<18;i++){
      const x=((x0-Math.round(i*.3))%size+size)%size,y=(y0+i)%size,o=(y*size+x)*4;
      d[o]=207;d[o+1]=230;d[o+2]=255;d[o+3]=Math.round(255*(.35+.65*i/17));
    }
  }
  ctx.putImageData(img,0,0);
}

// Opaque greyscale used with MULTIPLY: white in the middle, darker at the corners. Tinted by the ambient colour,
// so ONE full-screen quad does both the colour grade and the vignette.
function paintVignette(ctx,w,h,corner=.45){
  const g=ctx.createRadialGradient(w/2,h/2,h*.32,w/2,h/2,w*.6),c=Math.round(corner*255);
  g.addColorStop(0,'#fff');g.addColorStop(1,`rgb(${c},${c},${c})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}

/** Creates the FX textures if the scene can (mock scenes in tests cannot). Returns true when ready. */
export function ensureFxTextures(scene){
  const tex=scene?.textures;
  if(!tex?.createCanvas)return false;
  if(!tex.exists(FX_ATLAS)){
    const canvas=tex.createCanvas(FX_ATLAS,ATLAS_W,ATLAS_H);paintAtlas(canvas.getContext());canvas.refresh();
    for(const [name,f] of Object.entries(FRAMES))canvas.add(name,0,f.x,f.y,f.w,f.h);
  }
  if(!tex.exists(RAIN_TEXTURE)){const c=tex.createCanvas(RAIN_TEXTURE,64,64);paintRain(c.getContext());c.refresh();}
  if(!tex.exists(VIGNETTE_TEXTURE)){const c=tex.createCanvas(VIGNETTE_TEXTURE,160,90);paintVignette(c.getContext(),160,90);c.refresh();tex.get(VIGNETTE_TEXTURE).setFilter?.(0);}
  return true;
}
