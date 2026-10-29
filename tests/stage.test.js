import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARCADE} from '../src/data/arcade.js';
import {COMBAT_CAMPAIGN as CAMPAIGN} from '../src/data/campaign.js';
import {waveSizes,stageLayout,arenaScroll,nextScroll,floorSpan,viewLeft} from '../src/stage/scroll.js';
import {WaveDirector} from '../src/combat/WaveDirector.js';
import {ParallaxBackground} from '../src/stage/ParallaxBackground.js';

test('El Dorado pans one continuous panorama across every arena without wrapping or exposing its ends',()=>{
  const level=CAMPAIGN.find(level=>level.boss==='jugo'),layout=stageLayout({...level,total:25}),images=[],tiles=[];
  const makeSprite=()=>({x:0,setOrigin(){return this;},setScrollFactor(){return this;},setDepth(){return this;},
    setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},destroy(){this.destroyed=true;}});
  const frames=new Map(),texture={getSourceImage:()=>({width:2109,height:745}),has:key=>frames.has(key),add:(key,...rect)=>frames.set(key,rect)};
  const scene={textures:{get:()=>texture},
    add:{image(){const sprite=makeSprite();images.push(sprite);return sprite;},tileSprite(){const sprite=makeSprite();sprite.setTileScale=scale=>{sprite.scale=scale;return sprite;};tiles.push(sprite);return sprite;}}};
  const background=new ParallaxBackground(scene,level.art.layers,layout.width),sprite=images[0];
  assert.equal(level.art.layers[0].repeat,false);assert.equal(tiles.length,1);assert.equal(images.length,1);
  assert.deepEqual([...frames.values()][0],[0,0,559,2109,186]);
  assert.equal(sprite.displayWidth,2109*540/745);assert.equal(sprite.displayHeight,540);
  const travel=sprite.displayWidth-960;
  for(const scroll of [0,240,720,960,1440,2160,2880]){
    background.update(scroll);assert.ok(Math.abs(sprite.x+scroll*travel/(layout.width-960))<1e-8);
    assert.ok(sprite.x<=0 && sprite.x+sprite.displayWidth>=960-1e-8);
    assert.ok(Math.abs(tiles[0].tilePositionX*tiles[0].scale-scroll)<1e-8,'asphalt moves at full world speed while the facade pans');
  }
  background.update(layout.width*2);assert.equal(sprite.x,-travel);
  background.update(-100);assert.equal(sprite.x,0);
  background.destroy();assert.equal(sprite.destroyed,true);
});

test('existing repeating parallax layers retain their scale and drift offsets',()=>{
  const sprite={setOrigin(){return this;},setScrollFactor(){return this;},setDepth(){return this;},
    setTileScale(scale){this.scale=scale;return this;},destroy(){}};
  const scene={textures:{get:()=>({getSourceImage:()=>({width:1920,height:1080})})},add:{tileSprite:()=>sprite}};
  const background=new ParallaxBackground(scene,[{key:'sky',factor:.2,drift:6}],3840);
  background.update(720,1000);assert.equal(sprite.scale,.5);assert.equal(sprite.tilePositionX,300);
});

test('Andino facade pans continuously through all six arenas while its floor retains full speed',()=>{
  const level=CAMPAIGN.find(level=>level.boss==='pacho'),layout=stageLayout(level);
  const png=readFileSync(new URL('../src/scenes/level7/panorama.png',import.meta.url));
  const source={width:png.readUInt32BE(16),height:png.readUInt32BE(20)},images=[],tiles=[];
  const visual=()=>({x:0,setOrigin(){return this;},setScrollFactor(){return this;},setDepth(){return this;},
    setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},setTileScale(scale){this.scale=scale;return this;},destroy(){this.destroyed=true;}});
  const scene={textures:{get:key=>({getSourceImage:()=>key==='panorama'?source:{width:960,height:540}})},
    add:{image(){const v=visual();images.push(v);return v;},tileSprite(){const v=visual();tiles.push(v);return v;}}};
  const layers=level.art.layers.map(layer=>({...layer,key:layer.file})),background=new ParallaxBackground(scene,layers,layout.width);
  assert.equal(images.length,1);assert.equal(tiles.length,1);assert.equal(layout.arenas,6);
  assert.equal(images[0].displayHeight,560,'panorama curb aligns with the original floor at y=402');
  const panorama=images[0],travel=panorama.displayWidth-960;let previous=0;
  assert.ok(travel>0);assert.equal(panorama.displayWidth/panorama.displayHeight,source.width/source.height);
  for(let scroll=0;scroll<=layout.width-960;scroll+=90){
    background.update(scroll);assert.ok(panorama.x<=previous);assert.ok(panorama.x>=-travel);
    assert.ok(panorama.x+panorama.displayWidth>=960-1e-8);
    assert.equal(tiles[0].tilePositionX,scroll);previous=panorama.x;
  }
  background.update(layout.width-960);assert.equal(panorama.x,-travel);
  background.destroy();assert.ok([...images,...tiles].every(v=>v.destroyed));
});

