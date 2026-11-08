import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {COMBAT_CAMPAIGN as CAMPAIGN} from '../src/data/campaign.js';
import {stageLayout} from '../src/stage/scroll.js';

const hooks=registerHooks({load(url,context,next){
  if(url.endsWith('.png?url'))return {format:'module',source:`export default ${JSON.stringify(url)};`,shortCircuit:true};
  return next(url,context);
}});
const {PROPS,POLITICO_NPCS,CHORRO_NPCS,PLAZA_NPCS,propLayout,preloadProps}=await import('../src/data/props.js');
const {StageProps}=await import('../src/stage/StageProps.js');hooks.deregister();

class Visual {
  constructor(x,y,width,height){Object.assign(this,{x,y,width,height,displayWidth:width,displayHeight:height,visible:true,alpha:1});}
  setOrigin(){return this;}
  setFlipX(value){this.flip=value;return this;}
  setScrollFactor(value){this.factor=value;return this;}
  setScale(value){this.displayWidth=this.width*value;this.displayHeight=this.height*value;return this;}
  setDepth(value){this.depth=value;return this;}
  setTint(){return this;}
  setAlpha(value){this.alpha=value;return this;}
  setVisible(value){this.visible=value;return this;}
  destroy(){this.destroyed=true;}
}
function setup(config=CAMPAIGN[6].props,level=CAMPAIGN[6]){
  const s={levelIndex:level.combatIndex,floor:{top:level.top,bottom:500},textures:{exists:()=>true},cameras:{main:{scrollX:0}},add:{
    image:(x,y,key)=>{const def=Object.values(PROPS).find(p=>p.texture===key);const v=new Visual(x,y,def.rect[2],def.rect[3]);v.key=key;return v;},
    ellipse:(x,y,w,h)=>new Visual(x,y,w,h)}};
  const stage=new StageProps(s,config,stageLayout(level).width);return {s,stage};
}

