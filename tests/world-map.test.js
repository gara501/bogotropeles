import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAMPAIGN} from '../src/data/campaign.js';
import {MAP_STOPS,WORLD_MAP,mapRoute,mapStop,legView,stopPoint} from '../src/data/worldMap.js';

test('every playable level has its own stop on the map, inside the illustration',()=>{
  const seen=new Set();
  for(const level of CAMPAIGN){
    assert.ok(MAP_STOPS[level.name],`missing stop for ${level.name}`);
    const s=mapStop(level),key=`${s.x},${s.y}`;
    assert.ok(s.x>0 && s.x<1 && s.y>0 && s.y<1,level.name);assert.ok(!seen.has(key),`${level.name} overlaps another stop`);seen.add(key);
  }
});
test('the route marks levels before the current one as cleared and the rest as locked',()=>{
  const route=mapRoute(CAMPAIGN,3);
  assert.deepEqual(route.slice(0,5).map(s=>s.state),['cleared','cleared','cleared','current','locked']);
  assert.equal(route[3].boss,Boolean(CAMPAIGN[3].boss));
});
test('a leg inside downtown zooms in; a leg across the city shows it all',()=>{
  const [ext,station]=CAMPAIGN.map(mapStop);
  assert.equal(legView(ext,station).zoom,WORLD_MAP.zoom);
  assert.equal(legView(mapStop(CAMPAIGN[6]),mapStop(CAMPAIGN[7])).zoom,1,'downtown → Ciclovía');
  const p=stopPoint(ext);assert.ok(p.x>0 && p.x<WORLD_MAP.width && p.y>0 && p.y<WORLD_MAP.height);
});
test('an unknown level still gets a fallback stop',()=>{
  const s=mapStop({name:'Usaquén'},2,4);assert.ok(s.x>0 && s.x<1);assert.equal(s.label,'USAQUÉN');
});

test('the illustrated overview stays complete above the caption band for every leg',()=>{
  const m=WORLD_MAP.map,padding=4;
  for(let i=0;i<CAMPAIGN.length;i++){
    const view=legView(i?mapStop(CAMPAIGN[i-1]):null,mapStop(CAMPAIGN[i]),true);
    assert.equal(view.zoom,1);
    const left=(m.x-padding-view.x)*view.zoom+WORLD_MAP.width/2;
    const top=(m.y-padding-view.y)*view.zoom+WORLD_MAP.height/2;
    assert.ok(left>=0 && top>=0);
    assert.ok(left+(m.width+padding*2)*view.zoom<=WORLD_MAP.width);
    assert.ok(top+(m.height+padding*2)*view.zoom<448,'art and border clear the caption band');
  }
});
test('every level card goes through the map first',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/if\(data\.kind==='level' && !data\.fromMap\)return startMap\(data\);/);
  assert.match(main,/data\.kind==='map'\) \{\n\s+startIntro\(\{\.\.\.data,kind:'level',fromMap:true\}\);/);
});

test('motion comic: panels, timings and framing that never shows an image edge',async()=>{
  const {COMIC_PANELS,panelMs,comicMs,framing}=await import('../src/data/comicIntro.js');
  assert.equal(COMIC_PANELS.length,6);assert.ok(COMIC_PANELS.at(-1).finale);
  for(const p of COMIC_PANELS){assert.ok(p.captions.length);assert.ok(panelMs(p)>2000);if(p.layout!=='cards')assert.ok(p.file && p.camera);}
  assert.ok(comicMs()<60000,'under a minute');
  for(const key of [{zoom:1,x:0,y:0},{zoom:1.4,x:1,y:1},{zoom:1.2,x:.5,y:.5}]){
    const f=framing(1672,941,key),w=1672*f.scale,h=941*f.scale;
    assert.ok(f.x-w/2<=0 && f.x+w/2>=960 && f.y-h/2<=0 && f.y+h/2>=540,JSON.stringify(key));
  }
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/data\.kind==='game'\) \{\n\s+if\(data\.afterComic\)openMainMenu\(\);\n\s+else startComic\(\);/);
  assert.match(main,/data\.kind==='story' && data\.showTitle\) \{\n\s+startIntro\(\{kind:'game',afterComic:true,hardCut:true\}\);/);
});

test('the map scene resets the previous trip when it is reused (second trip used to hang)',()=>{
  const source=readFileSync(new URL('../src/scenes/MapScene.js',import.meta.url),'utf8');
  const init=source.slice(source.indexOf('  init('),source.indexOf('\n',source.indexOf('  init(')));
  for(const flag of ['this.done=false','this.travelling=false','this.arrived=false','this.ready=false'])assert.ok(init.includes(flag),flag);
});
