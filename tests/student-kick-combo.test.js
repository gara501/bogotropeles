import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readPng} from './helpers/readPng.js';
import {STUDENT_KICK_ROUTE,COMBO_ROUTES,routesFor,matchingRoutes,sequenceOptions} from '../src/data/comboRoutes.js';
import {playerAttackData} from '../src/data/attacks.js';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');
const {comboRows,CombosScreen}=await import('../src/ui/CombosScreen.js');
const {controlsFor}=await import('../src/ui/ControlsScreen.js');

test('Universitaria KKK stays independent of PPKKK and the other character routes',()=>{
  for(const [key,c] of Object.entries(characters)){
    const expected=key==='student'?['PPKKK','KKK']:key==='office'?['PPKKK','PPP']:key==='teleperforman'?['PPKKK','PPP','KKK']:['PPKKK'];
    assert.deepEqual(routesFor(c).map(r=>r.notation),expected);
    assert.deepEqual(comboRows(key).map(r=>r.notation),expected);
    assert.equal(matchingRoutes(['kick'],c).length,['student','teleperforman'].includes(key)?1:0);
    assert.equal(controlsFor(key).combos.some(row=>row.label.startsWith('KKK')),['student','teleperforman'].includes(key));
  }
  const c=characters.student;
  assert.deepEqual(sequenceOptions({path:['kick']},c),['kick']);
  assert.deepEqual(sequenceOptions({path:['kick','kick']},c),['kick']);
  assert.deepEqual(sequenceOptions({path:STUDENT_KICK_ROUTE.inputs},c),[]);
  for(let i=0;i<3;i++){
    const data=playerAttackData(c,'kick',i,false,STUDENT_KICK_ROUTE.inputs.slice(0,i+1));
    assert.equal(data.impactType,'kick');assert.equal(data.finisher,i===2);assert.equal(data.knockdown,i===2);
    assert.equal(data.frames.find(f=>f.phase==='active').pose,c.animations[STUDENT_KICK_ROUTE.animations[i]][2]);
  }
  assert.deepEqual(COMBO_ROUTES.map(r=>r.notation),['PPKKK'],'KKK is not enabled globally');
});

test('combo menu can choose KKK and resets safely when returning to a fighter with one route',()=>{
  const menu=Object.create(CombosScreen.prototype);menu.root={hidden:false};menu.key='student';menu.index=0;menu.render=()=>{};
  menu.handleKey({key:'ArrowDown',preventDefault(){}});assert.equal(menu.routes[menu.index].id,'kkk');
  menu.setFighter('gymbro');assert.equal(menu.index,0);assert.equal(menu.routes.length,1);
  menu.handleKey({key:'ArrowDown',preventDefault(){}});assert.equal(menu.index,0);
});

test('kick sheet keeps eighteen complete poses, a visible full circular arc and unchanged atlas offsets',()=>{
  const c=characters.student,png=readPng(new URL('../src/data/players/student_kick_combo_v1.png',import.meta.url));
  assert.equal(png.width,1920);assert.equal(png.height,960);
  const heights=[];
  for(let i=0;i<18;i++){
    const x0=i%6*320,y0=Math.floor(i/6)*320,frame=c.kickComboArtStart+i;
    assert.deepEqual(c.frameRects[frame],{x:x0,y:8195+y0,width:320,height:320});
    assert.equal(c.frameScales?.[frame]??1,1);assert.equal(c.frameBaselines[frame],8195+y0+304);
    let top=320,bottom=-1,count=0,upperBlue=0;
    for(let y=0;y<320;y++)for(let x=0;x<320;x++){
      const [r,g,b,a]=png.pixel(x0+x,y0+y);if(a<=32)continue;
      count++;top=Math.min(top,y);bottom=Math.max(bottom,y);
      assert.ok(x>0 && x<319 && y>0 && y<319,'hair, toes and circle stay inside the cell');
      if(y<130 && b>r+30 && b>g+5)upperBlue++;
    }
    assert.ok(count>4000);assert.ok(bottom>=301 && bottom<=309);heights.push(bottom-top+1);
    if(i===14)assert.ok(upperBlue>80,'circular motion arc extends above the head');
  }
  assert.ok(heights[14]>heights[2]+20,'last kick has a taller circular silhouette than the front kick');
});
