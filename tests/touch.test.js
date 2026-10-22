import test from 'node:test';
import assert from 'node:assert/strict';
import {TouchInput,joystickVector} from '../src/input/TouchInput.js';
import {TouchControls} from '../src/input/TouchControls.js';

test('joystick dead zone, analog strength, diagonal clamp and outside drags are stable',()=>{
  assert.deepEqual(joystickVector(2,2,50),{x:0,y:0});
  assert.deepEqual(joystickVector(0,0,0),{x:0,y:0});
  const half=joystickVector(25,0,50);assert.ok(half.x>0 && half.x<1);assert.equal(half.y,0);
  const diagonal=joystickVector(-500,500,50);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10);
  assert.ok(diagonal.x<0 && diagonal.y>0);
});
test('independent fingers can hold movement, punch and jump; releases cannot cancel other actions',()=>{
  const input=new TouchInput();input.x=1;input.down('H',1);input.down('SPACE',2);
  assert.equal(input.isDown('H'),true);assert.equal(input.justDown('SPACE'),true);
  input.up(2);assert.equal(input.isDown('H'),true);assert.equal(input.x,1);
  input.up(1);assert.equal(input.isDown('H'),false);
});
test('special is edge triggered, a quick tap survives until a frame, duplicate fingers do not repeat it',()=>{
  const input=new TouchInput();input.down('K',1);input.down('K',2);
  assert.equal(input.justDown('K'),true);assert.equal(input.justDown('K'),false);
  input.up(1);assert.equal(input.isDown('K'),true);input.up(2);
  input.down('SPACE',3);input.up(3);assert.equal(input.justDown('SPACE'),true);
});
test('cancel, blur, pause and scene transitions can reset every axis, finger and pending action',()=>{
  const cancelled=new TouchInput();cancelled.down('K',1);cancelled.up(1,true);assert.equal(cancelled.justDown('K'),false);
  const input=new TouchInput();input.x=-1;input.y=1;input.down('SHIFT',5);input.down('H',6);input.reset();
  assert.equal(input.x,0);assert.equal(input.y,0);assert.equal(input.isDown('H'),false);assert.equal(input.justDown('SHIFT'),false);
});

test('cycling exposes an enabled mobile dash, disables it on pause and restores combat controls on exit',()=>{
  const previous=globalThis.document;
  const buttons=['P','SHIFT','H','J','K','L','SPACE'].map(action=>({dataset:{touchAction:action},attributes:{},
    setAttribute(name,value){this.attributes[name]=value;},querySelector(){return {};}}));
  globalThis.document={querySelector:()=>buttons[0]};
  try{
    const controls=Object.assign(Object.create(TouchControls.prototype),{buttons,enabled:true,paused:false,cycling:true,game:{scene:{getScene:()=>({characterKey:'student'})}}});
    controls.syncButtons();
    assert.equal(buttons[1].hidden,false);assert.equal(buttons[1].disabled,false);
    assert.match(buttons[1].attributes['aria-label'],/3 segundos.*5 segundos/);
    assert.ok(buttons.slice(2).every(button=>button.hidden && button.disabled));
    controls.paused=true;controls.syncButtons();assert.equal(buttons[1].disabled,true);assert.equal(buttons[0].disabled,false);
    controls.cycling=false;controls.paused=false;controls.syncButtons();
    assert.ok(buttons.every(button=>!button.hidden && !button.disabled));assert.equal(buttons[1].attributes['aria-label'],'Dash');
  }finally{globalThis.document=previous;}
});
