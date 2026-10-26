import test from 'node:test';
import assert from 'node:assert/strict';
import {RingRound,RING_ORDER,RING_BONUS,shouldStartRingBonus} from '../src/bonus/ringRules.js';
import {RingBonus} from '../src/bonus/RingBonus.js';
import {RingFighter} from '../src/actors/RingFighter.js';
class V {constructor(x=0,y=0){this.x=x;this.y=y;}destroy(){this.destroyed=true;}setText(t){this.text=t;return this;}setPosition(x,y){this.x=x;this.y=y;return this;}}
for(const n of ['setVisible','setDepth','setOrigin','setScrollFactor','setDisplaySize','setFlipX','clear','lineStyle','strokeEllipse','fillStyle','fillTriangle'])V.prototype[n]=function(){return this;};
function setup(kind='cristiano'){
 const hits=[],sounds=[],shots=[],a={x:650,y:430,z:0,hp:400,facing:-1,config:{ringFighter:kind,hp:400,speed:150,name:kind},tell:new V(),sprite:new V(),healthBar:new V()};
 const s={player:{x:400,y:430,z:0},floor:{left:65,right:895,top:330,bottom:450},health:100,character:{name:'TEST'},combatTime:1000,level:{},enemies:[],run:{score:0},timeLeft:0,paused:false,
 add:{text:(x,y)=>new V(x,y),graphics:()=>new V(),image:(x,y)=>new V(x,y)},sfx:{play:k=>sounds.push(k)},hitPlayer:d=>{hits.push(d);return true;},addScore(n){this.run.score+=n;},game:{events:{emit(){}}}};
 const runtime={scene:s,enemies:new Map(),combat:{frozen:()=>false,touches:()=>true},clearInput(){},player:{hurt(){},transition(){}}};s.arcade=runtime;s.ringBonus={projectile:(o,k)=>shots.push(k),fx:new V()};
 const m={scene:s,runtime,actor:a,pose(n,i){this.frame=i;},transition(n){this.state=n;},move(dx,dy){a.x+=dx;a.y+=dy;}};const c=new RingFighter(m);m.ringFighter=c;runtime.enemies.set(a,m);
 const step=(n=1)=>{for(let i=0;i<n;i++){s.combatTime+=1000/60;c.step();}};
 return {s,a,m,c,step,hits,shots,sounds,runtime};
}
test('ring follows playable level six exactly once, independently of the chiva',()=>{
 const run={chivaBonusPlayed:true,ringBonusPlayed:false};assert.equal(shouldStartRingBonus(6,run),true);for(const i of [3,5,7])assert.equal(shouldStartRingBonus(i,run),false);run.ringBonusPlayed=true;assert.equal(shouldStartRingBonus(6,run),false);
});
test('ring uses one two-minute clock, strict ordering and exactly 10,000 for all four',()=>{
 const r=new RingRound();assert.equal(r.defeat(RING_ORDER[0]),false);r.step(3000);assert.equal(r.remainingMs,120000);
 assert.equal(r.defeat(RING_ORDER[3]),false);
 for(const key of RING_ORDER){r.step(25000);assert.equal(r.defeat(key),true);assert.equal(r.defeat(key),false);}
 assert.equal(r.state,'won');assert.equal(r.points,10000);r.step(1000000);assert.equal(r.points,10000);
});
test('deadline and knockout never pay partial points; a fourth kill just before deadline wins',()=>{
 for(const reason of ['timeout','knockout']){const r=new RingRound();r.step(3000);r.defeat(RING_ORDER[0]);if(reason==='timeout')r.step(120000);else r.finish(false);assert.equal(r.points,0);assert.equal(r.defeat(RING_ORDER[1]),false);}
 const r=new RingRound();r.step(3000);for(const key of RING_ORDER.slice(0,3))r.defeat(key);r.step(119999);assert.equal(r.defeat(RING_ORDER[3]),true);assert.equal(r.points,10000);
});
test('Cristiano charges along a fixed lane with closed-eye flurry, then rests exactly two seconds',()=>{
 const e=setup();e.c.start('flail');const x=e.a.x;e.step(28);assert.equal(e.a.x,x);e.s.player.y=340;e.step(54);assert.equal(e.c.mode,'tired');assert.ok(e.a.y>400);e.step(119);assert.equal(e.c.mode,'tired');e.step();assert.equal(e.c.mode,'idle');
});
test('Cristiano cries on hits; hits during recovery cannot shorten his punishment window',()=>{
 const e=setup();e.c.start('flail');e.c.hurt();assert.equal(e.c.mode,'tired');e.step(50);e.c.hurt();assert.equal(e.c.age,50);e.step(69);assert.equal(e.c.mode,'tired');e.step();assert.equal(e.c.mode,'idle');assert.ok(e.sounds.includes('ringCry'));
 e.c.start('cartwheel');e.step(20);assert.ok(e.a.z>20);e.step(22);assert.equal(e.a.z,0);assert.equal(e.c.mode,'idle');
});
test('Piernas tosses bills and coins and has a telegraphed long kick; movement wobbles',()=>{
 const e=setup('piernas');e.c.start('money');e.step(43);assert.deepEqual(e.shots,['bill','coin']);e.c.start('kick');e.step(27);assert.equal(e.hits.length,0);e.step();assert.deepEqual(e.hits,[16]);
 e.c.set('idle');e.s.player.y=e.a.y;const y=e.a.y;e.step(5);assert.notEqual(e.a.y,y);
});
test('Brincolas laughs and jumps to the other side before slapping',()=>{
 const e=setup('brincolas');e.c.start('hop');e.step(30);assert.ok(e.a.z>40);assert.ok(e.sounds.includes('ringLaugh'));e.step(35);assert.equal(e.c.mode,'slap');assert.equal(e.a.z,0);assert.ok(e.a.x<e.s.player.x);e.step(18);assert.deepEqual(e.hits,[11]);
});
test('MiniLaja only heals below 20%, leaps away, dances, heals 10%, and interruption prevents the heal',()=>{
 const e=setup('minilaja');e.a.hp=80;e.step();assert.equal(e.c.mode,'idle');e.a.hp=76;e.step();assert.equal(e.c.mode,'healLeap');e.step(54);assert.equal(e.c.mode,'dance');e.step(119);assert.equal(e.a.hp,76);e.step();assert.equal(e.a.hp,116);e.step(24);assert.equal(e.c.mode,'idle');
 const i=setup('minilaja');i.a.hp=50;i.step();i.step(54+60);i.c.hurt();i.step(100);assert.equal(i.a.hp,50);assert.ok(i.c.healReady>i.c.clock);
});
test('bonus manager spawns one opponent at a time, clears old shots and pays only once',()=>{
 const e=setup(),spawned=[],events=[];e.s.spawnEnemy=(key)=>{const a={key,hp:400,x:0,y:0,facing:1,config:{name:key},tell:new V()};spawned.push(a);e.s.enemies.push(a);return a;};e.s.game.events.emit=(...v)=>events.push(v);
 const b=new RingBonus(e.s);e.s.ringBonus=b;for(let i=0;i<181;i++)b.tick();assert.equal(spawned.length,1);
 for(const key of RING_ORDER){assert.equal(b.current.key,key);const a=b.current;a.hp=0;b.onDefeated(a);b.onDefeated(a);for(let i=0;i<56;i++)b.tick();}
 assert.deepEqual(spawned.map(a=>a.key),RING_ORDER);assert.equal(e.s.run.score,10000);for(let i=0;i<200;i++)b.tick();assert.equal(e.s.run.score,10000);assert.equal(events.filter(e=>e[0]==='bonus-complete').length,1);b.destroy();
});
test('bonus knockout resolves without charging a campaign life and timers pause',()=>{
 const e=setup(),b=new RingBonus(e.s);e.s.ringBonus=b;e.s.paused=true;b.tick();assert.equal(b.age,0);e.s.paused=false;b.round.step(3000);e.s.health=0;b.knockout();assert.equal(e.s.health,1);assert.equal(b.round.state,'knockout');assert.equal(b.round.points,0);
});
