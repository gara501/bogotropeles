import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LevelLoader,LOADER_TIPS,loaderStep} from '../src/ui/LevelLoader.js';

function fakeDom(){
  const make=()=>({textContent:'',hidden:false,style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
  const parts={'#loader-eyebrow':make(),'#loader-title':make(),'.loader-road':make(),'.loader-fill':make(),'.loader-bus':make(),
    '#loader-percent':make(),'#loader-step':make(),'#loader-tip':make(),'.loader-portrait':make(),'#loader-error':make()};
  const classes=new Set();
  return {parts,root:{hidden:true,querySelector:sel=>parts[sel],classList:{toggle:(c,on)=>on?classes.add(c):classes.delete(c),has:c=>classes.has(c)}}};
}
function clock(){let t=0;const jobs=[];return {now:()=>t,schedule:(fn,ms)=>{const j={at:t+ms,fn};jobs.push(j);return j;},cancel:j=>{if(j)j.fn=null;},
  advance(ms){t+=ms;for(const j of jobs.filter(j=>j.fn && j.at<=t)){const fn=j.fn;j.fn=null;fn();}}};}

test('the loader only appears for slow loads, tracks progress with the bus and stays up long enough to read',()=>{
  const {root,parts}=fakeDom(),c=clock();
  const loader=new LevelLoader(root,{delay:250,minVisible:500,now:c.now,schedule:c.schedule,cancel:c.cancel,random:()=>0});
  loader.start({level:1,name:'Transmilleno · Estación',portrait:'p.png'});
  assert.equal(parts['#loader-eyebrow'].textContent,'NIVEL 02');assert.equal(parts['#loader-title'].textContent,'TRANSMILLENO · ESTACIÓN');
  c.advance(100);loader.finish();c.advance(1000);assert.equal(root.hidden,true,'a cached restart never flashes the loader');
  loader.start({level:1,name:'x'});c.advance(300);assert.equal(root.hidden,false);
  loader.progress(.5);assert.equal(parts['.loader-bus'].style.left,'50%');assert.equal(parts['#loader-percent'].textContent,'50%');
  assert.equal(parts['.loader-road'].attrs['aria-valuenow'],'50');
  loader.progress(1);assert.equal(root.classList.has('is-parked'),true);
  loader.finish();c.advance(100);assert.equal(root.hidden,false,'minimum visible time');c.advance(500);assert.equal(root.hidden,true);
});

test('load errors are shown; tips and steps are themed; StreetScene reports every load',()=>{
  const {root,parts}=fakeDom(),c=clock(),loader=new LevelLoader(root,{now:c.now,schedule:c.schedule,cancel:c.cancel});
  loader.start({level:0,name:'a',bonus:true});assert.equal(parts['#loader-eyebrow'].textContent,'BONUS');
  loader.fail({key:'level-2'});assert.equal(parts['#loader-error'].hidden,false);assert.match(parts['#loader-error'].textContent,/level-2/);
  assert.ok(LOADER_TIPS.length>=8);assert.equal(loaderStep(0),'PAGANDO EL PASAJE');assert.equal(loaderStep(1),'LLEGANDO A LA ESTACIÓN');
  const scene=readFileSync(new URL('../src/scenes/StreetScene.js',import.meta.url),'utf8');
  for(const event of ["'level-loading'","'level-load-progress'","'level-load-error'"])assert.ok(scene.includes(event),event);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['level-loader','loader-title','loader-percent','loader-tip','loader-error'])assert.ok(html.includes(`id="${id}"`),id);
});
