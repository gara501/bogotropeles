// Fallen logs and broken-stair sinkholes for the Monserrate climb, drawn procedurally in a pixel style.
// Reference look: a spruce trunk (grey-lilac scaly bark with reddish scars and green moss, pale sawn ends with growth
// rings) and a collapsed street (cracked asphalt lip, orange and brown soil layers in the wall, a black void, yellow bollards).
import {projectHiker} from './MonserrateRun.js';
import {trailRow,logSpan} from './MonserrateTrail.js';

const TRAIL_TOP=158;
const rng=seed=>{let s=(seed>>>0)||1;return()=>(s=(s*16807)%2147483647)/2147483647;};
const canvas=(w,h,doc)=>{const c=(doc??document).createElement('canvas');c.width=w;c.height=h;return c;};
const hash=n=>{const r=rng(Math.floor(n*97)+13);r();return r();};

/** Scaly bark: pink-grey base, peeled red-brown scars, moss patches and dark flakes (192×40, stretched along the trunk). */
export function makeBarkTexture(doc){
  const c=canvas(192,40,doc),g=c.getContext('2d'),r=rng(11);
  g.fillStyle='#857879';g.fillRect(0,0,192,40);
  const patch=(colour,count,minW,maxW,maxH)=>{
    for(let i=0;i<count;i++){
      const x=r()*192,y=r()*40,w=minW+r()*(maxW-minW),h=2+r()*maxH;
      g.fillStyle=colour;g.fillRect(x,y,w,h);g.fillRect(x+1,y-1,Math.max(1,w-2),1);g.fillRect(x+1,y+h,Math.max(1,w-3),1);
    }
  };
  patch('#8a4d40',22,8,24,5);patch('#6e3a30',12,4,12,3);patch('#8fa056',16,6,18,4);patch('#aebd70',8,2,7,2);
  for(let i=0;i<560;i++){
    const x=r()*192,y=r()*40,w=1+Math.floor(r()*3);
    g.fillStyle=r()<.5?'#a99c9e':'#5d5253';g.fillRect(x,y,w,1);
    if(r()<.4){g.fillStyle='#463c3c';g.fillRect(x,y+1,Math.max(1,w-1),1);}
  }
  for(let y=3;y<40;y+=5){g.fillStyle='rgba(40,28,28,.22)';g.fillRect(0,y+Math.floor(r()*2),192,1);}
  return c;
}

/** Soil wall of the sinkhole (64×48): asphalt crust, orange clay, brown earth, black depths. */
export function makeSoilTexture(doc){
  const c=canvas(64,48,doc),g=c.getContext('2d'),r=rng(29);
  const band=(y0,y1,colours)=>{for(let y=y0;y<y1;y++)for(let x=0;x<64;x++){g.fillStyle=colours[Math.floor(r()*colours.length)];g.fillRect(x,y,1,1);}};
  band(0,4,['#2b2a2a','#363535','#222222']);band(4,7,['#74726b','#807e76','#68665f']);
  band(7,20,['#c4803a','#b8742f','#d09248','#a8672a']);band(20,32,['#8a5326','#7a4a22','#94602e','#6e421f']);band(32,48,['#2a1c12','#1d130c','#33231a','#120c08']);
  // pebbles and roots
  for(let i=0;i<46;i++){const x=Math.floor(r()*62),y=8+Math.floor(r()*24);g.fillStyle=r()<.5?'#e0b070':'#5a3418';g.fillRect(x,y,2,1+Math.floor(r()*2));}
  // vertical cracks and crumbling drips
  for(let k=0;k<7;k++){let x=Math.floor(r()*64),y=4;g.fillStyle='#1a0f08';while(y<36){g.fillRect(x,y,1,2);y+=2;if(r()<.4)x+=r()<.5?-1:1;}}
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,64,2);
  return c;
}

export const makeObstacleTextures=doc=>({bark:makeBarkTexture(doc),soil:makeSoilTexture(doc)});

