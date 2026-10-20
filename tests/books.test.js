import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { registerHooks } from 'node:module';
import { BOOKS, positionBook, blastRadius, blastReaches, isStudentFringe } from '../src/data/books.js';
import { OrbitingBooks } from '../src/specials/OrbitingBooks.js';
import { BossController } from '../src/boss/BossController.js';

const hooks=registerHooks({load(url,context,nextLoad){
  if(url.endsWith('/src/data/levels.js'))return {format:'module',source:'export const levels=[];export const levelTextures=()=>[];',shortCircuit:true};
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  if(url.includes('/node_modules/phaser/'))return {format:'module',source:'export default {Scene:class{},Math:{Clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}};',shortCircuit:true};
  return nextLoad(url,context);
}});
const {characters}=await import('../src/data/characters.js');
const {StreetScene}=await import('../src/scenes/StreetScene.js');hooks.deregister();

class Visual extends EventEmitter {
  constructor(x=0,y=0){super();this.x=x;this.y=y;this.anims={};}
  setPosition(x,y){this.x=x;this.y=y;return this;}
  setDepth(v){this.depth=v;return this;}
  setVisible(v){this.visible=v;return this;}
  setText(v){this.text=v;return this;}
  destroy(){this.destroyed=true;this.removeAllListeners();}
}
for(const method of ['setColor','setRotation','setOrigin','setAlpha','setDisplaySize','setFlipX','setTint','clearTint','setFrame','stop'])Visual.prototype[method]=function(){return this;};
function setup(balance=BOOKS) {
  const s={combatTime:1000,specialReadyAt:0,health:100,finished:false,paused:false,
    hurtUntil:0,dashUntil:0,jumpStart:-1000,facing:1,character:characters.student,
    player:{x:400,y:450,sprite:new Visual()},playerAttack:null,enemies:[],boss:null,hits:[],
    floor:{left:65,right:895,top:410,bottom:500},sound:{},
    healthBar:new Visual(),cameras:{main:{shake(){}}},tweens:{add(){}},updateCounter(){},
    add:{text:(x,y)=>new Visual(x,y),image:(x,y)=>new Visual(x,y),rectangle:(x,y)=>new Visual(x,y),graphics:()=>new Visual()},
    play(actor,state){actor.animation=state;},idle(){},placeFighter(){},
    makeFighter:(x,y,key,config)=>({x,y,key,config,sprite:new Visual(),shadow:new Visual()}),
    hitEnemy(enemy,attack){this.hits.push(enemy);StreetScene.prototype.hitEnemy.call(this,enemy,attack);},
  };
  const special=new OrbitingBooks(s,balance);s.books=special;
  const frame=n=>s.player.sprite.emit('animationupdate',{key:'student-books'},{textureFrame:n});
  const summon=()=>{assert.equal(special.start(),true);s.combatTime+=240;frame(19);s.playerAttack=null;return special;};
  const enemy=(x,y)=>({x,y,hp:100,config:{hp:100},tell:new Visual(),healthBar:new Visual(),sprite:new Visual(),shadow:new Visual()});
  const advance=ms=>{for(let left=ms;left>0;){const step=Math.min(left,50);if(!s.paused)s.combatTime+=step;special.update(step/1000);left-=step;}};
  return {s,special,frame,summon,enemy,advance};
}

test('balance: one-second explosion, 3 s recharge; every existing action stays and embedded books never animate',()=>{
  assert.equal(BOOKS.attack.damage,characters.student.attacks.punch.damage*2.2);
  assert.equal(BOOKS.count,8);assert.equal(BOOKS.activeMs,1000);assert.equal(BOOKS.cooldownMs,3000);
  assert.ok(BOOKS.expandMs<BOOKS.activeMs);assert.equal(blastRadius(0),BOOKS.startRadius);assert.equal(blastRadius(BOOKS.expandMs),BOOKS.blastRadius);
  assert.ok(characters.student.speed>characters.office.speed);
  for(const action of ['walk','punch','kick','lowKick','books','hurt','defeat'])assert.ok(characters.student.animations[action]);
  assert.deepEqual(characters.student.animations.books,[16,17,19,4]);
  for(const frames of Object.values(characters.student.animations))assert.ok(!frames.includes(18));
  assert.equal(characters.student.animations.books.indexOf(19)*480/4,BOOKS.attack.hitAt);
});