test('wave sizes follow the campaign rule and every level splits into arenas',()=>{
  assert.deepEqual(waveSizes(15),[2,3,2,3,2,3]);
  for(const level of CAMPAIGN){
    const sizes=waveSizes(level.total),layout=stageLayout(level);
    assert.equal(sizes.reduce((a,b)=>a+b,0),level.total);
    assert.equal(layout.arenas,Math.ceil(sizes.length/ARCADE.stage.wavesPerArena));
    assert.equal(layout.width,(layout.arenas-1)*ARCADE.stage.advance+ARCADE.screen.width);
  }
  assert.equal(stageLayout(CAMPAIGN[0]).arenas,3);assert.equal(stageLayout(CAMPAIGN[5]).arenas,6);
  assert.equal(stageLayout({total:15,advance:500,wavesPerArena:3}).width,500+960,'levels can override spacing');
});

test('floor span at scroll 0 is the original single-screen floor; mock scenes read scroll 0',()=>{
  assert.deepEqual(floorSpan(0),{left:65,right:895});
  assert.deepEqual(floorSpan(720),{left:785,right:1615});
  assert.equal(viewLeft({cameras:{main:{shake(){}}}}),0);assert.equal(viewLeft({cameras:{main:{scrollX:300}}}),300);
});

test('camera follows forward, never scrolls back and never passes the unlocked limit',()=>{
  const layout=stageLayout(CAMPAIGN[0]),limit=arenaScroll(layout,1)+960;
  assert.equal(nextScroll({scrollX:0,playerX:300,limit}),0,'player left of the lead point does not scroll');
  assert.equal(nextScroll({scrollX:0,playerX:700,limit}),700-Math.round(960*ARCADE.stage.lead));
  assert.equal(nextScroll({scrollX:200,playerX:100,limit}),200,'walking back never scrolls back');
  assert.equal(nextScroll({scrollX:0,playerX:5000,limit}),720,'locked at the arena edge');
  assert.equal(nextScroll({scrollX:0,playerX:5000,limit:960}),0,'a locked first arena never scrolls');
  assert.equal(arenaScroll(layout,99),arenaScroll(layout,layout.arenas-1));
});

function arenaScene(){
  const s={level:{total:15,enemies:['walker'],gap:1000},enemies:[],combatTime:0,defeated:0,paused:false,finished:false,health:100,
    spawnEnemy(){const e={hp:1};s.enemies.push(e);return e;},updateCounter(){},
    stage:{wavesPerArena:2,scrollX:0,layout:{arenas:3},reached(i){return this.scrollX>=i*720;}}};
  s.waves=new WaveDirector(s);
  s.kill=()=>{for(const e of s.enemies)if(e.hp>0){e.hp=0;s.defeated++;}};
  return s;
}

test('arenas lock the next wave until the camera arrives, then use half the gap',()=>{
  const s=arenaScene(),w=s.waves;
  w.update();assert.equal(w.spawned,2,'first wave is immediate');
  s.kill();w.update();s.combatTime+=1000;w.update();assert.equal(w.spawned,5,'second wave of the same arena');
  s.kill();w.update();s.combatTime+=5000;w.update();
  assert.equal(w.spawned,5,'third wave waits for the player to walk');assert.equal(w.arena,1);assert.equal(w.awaitingAdvance,true);
  s.stage.scrollX=720;w.update();assert.equal(w.awaitingAdvance,false);assert.equal(w.spawned,5);
  s.combatTime+=499;w.update();assert.equal(w.spawned,5);
  s.combatTime+=1;w.update();assert.equal(w.spawned,7,'arriving uses half the gap');
});

test('enemies alive keep the arena locked and the boss checkpoint skips to the last arena',()=>{
  const s=arenaScene(),w=s.waves;w.update();s.kill();w.update();s.combatTime+=1000;w.update();
  assert.equal(w.spawned,4+1);s.enemies[2].hp=0;s.enemies[3].hp=0;w.update();s.combatTime+=5000;w.update();
  assert.equal(w.arena,0);assert.equal(w.awaitingAdvance,false);
  w.skipToEnd();assert.equal(w.spawned,15);assert.equal(w.arena,2);
});

