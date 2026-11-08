import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

// Small lossless reader for checking actual sprite pixels without a browser.
export function readPng(url){
  const png=readFileSync(url),width=png.readUInt32BE(16),height=png.readUInt32BE(20),type=png[25];
  if(png[24]!==8 || ![2,3,6].includes(type) || png[28]!==0)throw new Error('Expected a non-interlaced 8-bit RGB, indexed or RGBA PNG');
  const chunks=[];let palette,alpha;
  for(let offset=8;offset<png.length;){const size=png.readUInt32BE(offset),kind=png.toString('ascii',offset+4,offset+8),chunk=png.subarray(offset+8,offset+8+size);
    if(kind==='IDAT')chunks.push(chunk);if(kind==='PLTE')palette=chunk;if(kind==='tRNS')alpha=chunk;offset+=size+12;}
  const raw=inflateSync(Buffer.concat(chunks)),channels=type===6?4:type===3?1:3,stride=width*channels,data=Buffer.alloc(height*stride);
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db && da<=dc?a:db<=dc?b:c;};
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];
    if(filter>4)throw new Error('Invalid PNG filter');
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=channels?data[i-channels]:0,b=y?data[i-stride]:0,c=y && x>=channels?data[i-stride-channels]:0;
      const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      data[i]=(raw[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  return {width,height,pixel(x,y){const i=(y*width+x)*channels;
    if(type===3){const index=data[i];return [palette[index*3],palette[index*3+1],palette[index*3+2],alpha?.[index]??255];}
    return [data[i],data[i+1],data[i+2],channels===4?data[i+3]:255];}};
}