test('only the summon frame starts the explosion and consumes cooldown once',()=>{
  const {s,special,frame}=setup();special.start();frame(16);frame(17);
  assert.equal(s.specialReadyAt,0);assert.ok(special.books.every(b=>!b.sprite.visible));
  s.combatTime+=240;frame(19);frame(19);assert.equal(s.specialReadyAt,4240);
  assert.equal(special.activeUntil,2240);assert.ok(special.books.every(b=>b.sprite.visible));
  assert.match(special.label.text,/EXPLOSIÓN 1.0/);
  s.playerAttack=null;s.specialReadyAt=0;assert.equal(special.start(),false,'active explosion blocks even zero cooldown');
});

test('defeat, immobilization, attack, dash, jump, cooldown, pause and finished block preparation',()=>{
  for(const block of [s=>s.health=0,s=>s.hurtUntil=2000,s=>s.playerAttack={type:'punch'},
    s=>s.dashUntil=2000,s=>s.jumpStart=900,s=>s.specialReadyAt=2000,s=>s.paused=true,s=>s.finished=true]) {
    const {s,special}=setup();block(s);assert.equal(special.start(),false);assert.equal(special.activeUntil,0);
  }
  const {s,special}=setup();special.start();const original=s.playerAttack;
  StreetScene.prototype.startAttack.call(s,'punch');assert.equal(s.playerAttack,original);
});

test('damage before summon cancels preparation without cooldown; after summon leaves books active',()=>{
  const {s,special,frame,summon}=setup();special.start();const cancelled=s.playerAttack;
  StreetScene.prototype.hitPlayer.call(s,10);frame(19);
  assert.equal(special.summon(cancelled),false);assert.equal(s.specialReadyAt,0);assert.equal(special.activeUntil,0);
  s.combatTime+=1000;summon();const expiry=special.activeUntil;
  StreetScene.prototype.hitPlayer.call(s,10);assert.equal(special.activeUntil,expiry);
  s.combatTime+=1000;StreetScene.prototype.startAttack.call(s,'punch');assert.equal(s.playerAttack.type,'punch');
});

test('books burst outward from the cast point, which stays fixed while she moves',()=>{
  const {s,special,summon,advance}=setup();summon();
  special.books.forEach((book,i)=>{
    const expected={};positionBook(expected,{x:400,y:450},i*Math.PI*2/BOOKS.count,BOOKS.startRadius);
    assert.ok(Math.abs(book.x-expected.x)<1e-9);assert.ok(Math.abs(book.y-expected.y)<1e-9);
    assert.equal(book.sprite.y,book.y-BOOKS.flightHeight);
  });
  s.player.x+=100;s.player.y-=30;advance(BOOKS.expandMs);
  assert.deepEqual(special.center,{x:400,y:450});assert.equal(special.radius,BOOKS.blastRadius);
  const book=special.books[0];assert.ok(Math.abs(Math.hypot(book.x-400,(book.y-450)/BOOKS.perspective)-BOOKS.blastRadius)<1e-9);
});

test('the blast takes at least half of a regular enemy\'s energy; bosses take more than any normal strike',()=>{
  assert.equal(BOOKS.enemyShare,.6);
  const strongest=Math.max(...Object.values(characters).flatMap(c=>['punch','kick','lowKick'].map(k=>c.attacks[k]?.damage??0)));
  assert.ok(BOOKS.bossDamage>strongest);
  const {s,summon,enemy}=setup();
  const tough=Object.assign(enemy(400,450),{hp:430,config:{hp:430}}),boss=Object.assign(enemy(405,452),{hp:1500,config:{hp:1500,boss:true}});
  s.enemies=[tough,boss];summon();assert.equal(tough.hp,172);assert.equal(boss.hp,1500-BOOKS.bossDamage);
});

test('every enemy reached by the blast is hit exactly once',()=>{
  const {s,special,summon,enemy,advance}=setup();
  const a=enemy(400,450),b=enemy(405,452);s.enemies=[a,b];summon();
  assert.equal(a.hp,40);assert.equal(b.hp,40);assert.equal(s.hits.length,2);
  advance(900);assert.equal(a.hp,40);assert.equal(b.hp,40);assert.equal(s.hits.length,2);
});

test('the blast front grows to reach nearby enemies and never distant ones; knockback pushes outward',()=>{
  const {s,special,summon,enemy,advance}=setup();
  const near=enemy(540,450),farX=enemy(620,450),farY=enemy(400,560),behind=enemy(300,470);s.enemies=[near,farX,farY,behind];summon();
  assert.equal(near.hp,100,'outside the initial radius');
  advance(BOOKS.expandMs);
  assert.equal(near.hp,40);assert.equal(behind.hp,40);assert.equal(farX.hp,100);assert.equal(farY.hp,100);
  assert.ok(near.x>540 && behind.x<300,'real damage pipeline pushes outward');
  assert.equal(blastReaches({x:0,y:0},{x:0,y:BOOKS.blastRadius*BOOKS.perspective+20},BOOKS.blastRadius),false);
});

