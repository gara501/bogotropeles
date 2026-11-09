import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';
import {COMBO_ROUTES,matchingRoutes,routeAnimations,sequenceOptions,directionalStrike} from '../src/data/comboRoutes.js';
import {playerAttackData,comboOptions} from '../src/data/attacks.js';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');

test('PPKKK is the sole shared ground combo and direction cannot select removed branches',()=>{
  assert.deepEqual(COMBO_ROUTES.map(r=>r.notation),['PPKKK']);
  assert.deepEqual(sequenceOptions({path:['punch','punch']}),['kick']);
  assert.deepEqual(sequenceOptions({path:['punch','punch','kick','kick']}),['kick']);
  assert.deepEqual(sequenceOptions({path:COMBO_ROUTES[0].inputs}),[]);
  for(const dy of [-1,0,1])for(const type of ['punch','kick'])assert.equal(directionalStrike(type,dy),type);
});

const retired=[['punch','punch','punch'],['punch','punch','punch','kick','kick'],['kick','kick','kick'],
  ['kick','kick','kick','lowKick'],['punch','punch','kick','kick','upperPunch']];
for(const [hero,c] of Object.entries(characters))test(`${hero}: retired routes cannot fall back to old ground combos`,()=>{
  for(const path of retired.filter(path=>!((['student','teleperforman'].includes(hero) && path.join()===['kick','kick','kick'].join()) || (['office','teleperforman'].includes(hero) && path.join()===['punch','punch','punch'].join())))){
    assert.deepEqual(matchingRoutes(path,c),[]);
    assert.equal(playerAttackData(c,path.at(-1),path.length-1,false,path),null);
  }
  const kick=playerAttackData(c,'kick');
  assert.equal(kick.combo,['student','teleperforman'].includes(hero));assert.deepEqual(comboOptions(c,kick),['student','teleperforman'].includes(hero)?['kick']:[]);
});

test('Universitaria PPKKK maps KKK to three distinct book strikes, while a standalone or airborne K remains a kick',()=>{
  const c=characters.student,route=COMBO_ROUTES[0],names=routeAnimations(c,route);
  assert.deepEqual(names,['chainPunch1','chainPunch2','chainBook1','chainBook2','chainBook3']);
  assert.deepEqual(routeAnimations(characters.gymbro,route),route.animations);
  const contacts=[];
  for(let i=0;i<5;i++){
    const path=route.inputs.slice(0,i+1),data=playerAttackData(c,path.at(-1),i,false,path);
    const active=data.frames.filter(f=>f.phase==='active');contacts.push(active[0].pose);
    assert.ok(active.every(f=>f.pose===c.animations[names[i]][2]));
    assert.equal(data.finisher,i===4);assert.equal(data.knockdown,i===4);
    assert.equal(data.impactType,i<2?'punch':'book');
    if(i<4)assert.equal(data.knockback,0);
    assert.equal(Boolean(data.summon),false,'a libro is a melee strike, not the orbiting-books special');
  }
  assert.equal(new Set(contacts).size,5);
  const ground=playerAttackData(c,'kick');assert.equal(ground.impactType,'kick');
  assert.ok(ground.frames.every(f=>f.pose>=c.kickComboArtStart),'ground K starts the separate kick route');
  assert.ok(playerAttackData(c,'kick',0,true).frames.every(f=>f.pose<c.bookComboArtStart),'air K remains the airborne kick');
});

test('Universitaria book atlas has fifteen complete poses at one scale, aligned feet and matching runtime rectangles',()=>{
  const c=characters.student,png=readPng(new URL('../src/data/players/student_book_combo_v1.png',import.meta.url));
  assert.equal(png.width,1600);assert.equal(png.height,960);
  const signatures=[];
  for(let i=0;i<15;i++){
    const x0=i%5*320,y0=Math.floor(i/5)*320,frame=c.bookComboArtStart+i;
    assert.deepEqual(c.frameRects[frame],{x:x0,y:7235+y0,width:320,height:320});
    assert.equal(c.frameBaselines[frame],7235+y0+304);assert.equal(c.frameScales?.[frame]??1,1);
    let count=0,bottom=-1,red=0;const signature=[];
    for(let y=0;y<320;y++)for(let x=0;x<320;x++){
      const [r,g,b,a]=png.pixel(x0+x,y0+y);if(!a)continue;
      count++;bottom=Math.max(bottom,y);assert.ok(x>0 && x<319 && y>0 && y<319,'no clipped hair, hands, book or shoes');
      if(r>95 && r>g*1.8 && r>b*1.7 && g<100)red++;
      signature.push(x+y*320);
    }
    assert.ok(count>4000);assert.ok(red>30,'red book pixels remain in every selected pose');assert.equal(bottom,303);
    signatures.push(signature.join());
  }
  assert.equal(new Set(signatures).size,15);
});
