import test from 'node:test';
import assert from 'node:assert/strict';
import {SprayBarrage} from '../src/boss/SprayBarrage.js';

class Visual {
  constructor(x,y){this.x=x;this.y=y;}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setVisible(value){this.visible=value;return this;}
  setDepth(){return this;}
  setDisplaySize(){return this;}
  setAlpha(){return this;}
  destroy(){this.destroyed=true;}
}
const config={count:[8,11],stagger:55,flight:[800,1250],arc:150,radius:24,depth:16,
  stain:{width:48,height:18,color:0xff43c6,ms:1800,damage:3}};
function setup(){
  const hits=[],paint=[];
  const s={floor:{left:785,right:1615,top:415,bottom:500},cameras:{main:{scrollX:720}},
    player:{x:1100,y:460,z:0},combatTime:0,jumpHeight:0,
    add:{image:(x,y)=>new Visual(x,y),ellipse:(x,y)=>new Visual(x,y)},
    hitPlayer:(...args)=>hits.push(args),paintStain:(...args)=>paint.push(args)};
  const owner={x:1450,y:460,hp:500,facing:-1,config:{throw:{lift:92,texture:'spraycan'}}};
  const barrage=new SprayBarrage(s,()=>.5);barrage.launch(owner,config,6);
  return {s,owner,barrage,hits,paint};
}

test('a volley spans the scrolled screen, telegraphs its fixed targets and cannot stack',()=>{
  const {s,owner,barrage,hits}=setup();assert.equal(barrage.cans.length,10);
  assert.ok(barrage.cans.every(c=>c.x>=785 && c.x<=1615 && c.y>=427 && c.y<=488));
  assert.ok(new Set(barrage.cans.map(c=>c.x)).size>=8);
  assert.equal(barrage.launch(owner,config,6),false);
  const can=barrage.cans[0],x=can.x,y=can.y;
  s.player.x+=100;s.combatTime=400;barrage.update();assert.equal(hits.length,0);
  assert.equal(can.x,x);assert.equal(can.y,y,'landing spot does not track the player after the warning');
  const spriteY=can.sprite.y;barrage.update();assert.equal(can.sprite.y,spriteY,'simulation time drives flight and freezes during pause');
});

test('a can only hits on landing near its marker; jumping avoids impact; paint still lands',()=>{
  for(const jump of [0,40]){
    const {s,barrage,hits,paint}=setup(),can=barrage.cans[0];s.player.z=jump;
    s.combatTime=can.duration-1;barrage.update();assert.equal(hits.length,0);
    s.combatTime=can.duration;barrage.update();assert.equal(hits.length,jump?0:1);
    assert.equal(paint.length,1);assert.equal(can.sprite.destroyed,true);assert.equal(can.marker.destroyed,true);
    s.combatTime+=1;barrage.update();assert.equal(hits.length,jump?0:1,'landed cans cannot hit twice');
  }
});

test('boss death and explicit cleanup remove every can and warning without damage',()=>{
  for(const dead of [false,true]){
    const {owner,barrage,hits,paint}=setup(),cans=[...barrage.cans];
    if(dead){owner.hp=0;barrage.update();}else barrage.clear();
    assert.equal(barrage.active,false);assert.equal(hits.length,0);assert.equal(paint.length,0);
    assert.ok(cans.every(c=>c.sprite.destroyed && c.marker.destroyed));barrage.clear();
  }
});
