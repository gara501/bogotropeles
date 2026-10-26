import test from 'node:test';
import assert from 'node:assert/strict';
import {Hud} from '../src/ui/Hud.js';

function fixture(){
  const visual=()=>({
    visible:true,width:100,height:150,text:'',destroyed:false,
    setOrigin(){return this;},setStrokeStyle(){return this;},setScrollFactor(){return this;},setDepth(){return this;},
    setCrop(){return this;},setScale(){return this;},setPosition(){return this;},
    setVisible(value){this.visible=value;return this;},setText(value){this.text=value;return this;},
    setColor(){return this;},destroy(){this.destroyed=true;},
  });
  const enemy={key:'palomera',hp:100,config:{name:'PALOMERA',hp:100,idle:0}};
  const scene={combatTime:1000,enemies:[enemy],lastHit:null,miniBoss:null,boss:null,
    characterKey:'office',character:{name:'GOMELO',idle:4},run:{lives:3,score:0},health:100,game:{},timeLeft:99000,
    add:{image:visual,rectangle:visual,text:visual},
    textures:{get:()=>({referenceHeight:100,get:()=>({width:100,height:150})})}};
  return {scene,enemy,hud:new Hud(scene)};
}

test('lethal hit immediately clears enemy name, portrait and both health bars, including a boss',()=>{
  for(const boss of [false,true]){
    const {scene,enemy,hud}=fixture();scene.lastHit={enemy,at:scene.combatTime};
    if(boss)scene.miniBoss={enemy,def:{name:'PALOMERA'}};
    hud.update();const face=hud.enemyFace;
    assert.equal(hud.enemyName.text,'PALOMERA');assert.equal(hud.enemyName.visible,true);
    enemy.hp=0;hud.update();
    assert.equal(scene.lastHit,null);assert.equal(hud.enemyName.text,'');assert.equal(hud.enemyName.visible,false);
    assert.equal(hud.enemyBox.visible,false);assert.equal(hud.enemyFace,null);assert.equal(face.destroyed,true);
    assert.equal(hud.enemyBar.frame.visible,false);assert.equal(hud.enemyBar.yellow.width,0);assert.equal(hud.enemyBar.red.width,0);
  }
});

test('old-level references and timestamps cannot restore the previous enemy after the combat clock resets',()=>{
  const {scene,enemy,hud}=fixture();
  for(const hit of [{enemy,at:5000},{enemy:{...enemy},at:0}]){
    scene.combatTime=0;scene.lastHit=hit;hud.update();
    assert.equal(scene.lastHit,null);assert.equal(hud.enemyName.text,'');assert.equal(hud.enemyName.visible,false);
  }
  scene.lastHit={enemy,at:0};hud.update();assert.equal(hud.enemyName.visible,true);
  scene.combatTime=2501;hud.update();assert.equal(hud.enemyName.visible,false);
});

test('killing a regular target switches to a living boss, then a fresh hit rebuilds the correct portrait',()=>{
  const {scene,enemy,hud}=fixture(),boss={key:'barra',hp:200,config:{name:'CHIKEN',hp:200}};
  scene.enemies.push(boss);scene.miniBoss={enemy:boss,def:{name:'CHIKEN GOMEZ'}};
  scene.lastHit={enemy,at:1000};hud.update();assert.equal(hud.enemyName.text,'PALOMERA');
  enemy.hp=0;hud.update();assert.equal(hud.enemyName.text,'CHIKEN GOMEZ');
  boss.hp=0;hud.update();assert.equal(hud.enemyFace,null);
  enemy.hp=100;scene.lastHit={enemy,at:1000};hud.update();
  assert.equal(hud.enemyName.text,'PALOMERA');assert.equal(hud.enemyFace.visible,true);
  assert.equal(hud.enemyBar.yellow.width,220);
});
