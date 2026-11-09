import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {SelectScreen}=await import('../src/ui/SelectScreen.js');

const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
function sheet(name){return {canvas:{name},frames:[{}],bounds:{0:{x:0,y:0,width:100,height:180,left:-50,top:180}},envelopes:{selection:{left:-50,right:50,height:180}}};}
function setup(){
  const screen=Object.create(SelectScreen.prototype),attributes={};
  const canvas={width:320,height:320,hidden:false};
  const ctx={canvas,painted:'office',clearRect(){this.painted=null;},drawImage(image){this.painted=image.name;}};
  canvas.getContext=()=>ctx;
  Object.assign(screen,{canvas,art:{hidden:false,complete:true,naturalWidth:240},key:'gymbro',anim:null,paletteState:{selected:{}},stage:{setAttribute:(key,value)=>{attributes[key]=value;}},loading:{hidden:true},loadingLabel:{textContent:''}});
  return {screen,ctx,attributes};
}

test('selection immediately removes the old sprite and shows loading until the selected fighter is painted',async()=>{
  const {screen,ctx,attributes}=setup(),load=deferred();screen.sheet=()=>load.promise;
  const pending=screen.draw('gymbro',[0]);
  assert.equal(ctx.painted,null);assert.equal(screen.canvas.hidden,true);
  assert.equal(screen.art.hidden,true,'the portrait stays behind the shield until the selected sprite is ready');
  assert.equal(screen.loading.hidden,false);assert.match(screen.loadingLabel.textContent,/GYMBRO/);
  assert.equal(attributes['aria-busy'],'true');
  load.resolve(sheet('gymbro'));await pending;
  assert.equal(ctx.painted,'gymbro');assert.equal(screen.canvas.hidden,false);
  assert.equal(screen.art.hidden,false);
  assert.equal(screen.loading.hidden,true);assert.equal(attributes['aria-busy'],'false');
});

test('slow previous loads cannot paint or dismiss the loader for a newer selection',async()=>{
  const {screen,ctx,attributes}=setup(),old=deferred(),current=deferred();
  screen.sheet=key=>key==='office'?old.promise:current.promise;
  screen.key='office';const first=screen.draw('office',[0]);
  screen.key='gymbro';const second=screen.draw('gymbro',[0]);
  old.resolve(sheet('office'));await first;
  assert.equal(ctx.painted,null);assert.equal(screen.loading.hidden,false);assert.equal(attributes['aria-busy'],'true');
  current.resolve(sheet('gymbro'));await second;
  assert.equal(ctx.painted,'gymbro');assert.equal(screen.loading.hidden,true);
});

test('quick A to B to A selection rejects even an obsolete load with the same character key',async()=>{
  const {screen,ctx}=setup(),loads=[deferred(),deferred(),deferred()];let index=0;screen.sheet=()=>loads[index++].promise;
  screen.key='office';const first=screen.draw('office',[0]);
  screen.key='gymbro';const second=screen.draw('gymbro',[0]);
  screen.key='office';const third=screen.draw('office',[0]);
  loads[2].resolve(sheet('current-office'));await third;
  loads[0].resolve(sheet('old-office'));loads[1].resolve(sheet('gymbro'));await Promise.all([first,second]);
  assert.equal(ctx.painted,'current-office');assert.equal(screen.loading.hidden,true);
});

test('failed previews retain a neutral silhouette with an error and allow another draw',async()=>{
  const {screen,ctx,attributes}=setup();screen.sheet=async()=>null;
  await screen.draw('gymbro',[0]);
  assert.equal(ctx.painted,null);assert.equal(screen.canvas.hidden,true);assert.equal(screen.loading.hidden,false);
  assert.match(screen.loadingLabel.textContent,/NO DISPONIBLE/);assert.equal(attributes['aria-busy'],'false');
  screen.sheet=async()=>sheet('gymbro');await screen.draw('gymbro',[0]);
  assert.equal(ctx.painted,'gymbro');assert.equal(screen.loading.hidden,true);
});

test('failed image requests are evicted from the sheet cache so selecting again retries',async t=>{
  const previous=globalThis.Image;let requests=0;
  globalThis.Image=class{set src(value){requests++;queueMicrotask(()=>this.onerror(new Error('load failed')));}};
  t.after(()=>{globalThis.Image=previous;});
  const screen=Object.create(SelectScreen.prototype);screen.sheets=new Map();
  assert.equal(await screen.sheet('gymbro'),null);assert.equal(screen.sheets.has('gymbro'),false);
  const first=requests;assert.equal(await screen.sheet('gymbro'),null);assert.ok(requests>first);
});