function cutEnd(ctx,x,y,rx,ry,scale,tone=1){
  ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);
  ctx.fillStyle=tone===1?'#dcbd88':'#a9895c';ctx.fill();
  ctx.lineWidth=Math.max(1,.9*scale);ctx.strokeStyle=tone===1?'#b98f58':'#86683f';
  for(let k=1;k<=4;k++){ctx.beginPath();ctx.ellipse(x+rx*.04*k,y,Math.max(.5,rx*(1-k*.2)),Math.max(.5,ry*(1-k*.2)),0,0,Math.PI*2);ctx.stroke();}
  ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.lineWidth=Math.max(1,2.2*scale);ctx.strokeStyle='#5a3a2c';ctx.stroke();
}

/** One trunk lying across the trail between two lane positions, `z` metres ahead. */
function drawLog(ctx,tex,jump,left,right,z,distance,{lift=0,dark=0,height=66,twigs=true}={}){
  const a=projectHiker(left,z,distance),b=projectHiker(right,z,distance),width=b.x-a.x;
  if(width<2)return;
  const h=Math.max(4,height*a.scale),y=a.y-h-lift*a.scale,s=a.scale;
  // ground shadow
  ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(a.x-3*s,a.y-h*.1-lift*s*.2,width+6*s,Math.max(2,h*.22));
  // bark, cropped so partial logs show the same scale of scales as full ones
  const span=Math.min(1,(right-left)/3.4),srcW=Math.max(24,Math.round(192*span)),srcX=Math.floor(hash(jump.at)*(192-srcW));
  ctx.drawImage(tex.bark,srcX,0,srcW,40,a.x,y,width,h);
  // cylinder shading: sunlit top, shadowed belly
  const grad=ctx.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,'rgba(255,250,215,.26)');grad.addColorStop(.28,'rgba(255,250,215,0)');grad.addColorStop(.62,'rgba(0,0,0,.14)');grad.addColorStop(1,'rgba(0,0,0,.52)');
  ctx.fillStyle=grad;ctx.fillRect(a.x,y,width,h);
  if(dark){ctx.fillStyle=`rgba(10,15,10,${dark})`;ctx.fillRect(a.x,y,width,h);}
  // sawn ends with growth rings (near end larger, far end in shade)
  cutEnd(ctx,b.x,y+h/2,h*.2,h/2,s,2);
  cutEnd(ctx,a.x,y+h/2,h*.26,h/2,s,1);
  if(dark){ctx.fillStyle=`rgba(10,15,10,${dark})`;ctx.beginPath();ctx.ellipse(a.x,y+h/2,h*.26,h/2,0,0,Math.PI*2);ctx.fill();}
  if(!twigs)return;
  // broken branches and a few autumn leaves on top
  const r=rng(Math.floor(jump.at)+5);
  ctx.strokeStyle='#43301f';ctx.lineWidth=Math.max(1,2.2*s);
  for(let i=0;i<2;i++){const x=a.x+width*(.25+.5*r()+i*.1);ctx.beginPath();ctx.moveTo(x,y+h*.1);ctx.lineTo(x+(r()-.3)*16*s,y-h*(.3+r()*.25));ctx.stroke();}
  for(let i=0;i<5;i++){ctx.fillStyle=['#5e8f3a','#7da846','#d6c23a','#b98a2a'][i%4];ctx.fillRect(a.x+width*(.2+r()*.6),y-h*(.05+r()*.35),Math.max(2,5*s),Math.max(1,3*s));}
}

