import {prepareSheet} from '../data/spriteSheets.js';

// Reuse combat's masks, hip anchors, per-frame scales and common ground line.
// The small texture adapter keeps UI previews independent of Phaser scene loading.
export function preparePlayerPreview(images,config){
  const sources=new Map(images.map((image,i)=>[i===0?'preview-source':`preview-append-${i-1}`,image]));
  let result;
  const scene={textures:{
    exists:()=>false,
    get:key=>({getSourceImage:()=>sources.get(key)}),
    createCanvas:(key,width,height)=>{
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      result={canvas,context:canvas.getContext('2d'),frames:[],add(index,source,x,y,width,height){this.frames[index]={x,y,width,height};},refresh(){}};
      return result;
    },
  }};
  prepareSheet(scene,'preview',config);
  const bounds=index=>{
    const r=result.frames[index],pixels=result.context.getImageData(r.x,r.y,r.width,r.height).data;
    let left=r.width,top=r.height,right=-1,bottom=-1;
    for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)if(pixels[(y*r.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    return right>=left?{x:r.x+left,y:r.y+top,width:right-left+1,height:bottom-top+1,left:left-r.width/2,top:r.height-4-top}:null;
  };
  const groups={selection:[config.idle,...(config.animations?.victory??[])],combos:Object.entries(config.animations??{}).filter(([name])=>name.startsWith('chain')).flatMap(([,frames])=>frames)};
  result.bounds={};result.envelopes={};
  for(const [name,frames] of Object.entries(groups)){
    let left=0,right=0,height=0;
    for(const index of new Set(frames)){
      const b=result.bounds[index]??=bounds(index);if(!b)continue;
      left=Math.min(left,b.left);right=Math.max(right,b.left+b.width);height=Math.max(height,b.top);
    }
    result.envelopes[name]={left,right,height};
  }
  return result;
}

export function previewPlacement(sheet,frame,width,height,padding=12,mode='selection'){
  const b=sheet.bounds[frame],e=sheet.envelopes[mode];if(!b || !e?.height)return null;
  // Fit the sequence's visible extent, not unused padding in the packed atlas.
  // One scale and hip pivot for the entire sequence, even when crouching.
  const scale=Math.min((width-padding*2)/(e.right-e.left),(height-padding*2)/e.height);
  const anchor=(width-(e.left+e.right)*scale)/2;
  return {source:b,x:anchor+b.left*scale,y:height-padding-b.top*scale,width:b.width*scale,height:b.height*scale,scale};
}

export function drawPlayerPreview(ctx,sheet,frame,tint=null,mode='selection'){
  const {width,height}=ctx.canvas,p=previewPlacement(sheet,frame,width,height,12,mode);
  ctx.clearRect(0,0,width,height);if(!p)return;
  const r=p.source,paint=()=>ctx.drawImage(sheet.canvas,r.x,r.y,r.width,r.height,p.x,p.y,p.width,p.height);
  ctx.imageSmoothingEnabled=false;ctx.globalCompositeOperation='source-over';paint();
  if(tint!=null){
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`#${tint.toString(16).padStart(6,'0')}`;ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation='destination-in';paint();ctx.globalCompositeOperation='source-over';
  }
}