test('Politicos atlas loads and all eight tight cutouts fit the source image',()=>{
  const loaded=[];preloadProps({textures:{exists:()=>false},load:{image:(key,url)=>loaded.push({key,url})}});
  assert.ok(loaded.some(p=>p.key==='prop-politicos-source' && p.url.endsWith('/npc_politicos.png?url')));
  const png=readFileSync(new URL('../src/data/NPC/npc_politicos.png',import.meta.url)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.equal(POLITICO_NPCS.length,8);
  assert.deepEqual(CAMPAIGN[6].props.kinds,POLITICO_NPCS);
  for(const key of POLITICO_NPCS){const def=PROPS[key],[x,y,width,height]=def.rect;
    assert.ok(x>=0 && y>=0 && x+width<=w && y+height<=h,key);assert.equal(def.cleanFringes,true);}
});

test('Zona Rosa distributes all eight people along the facade, away from tile corners and world edges',()=>{
  const level=CAMPAIGN[6],c=level.props,width=stageLayout(level).width*c.scrollFactor+960*(1-c.scrollFactor);
  const poses=propLayout(c,width,7);assert.equal(poses.length,12);assert.equal(new Set(poses.map(p=>p.kind)).size,8);
  for(const p of poses){const def=PROPS[p.kind],half=def.rect[2]*def.scale/2,local=p.x%c.slots.period;
    assert.ok(p.x-half>32 && p.x+half<width-32);
    assert.ok(local-half>140 && local+half<820,'clear of the corner planters and lamps');
  }
  const {stage}=setup();for(const item of stage.items){assert.equal(item.factor,.55);assert.ok(item.sprite.y>=408 && item.sprite.y<=414);assert.ok(item.sprite.depth<415);}
});

test('at every camera position visible Politicos stay fully inside a 32 px screen margin and shadows fade with them',()=>{
  const {s,stage}=setup(),seen=new Set();let fading=false;
  for(let scroll=0;scroll<=3600;scroll+=3){s.cameras.main.scrollX=scroll;stage.update();
    for(const item of stage.items){const v=item.sprite;
      assert.equal(item.shadow.visible,v.visible);assert.equal(item.shadow.alpha,v.alpha);
      if(!v.visible)continue;
      const x=v.x-scroll*item.factor;
      assert.ok(x-v.displayWidth/2>32);assert.ok(x+v.displayWidth/2<928);
      assert.ok(v.y-v.displayHeight>0 && v.y<540);assert.ok(v.alpha>0 && v.alpha<=1);
      seen.add(v.key);if(v.alpha<1)fading=true;
    }
  }
  assert.equal(seen.size,8);assert.ok(fading,'uses a soft fade at the view edges');
  const sprites=stage.items.flatMap(item=>[item.sprite,item.shadow]);stage.destroy();assert.ok(sprites.every(v=>v.destroyed));
});

test('edge fading remains opt in for existing street props',()=>{
  const {stage}=setup({kinds:['station0'],start:1,spacing:2000});stage.update();
  assert.equal(stage.items[0].sprite.visible,true);assert.equal(stage.items[0].sprite.alpha,1);
});

test('Chorro uses the eight photo NPCs on the paving, with no carts or background traffic',()=>{
  const level=CAMPAIGN[4],config=level.props,width=stageLayout(level).width;
  assert.deepEqual(config.kinds,CHORRO_NPCS);assert.equal(CHORRO_NPCS.length,8);
  assert.equal(level.art.traffic,undefined);
  const png=readFileSync(new URL('../src/data/NPC/npc_chorro_foto.png',import.meta.url));
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  const poses=propLayout(config,width,5);assert.equal(new Set(poses.map(p=>p.kind)).size,8);
  for(const p of poses){
    const def=PROPS[p.kind],[x,y,rw,rh]=def.rect,half=rw*def.scale/2,local=p.x%1920;
    assert.ok(x>=0 && y>=0 && x+rw<=w && y+rh<=h);
    assert.ok(local+half<1175 || local-half>1425,'feet clear the fountain rim');
    assert.ok(p.x-half>32 && p.x+half<width-32,'no clipping at the ends of the plaza');
    assert.ok(level.top+config.baseline+p.offset>376,'feet below the curb');
  }
  const {s,stage}=setup(config,level);
  for(const {sprite} of stage.items){assert.ok(sprite.y>376 && sprite.y<=391);assert.ok(sprite.depth<level.top);}
  for(let scroll=0;scroll<=width-960;scroll+=3){
    s.cameras.main.scrollX=scroll;stage.update(0);
    for(const {sprite:v} of stage.items)if(v.visible){
      assert.ok(v.x-scroll-v.displayWidth/2>32);
      assert.ok(v.x-scroll+v.displayWidth/2<928);
    }
  }
});

test('Plaza de Bolivar assigns only the new photo crowd, grounded and clear of each other and view edges',()=>{
  const level=CAMPAIGN[1],config=level.props,width=stageLayout(level).width;
  assert.deepEqual(config.kinds,PLAZA_NPCS);assert.equal(PLAZA_NPCS.length,8);
  const loaded=[];preloadProps({textures:{exists:()=>false},load:{image:(key,url)=>loaded.push({key,url})}});
  assert.ok(loaded.some(p=>p.key==='prop-plaza-source' && p.url.endsWith('/npc_plaza_fotos.png?url')));
  const png=readFileSync(new URL('../src/data/NPC/npc_plaza_fotos.png',import.meta.url));
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  for(const key of PLAZA_NPCS){const [x,y,rw,rh]=PROPS[key].rect;
    assert.ok(x>0 && y>0 && x+rw<w && y+rh<h,key);
  }
  const {s,stage}=setup(config,level),seen=new Set();
  for(let i=0;i<stage.items.length;i++){
    const v=stage.items[i].sprite;
    assert.ok(v.y>=412 && v.y<=416,'feet and wheels on plaza paving, below the border');
    assert.ok(v.depth<410,'crowd stays behind combatants');
    assert.ok(v.x-v.displayWidth/2>32 && v.x+v.displayWidth/2<width-32);
    if(i){const previous=stage.items[i-1].sprite;
      assert.ok(previous.x+previous.displayWidth/2+32<v.x-v.displayWidth/2,'space between neighbouring NPCs');
    }
  }
  for(let scroll=0;scroll<=width-960;scroll+=3){s.cameras.main.scrollX=scroll;stage.update(0);
    for(const {sprite:v,shadow} of stage.items){
      assert.equal(shadow.visible,v.visible);assert.equal(shadow.alpha,v.alpha);
      if(!v.visible)continue;
      assert.ok(v.x-scroll-v.displayWidth/2>32 && v.x-scroll+v.displayWidth/2<928);
      seen.add(v.key);
    }
  }
  assert.equal(seen.size,8);
});