test('without a stage the original single-screen waves are unchanged',()=>{
  const s=arenaScene();delete s.stage;const w=s.waves;
  w.update();s.kill();w.update();s.combatTime+=1000;w.update();s.kill();w.update();s.combatTime+=1000;w.update();
  assert.equal(w.spawned,7);assert.equal(w.awaitingAdvance,false);
});

import {AmbientTraffic} from '../src/stage/AmbientTraffic.js';
function trafficScene(){
  const sprite={x:0,width:700,visible:false,flip:false,depth:0,
    setOrigin(){return this;},setScrollFactor(){return this;},setDepth(d){this.depth=d;return this;},
    setVisible(v){this.visible=v;return this;},setFlipX(f){this.flip=f;return this;},destroy(){}};
  return {sprite,scene:{add:{image:()=>sprite}}};
}
test('the background bus waits, crosses the screen once in layer space and schedules the next pass',()=>{
  const {sprite,scene}=trafficScene(),background={layers:[{file:'buildings',sprite:{depth:-98}}]};
  const rolls=[.9,0];const bus=new AmbientTraffic(scene,{key:'bus',after:'buildings',factor:.5,bottom:379,speed:600,every:[3000,5000],first:1000},background,()=>rolls.shift()??0);
  assert.equal(sprite.depth,-97.5,'drawn just in front of its layer');
  for(let i=0;i<59;i++)bus.update(0);assert.equal(sprite.visible,false);
  bus.update(0);assert.equal(sprite.visible,true);assert.equal(bus.direction,-1);assert.equal(sprite.flip,true,'faces the way it drives');
  const start=sprite.x;bus.update(200);assert.equal(sprite.x,start-10-100,'camera scroll moves it at half speed');
  let frames=0;while(sprite.visible && frames++<600)bus.update(200);
  assert.ok(frames<600);assert.equal(bus.wait,3000,'next pass uses the configured interval');
});

test('the relabelled bus ignores padding, retains its road size and never mirrors its lettering',()=>{
  const {scene,sprite}=trafficScene(),config={key:'level1-bus',...CAMPAIGN[0].art.traffic},frames=new Map();let imageArgs;
  scene.textures={get:()=>({has:name=>frames.has(name),add:(name,...rect)=>frames.set(name,rect)})};
  scene.add.image=(...args)=>{imageArgs=args;return sprite;};
  sprite.setDisplaySize=(width,height)=>{sprite.displayWidth=width;sprite.displayHeight=height;return sprite;};
  const bus=new AmbientTraffic(scene,config,null,()=>0);
  assert.deepEqual(frames.get('traffic-body'),[0,0,151,2170,427]);
  assert.deepEqual(imageArgs,[0,379,'level1-bus','traffic-body']);
  assert.equal(sprite.displayWidth,717);assert.equal(sprite.displayHeight,140);assert.equal(bus.halfWidth,358.5);
  bus.update(0,config.first);assert.equal(bus.direction,1);assert.equal(sprite.flip,false);
  const previous=bus.x;bus.update(0,100);assert.equal(bus.x-previous,26,'same road speed after resizing');
  const png=readFileSync(new URL('../src/scenes/level1/game/bus.png',import.meta.url));
  const [x,y,w,h]=config.frameRect;assert.ok(x+w<=png.readUInt32BE(16)&&y+h<=png.readUInt32BE(20));
});

import {stepScroll} from '../src/stage/scroll.js';
test('unlocking an arena with the player at the right edge scrolls smoothly, never jumps',()=>{
  const layout=stageLayout(CAMPAIGN[0]);let scroll=0;const playerX=890,deltas=[];
  const locked=nextScroll({scrollX:scroll,playerX,limit:arenaScroll(layout,0)+960});assert.equal(locked,0);
  const target=nextScroll({scrollX:scroll,playerX,limit:arenaScroll(layout,1)+960});assert.ok(target>300,'old code jumped this far in one frame');
  for(let i=0;i<120 && scroll<target;i++){const next=stepScroll(scroll,target);deltas.push(next-scroll);scroll=next;}
  assert.equal(scroll,target);assert.ok(Math.max(...deltas)<=ARCADE.stage.maxScrollStep);assert.ok(deltas.every(d=>d>=1));
  assert.ok(deltas.length*1000/60<1200,'catches up in about a second');
  assert.equal(stepScroll(100,103),101,'small gaps close 1 px per frame');assert.equal(stepScroll(stepScroll(101,103),103),103);assert.equal(stepScroll(100,100),100);
});
