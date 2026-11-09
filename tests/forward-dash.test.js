import test from 'node:test';
import assert from 'node:assert/strict';
import {ForwardDash} from '../src/input/ForwardDash.js';

test('forward dash requires two released taps in the same direction within 300 ms',()=>{
  for(const direction of [-1,1]){
    const gesture=new ForwardDash();
    assert.equal(gesture.capture(direction,0,direction,1),false);
    for(let frame=2;frame<12;frame++)assert.equal(gesture.capture(direction,0,direction,frame),false);
    gesture.capture(0,0,direction,12);
    assert.equal(gesture.capture(direction,0,direction,14),true);
    gesture.capture(0,0,direction,15);
    assert.equal(gesture.capture(direction,0,direction,16),false,'a third tap cannot retrigger');
    gesture.capture(0,0,direction,17);
    assert.equal(gesture.capture(direction,0,direction,40),false,'slow taps are walking');
  }
});

test('thumb drift, opposite movement, vertical movement and input reset cannot trigger a dash',()=>{
  const gesture=new ForwardDash();
  gesture.capture(.8,0,1,1);
  for(const x of [.55,.7,.4,.8])assert.equal(gesture.capture(x,0,1,2),false);
  gesture.capture(0,0,1,3);
  assert.equal(gesture.capture(-1,0,1,4),false);
  gesture.capture(0,0,1,5);
  assert.equal(gesture.capture(1,0,1,6),false);
  gesture.capture(0,0,1,7);
  assert.equal(gesture.capture(.8,1,1,8),false);
  gesture.reset();
  assert.equal(gesture.capture(1,0,1,9),false);
});