function lip(ctx,edge,distance,jump,up){
  const row=trailRow(Math.max(TRAIL_TOP,Math.floor(edge.y)),distance),left=row.centre-row.width/2,teeth=16,w=row.width/teeth,s=edge.scale,y=Math.floor(edge.y);
  ctx.fillStyle='#8f8d85';ctx.fillRect(left,y-1,row.width,Math.max(2,4*s));
  ctx.fillStyle='#bbb8ab';ctx.fillRect(left,y-1,row.width,Math.max(1,1.4*s));
  for(let k=0;k<teeth;k++){
    const hh=((k*7+jump.at)%5+1)*2.4*s,x=left+k*w;
    ctx.fillStyle=k%3===0?'#7a776f':k%3===1?'#a39f94':'#8a5a2e'; // asphalt chunks, a few clods of earth
    ctx.fillRect(x,y+(up>0?0:-hh),w*.85,hh);
  }
  return {row,left,s,y};
}

/** Collapsed stairs: far soil wall, black pit floor, cracked lips, hazard bollards. */
function drawGap(ctx,tex,jump,distance){
  const z0=jump.at-distance,z1=z0+jump.length;
  const near=projectHiker(0,Math.max(-3,z0),distance),far=projectHiker(0,z1,distance);
  const total=near.y-far.y,wall=Math.max(4,Math.min(80,total*.62));
  for(let y=Math.floor(far.y);y<near.y;y+=2){
    const {width,centre}=trailRow(y,distance),t=y-far.y;
    if(t<wall){ctx.drawImage(tex.soil,0,Math.min(47,Math.floor(t/wall*48)),64,1,centre-width/2,y,width,2);}
    else{const d=Math.min(1,(t-wall)/Math.max(1,total-wall));ctx.fillStyle=d<.35?'#150f0a':d<.7?'#0d0a08':'#070605';ctx.fillRect(centre-width/2,y,width,2);}
  }
  const far_=lip(ctx,far,distance,jump,1);
  if(z0>-3){
    const n=lip(ctx,near,distance,jump,-1);
    // cracks fanning out of the near lip across the surviving stairs
    const r=rng(Math.floor(jump.at)+3);ctx.strokeStyle='#1d1b18';ctx.lineWidth=Math.max(1,1.8*n.s);
    for(let k=0;k<5;k++){
      let x=n.left+n.row.width*(.1+.2*k+r()*.06),yy=n.y+2;ctx.beginPath();ctx.moveTo(x,yy);
      for(let seg=0;seg<3;seg++){x+=(r()-.5)*10*n.s;yy+=(4+r()*5)*n.s;ctx.lineTo(x,yy);}
      ctx.stroke();
    }
  }
  void far_;
  if(z0>-1.5){
    for(const side of [-1,1]){
      const p=projectHiker(side*1.5,Math.max(-1,z0-.7),distance),bh=40*p.scale,bw=Math.max(3,10*p.scale);
      ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(p.x-bw*.9,p.y-1,bw*1.8,Math.max(1,2*p.scale));
      ctx.fillStyle='#f0b90f';ctx.fillRect(p.x-bw/2,p.y-bh,bw,bh);
      ctx.fillStyle='#1a1a1a';ctx.fillRect(p.x-bw/2,p.y-bh*.62,bw,bh*.16);
      ctx.fillStyle='#ffd84a';ctx.fillRect(p.x-bw/2,p.y-bh,Math.max(1,bw*.28),bh);
      ctx.fillStyle='#b88a08';ctx.fillRect(p.x+bw*.25,p.y-bh,Math.max(1,bw*.25),bh);
    }
  }
}

/** Draws every visible jump feature of the run (gaps and logs) onto the road canvas. */
export function drawJumps(ctx,jumps,distance,tex){
  for(const jump of jumps){
    const z0=jump.at-distance,z1=z0+jump.length;
    if(z1<-3 || z0>110)continue;
    if(jump.kind==='gap'){drawGap(ctx,tex,jump,distance);continue;}
    if(z0<-1.5)continue;
    const [left,right]=logSpan(jump);
    // a full-width trunk lies on a second one behind it, like a felled pair
    if(jump.lanes.length===3)drawLog(ctx,tex,jump,left+.15,right-.1,z0+.45,distance,{lift:36,dark:.28,height:58,twigs:false});
    drawLog(ctx,tex,jump,left,right,z0,distance);
  }
}