test('dead, allied, shielded and invulnerable enemies do not receive book damage',()=>{
  const {s,special,summon,enemy}=setup();summon();
  for(const state of [{hp:0},{dead:true},{team:'player'},{team:'friend'},{shielded:true},{invulnerable:true},{invulnerableUntil:9999}]) {
    const e=Object.assign(enemy(430,450),state);s.player.team='friend';s.enemies=[e];special.update(0);assert.equal(e.hp,state.hp??100);
  }
  assert.equal(s.hits.length,0);
});

test('actual Dormilon controller blocks Vuelva mañana; the blast hits him only once',()=>{
  const {s,special,summon,advance}=setup();
  const boss=new BossController(s,{height:118});s.boss=boss;boss.actor.x=430;boss.actor.y=450;
  boss.state='attack';boss.attack={key:'shield'};const hp=boss.hp;
  summon();advance(100);assert.equal(boss.hp,hp);assert.ok(boss.blockUntil>s.combatTime);
  const second=setup();const other=new BossController(second.s,{height:118});second.s.boss=other;other.actor.x=430;other.actor.y=450;
  other.state='idle';const full=other.hp;second.summon();second.advance(500);assert.equal(other.hp,full-BOOKS.bossDamage);
});

test('pause freezes the explosion and cooldown; expiration shows remaining recovery then ready',()=>{
  const {s,special,summon,advance}=setup();summon();advance(500);
  const angle=special.angle,expiry=special.activeUntil,ready=s.specialReadyAt;
  s.paused=true;advance(5000);assert.equal(special.angle,angle);assert.equal(special.activeUntil,expiry);assert.equal(s.specialReadyAt,ready);
  s.paused=false;advance(499);assert.equal(special.active,true);assert.ok(special.books.every(b=>b.sprite.visible));
  advance(1);assert.equal(special.active,false);assert.ok(special.books.every(b=>!b.sprite.visible));
  assert.match(special.label.text,/RECARGA 2.0/);advance(2000);assert.match(special.label.text,/LISTOS/);assert.equal(special.start(),true);
});

test('death removes books immediately; teardown removes all visuals, contacts and the single listener',()=>{
  const {s,special,summon}=setup();summon();const visuals=special.books.map(b=>b.sprite);
  StreetScene.prototype.hitPlayer.call(s,100);assert.equal(special.active,false);assert.ok(visuals.every(v=>!v.visible));
  assert.equal(s.player.sprite.listenerCount('animationupdate'),1);special.destroy();
  assert.equal(s.player.sprite.listenerCount('animationupdate'),0);assert.equal(special.struck.size,0);assert.ok(visuals.every(v=>v.destroyed));
  const restarted=new OrbitingBooks(s);assert.equal(s.player.sprite.listenerCount('animationupdate'),1);restarted.destroy();
});

test('fringe cleanup removes near-pure key colors and preserves denim, cream, hair and skin',()=>{
  for(const rgb of [[0,0,255],[255,0,0],[0,255,255],[255,255,0],[255,0,255]])assert.equal(isStudentFringe(...rgb),true);
  for(const rgb of [[70,120,180],[230,220,193],[81,46,27],[235,170,110],[20,22,25]])assert.equal(isStudentFringe(...rgb),false);
});

test('spell plays once at actual special activation, with no sound for interrupted preparation',()=>{
  const {s,special,frame}=setup(),sounds=[];s.sfx={play:name=>sounds.push(name)};
  special.start();const cancelled=s.playerAttack;s.playerAttack=null;
  assert.equal(special.summon(cancelled),false);assert.deepEqual(sounds,[]);
  special.start();
  assert.deepEqual(sounds,[]);
  frame(19);frame(19);
  assert.deepEqual(sounds,['spell']);
});

test('books spends 10 energy only on activation and blocks insufficient energy',()=>{
  const {s,special,frame}=setup();s.health=11;
  special.start();assert.equal(s.health,11);frame(19);frame(19);assert.equal(s.health,1);
  s.playerAttack=null;s.specialReadyAt=0;special.clear();
  assert.equal(special.start(),false);assert.equal(s.health,1);
  s.health=20;special.start();s.health=10;frame(19);assert.equal(s.health,10);assert.equal(s.specialReadyAt,0);
});
