import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseFruitThrow,createFruitFlight,fruitPosition,fruitHitsPlayer} from '../src/projectiles/fruitLob.js';

const floor={left:65,right:895,top:390,bottom:500};
const config={fruit:'orange',watermelonChance:.28,speed:390,lift:78,arc:105,radius:17,depth:17,damage:12,
  watermelon:{damage:22,radius:80,depth:34,poses:[12,13,14,15]}};
test('fruit choice fixes projectile, damage and animation together at windup',()=>{
  assert.equal(chooseFruitThrow(config,()=>.8),config);
  const melon=chooseFruitThrow(config,()=>.1);
  assert.equal(melon.fruit,'watermelon');assert.equal(melon.damage,22);assert.deepEqual(melon.poses,[12,13,14,15]);
  assert.equal(config.fruit,'orange');assert.equal(chooseFruitThrow({texture:'knife'}).texture,'knife');
});
test('fruit arcs to a fixed target in both lanes and finishes at ground level despite a long frame',()=>{
  const player={x:200,y:410},flight=createFruitFlight({x:600,y:480},player,config,floor);
  player.x=800;player.y=500;
  const half=fruitPosition(flight,flight.duration/2);
  assert.equal(half.x,400);assert.equal(half.groundY,445);assert.ok(half.y<half.groundY-100);
  const end=fruitPosition(flight,5);assert.equal(end.x,200);assert.equal(end.y,410);assert.equal(end.landed,true);
});
test('watermelon blast is wider, escapable by lane movement or jumping, and only near landing',()=>{
  const flight=createFruitFlight({x:600,y:480},{x:300,y:450},config,floor);
  const melon=chooseFruitThrow(config,()=>0);
  assert.equal(fruitHitsPlayer(flight,{x:365,y:450},config),false);
  assert.equal(fruitHitsPlayer(flight,{x:365,y:450},melon),true);
  assert.equal(fruitHitsPlayer(flight,{x:300,y:500},melon),false);
  assert.equal(fruitHitsPlayer(flight,{x:300,y:450},melon,60),false);
});
