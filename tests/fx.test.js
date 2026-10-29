import test from 'node:test';
import assert from 'node:assert/strict';
import {ParticleSystem} from '../src/fx/ParticleSystem.js';
import {Lighting} from '../src/fx/Lighting.js';
import {Fx,QUALITY} from '../src/fx/Fx.js';

const sprite=()=>{const s={visible:true,destroyed:false};for(const m of ['setOrigin','setDisplaySize','setScrollFactor','setFrame','setBlendMode','setDepth','setPosition','setScale','setRotation','setAlpha','setTint'])s[m]=()=>s;s.setVisible=v=>{s.visible=v;return s;};s.destroy=()=>{s.destroyed=true;};return s;};

test('particles expire, are recycled and never exceed the limit',()=>{
  let created=0;const ps=new ParticleSystem({max:10,create:()=>{created++;return sprite();}});
  for(let i=0;i<25;i++)ps.emit({life:100});
  assert.equal(ps.count,10);assert.equal(created,10);
  ps.update(50);assert.equal(ps.count,10);
  ps.update(60);assert.equal(ps.count,0);
  for(let i=0;i<10;i++)ps.emit({life:100});
  assert.equal(created,10,'recycled sprites, no new allocations');
});

test('lowering the limit sheds live particles on the next update',()=>{
  const ps=new ParticleSystem({max:50,create:sprite});
  for(let i=0;i<40;i++)ps.emit({life:1000});
  ps.setLimit(10);ps.update(16);
  assert.ok(ps.count<=10);
});

test('particles move with velocity, gravity and drag',()=>{
  const ps=new ParticleSystem({create:sprite});
  const p=ps.emit({x:0,y:0,vx:2,vy:0,ay:1,drag:0,life:1000});
  ps.update(1000/60*10);
  assert.ok(Math.abs(p.x-20)<1e-6);assert.ok(p.vy>9);
});

test('Fx is a harmless no-op on scenes that cannot create canvas textures',()=>{
  const fx=new Fx({});
  assert.equal(fx.hit(0,0,1,'punch'),false);assert.equal(fx.quake(0,0,100),false);
  fx.update(16);fx.flash(0,0);fx.lamp({},0,0);fx.destroy();
  assert.equal(fx.stats().quality,'off');
});

test('Fx sheds load when the frame rate stays low and recovers when it returns',()=>{
  const loop={actualFps:30},fx=Object.create(Fx.prototype);
  Object.assign(fx,{ready:true,quality:QUALITY.high,slow:0,fast:0,ticks:0,scene:{game:{loop}},apply(){}});
  for(let i=0;i<3;i++)fx.govern();assert.equal(fx.quality,QUALITY.low);
  for(let i=0;i<3;i++)fx.govern();assert.equal(fx.quality,QUALITY.off);
  loop.actualFps=60;for(let i=0;i<20;i++)fx.govern();assert.equal(fx.quality,QUALITY.low);
});


function superFx(quality=QUALITY.high){
  const fx=Object.create(Fx.prototype),scene={add:{image:sprite}};
  Object.assign(fx,{scene,ready:true,quality,rng:()=>.5,pinned:true,ticks:0});
  fx.particles=new ParticleSystem({max:220,create:sprite});fx.lighting=new Lighting(scene);fx.apply();return fx;
}
test('super charge converges particles and grows one light; release produces a radial blast',()=>{
  const fx=superFx(),owner={};
  for(let age=1;age<30;age++){fx.update(1000/60);fx.superCharge(owner,300,350,560,age,30,0x68efff);}
  assert.ok(fx.particles.count>0);assert.equal(fx.lighting.lamps.size,1);
  assert.ok(fx.lighting.lamps.get(owner).radius>120);
  for(const p of fx.particles.live)assert.ok((300-p.x)*p.vx+(350-p.y)*p.vy>=-1,'charge particles travel inward');
  fx.superBlast(owner,300,350,560,0x68efff);
  assert.equal(fx.lighting.lamps.size,0);assert.equal(fx.lighting.flashes.length,1);
  assert.equal(fx.particles.count,46);assert.ok(fx.particles.live.some(p=>p.frame==='ring'));
  assert.ok(fx.particles.live.some(p=>p.frame==='glow'));assert.ok(fx.particles.live.some(p=>p.vx>0));assert.ok(fx.particles.live.some(p=>p.vx<0));
  fx.update(600);assert.equal(fx.particles.count,0);assert.equal(fx.lighting.count,0);fx.destroy();
});
test('super effects respect low/off quality and cleanup preserves particles and lights from other effects',()=>{
  const fx=superFx(QUALITY.low),owner={},other={};
  fx.superBlast(owner,300,350,560,0xffd166);assert.equal(fx.particles.count,24);
  fx.particles.emit({owner:other,life:1000});fx.lighting.flash(10,20,{owner:other,ms:1000});
  fx.clearSuper(owner);assert.equal(fx.particles.count,1);assert.equal(fx.particles.live[0].owner,other);
  assert.equal(fx.lighting.count,1);assert.equal(fx.lighting.flashes[0].owner,other);
  fx.setQuality(QUALITY.off);assert.equal(fx.superCharge(owner,0,0,0,3,30,0xffffff),false);
  assert.equal(fx.superBlast(owner,0,0,0,0xffffff),false);assert.equal(fx.particles.count,0);fx.destroy();
});
test('recycled super particles lose their old owner before ordinary effects reuse them',()=>{
  const ps=new ParticleSystem({create:sprite}),owner={};ps.emit({owner,life:1});ps.update(2);
  const normal=ps.emit({life:100});ps.clearOwner(owner);assert.equal(ps.count,1);assert.equal(normal.owner,null);ps.destroy();
});
