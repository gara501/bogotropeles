import test from 'node:test';
import assert from 'node:assert/strict';
import {ComboMeter,COMBO,comboTier,comboBonus} from '../src/game/ComboMeter.js';

const scene=()=>{const s={combatTime:0,score:0,popups:[],player:{x:300,y:450},character:{height:110},
  addScore(p){this.score+=p;},scorePopup(x,y,p){this.popups.push(p);}};return s;};

test('combo tiers and the chain bonus follow the table',()=>{
  assert.equal(comboTier(4),null);assert.equal(comboTier(5).mult,1.5);assert.equal(comboTier(19).mult,2);
  assert.equal(comboTier(20).mult,3);assert.equal(comboTier(99).mult,4);
  assert.equal(comboBonus(COMBO.bonusFrom-1),0);assert.equal(comboBonus(12),12*COMBO.bonusPerHit);
});
test('hits within the window chain up and multiply regular kills, not bosses',()=>{
  const s=scene(),c=new ComboMeter(s);
  for(let i=0;i<10;i++){s.combatTime+=500;c.onHit();}
  assert.equal(c.hits,10);assert.equal(c.multiplier,2);
  assert.equal(c.points(100,{}),200);assert.equal(c.points(2000,{boss:true}),2000);assert.equal(c.points(0,{ringFighter:true}),0);
});
test('a pause longer than the window ends the chain and pays its bonus once',()=>{
  const s=scene(),c=new ComboMeter(s);
  for(let i=0;i<12;i++)c.onHit();
  s.combatTime=COMBO.window-1;c.update();assert.equal(c.hits,12,'still alive');
  s.combatTime=COMBO.window+1;c.update();assert.equal(c.hits,0);assert.equal(s.score,12*COMBO.bonusPerHit);
  c.update();assert.equal(s.score,12*COMBO.bonusPerHit,'paid once');
});
test('taking damage cuts the chain without a bonus; a parry adds to it',()=>{
  const s=scene(),c=new ComboMeter(s);
  for(let i=0;i<15;i++)c.onHit();c.onParry();assert.equal(c.hits,15+COMBO.parryHits);
  assert.equal(c.end('hit'),0);assert.equal(c.hits,0);assert.equal(s.score,0);assert.equal(c.best,15+COMBO.parryHits);
});
