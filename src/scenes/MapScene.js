import Phaser from 'phaser';
import {levels} from '../data/levels.js';
import {bossFor} from '../data/bosses.js';
import {fitArcadeCamera,fitArcadeText} from '../data/arcade.js';
import {WORLD_MAP,mapRoute,stopPoint,legView} from '../data/worldMap.js';
import office from '../data/players/player_1_profile.png?url';
import student from '../data/players/player_2_profile.png?url';
import teleperforman from '../data/players/player_3_profile.png?url';
import gymbro from '../data/players/player_4_profile.png?url';
import magolita from '../data/players/player_5_profile.png?url';

const FACES={office,student,teleperforman,gymbro,magolita};
// Final art is optional: until src/scenes/map/bogota_map.png (and map_markers.png, six badges in one row) exist,
// the scene draws a placeholder city so the flow can be played and tuned.
const ART=import.meta.env?import.meta.glob('./map/*.png',{eager:true,query:'?url',import:'default'}):{};
const MAP_URL=ART['./map/map.png']??ART['./map/bogota_map.png'],MARKERS_URL=ART['./map/map_markers.png'];
const MARKER_FRAME={locked:0,current:1,cleared:2,boss:3,bonus:4,pointer:5};
const FONT="'IBM Plex Mono', monospace",TITLE="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
const COLORS={cleared:0x6fd36b,current:0xffc53d,locked:0x5d6b7a,boss:0xe8424f,route:0xffd36b,routeDim:0x8c97a6};

/** Between levels: the fighter's token travels across Bogotá from the cleared stop to the next one. */
export class MapScene extends Phaser.Scene {
  constructor(){super('Map');}
  // Phaser reuses this scene instance for every trip: reset every flag of the previous one.
  init(data={}){this.nextData={...data};this.done=false;this.travelling=false;this.arrived=false;this.ready=false;this.travelTween=null;}
  preload(){
    if(MAP_URL && !this.textures.exists('map-art'))this.load.image('map-art',MAP_URL);
    if(MARKERS_URL && !this.textures.exists('map-markers'))this.load.image('map-markers',MARKERS_URL);
    const face=`map-face-${this.nextData.character}`;
    if(FACES[this.nextData.character] && !this.textures.exists(face))this.load.image(face,FACES[this.nextData.character]);
  }
  create(){
    fitArcadeCamera(this);this.cameras.main.setBackgroundColor('#0b1118');
    const current=Math.max(0,Math.min(levels.length-1,this.nextData.level??0));
    this.route=mapRoute(levels,current);this.current=current;
    this.from=current>0?this.route[current-1]:null;this.to=this.route[current];
    this.world=[];this.uiItems=[];
    const world=item=>{this.world.push(item);return item;},ui=item=>{this.uiItems.push(item);return item;};
    // Map illustration (or placeholder) in world space; the main camera pans and zooms over it.
    if(this.textures.exists('map-art')){
      // Smooth scaling: the illustration is shown far below its native size, where nearest-neighbour sampling distorts it.
      this.textures.get('map-art').setFilter(Phaser.Textures.FilterMode.LINEAR);
      const m=WORLD_MAP.map;
      world(this.add.rectangle(m.x+m.width/2,m.y+m.height/2,m.width+8,m.height+8,0x05080a).setStrokeStyle(2,0x3a4656));
      world(this.add.image(m.x+m.width/2,m.y+m.height/2,'map-art').setDisplaySize(m.width,m.height));
    }
    else world(this.drawPlaceholder());
    this.prepareMarkers();
    this.routeGraphics=world(this.add.graphics().setDepth(10));
    this.markerGraphics=world(this.add.graphics().setDepth(11));
    this.markerSprites=this.hasMarkerArt?this.route.map(()=>world(this.add.image(0,0,'map-markers',0).setDepth(11))):[];
    this.labels=this.route.map(stop=>world(this.add.text(0,0,stop.label,{fontFamily:FONT,fontSize:'11px',color:'#fff6c8',stroke:'#0b1118',strokeThickness:3})
      .setOrigin(.5,0).setDepth(12).setVisible(false)));
    const start=stopPoint(this.from??this.to),end=stopPoint(this.to);
    this.token={x:start.x,y:start.y,progress:this.from?0:1};
    this.end=end;this.start=start;
    const faceKey=`map-face-${this.nextData.character}`;
    this.tokenRing=world(this.add.circle(start.x,start.y,15,0x0b1118).setStrokeStyle(3,COLORS.current).setDepth(20));
    this.tokenFace=this.textures.exists(faceKey)?world(this.add.image(start.x,start.y,faceKey).setDepth(21)):null;
    if(this.tokenFace){const size=26/Math.max(this.tokenFace.width,this.tokenFace.height);this.tokenFace.baseScale=size;
      const mask=this.make.graphics({add:false});this.faceMask=mask;this.tokenFace.setMask(mask.createGeometryMask());}
    this.pulse={t:0};this.tweens.add({targets:this.pulse,t:1,duration:900,repeat:-1});
    // Screen-space interface on its own camera so the map zoom never scales it.
    this.uiCamera=this.cameras.add(0,0,WORLD_MAP.width,WORLD_MAP.height);
    // The final art brings its own logo and level list (right column): the caption band stays left of it.
    const art=this.textures.exists('map-art'),cx=art?345:480,bandWidth=art?690:960,tramo=`TRAMO ${String(current+1).padStart(2,'0')} / ${String(levels.length).padStart(2,'0')}`;
    if(!art){
      ui(this.add.rectangle(480,24,960,48,0x0b1118,.82));
      ui(this.add.text(24,12,'RUTA POR BOGOTÁ',{fontFamily:TITLE,fontSize:'24px',fontStyle:'bold',color:'#ffd36b',stroke:'#0b1118',strokeThickness:4}));
      ui(this.add.text(936,16,tramo,{fontFamily:FONT,fontSize:'15px',color:'#e8edce'}).setOrigin(1,0));
    }
    ui(this.add.rectangle(bandWidth/2,494,bandWidth,92,0x0b1118,.86));
    if(art)ui(this.add.text(14,454,tramo,{fontFamily:FONT,fontSize:'12px',color:'#8c97a6'}));
    const boss=bossFor(levels[current]);
    this.title=ui(this.add.text(cx,470,this.to.name.toUpperCase(),{fontFamily:TITLE,fontSize:'34px',fontStyle:'bold',color:'#fff6c8',stroke:'#0b1118',strokeThickness:5}).setOrigin(.5).setAlpha(0));
    this.subtitle=ui(this.add.text(cx,500,boss?`JEFE · ${boss.name}`:'',{fontFamily:FONT,fontSize:'13px',color:'#ff8a80',stroke:'#0b1118',strokeThickness:3}).setOrigin(.5).setAlpha(0));
    this.prompt=ui(this.add.text(cx,524,'',{fontFamily:FONT,fontSize:'12px',color:'#d6ed64'}).setOrigin(.5));
    if(!this.textures.exists('map-art'))ui(this.add.text(936,60,'MAPA PROVISIONAL',{fontFamily:FONT,fontSize:'10px',color:'#8c97a6'}).setOrigin(1,0));
    for(const object of this.uiItems)if(object.type==='Text')fitArcadeText(object);
    this.cameras.main.ignore(this.uiItems);this.uiCamera.ignore(this.world);
    // The illustration includes its title and legend: keep all of it above the caption band.
    const view=legView(this.from,this.to,this.textures.exists('map-art'));this.cameras.main.setZoom(view.zoom).centerOn(view.x,view.y);
    this.input.keyboard?.on('keydown',this.press,this);this.input.on('pointerdown',this.press,this);
    this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown',this.press,this);this.input.off('pointerdown',this.press,this);this.faceMask?.destroy();});
    if(this.from)this.time.delayedCall(350,()=>this.travel());else this.arrive();
  }
  /** Splits the badge sheet (six equal cells in one row) into frames once. */
  prepareMarkers(){
    this.hasMarkerArt=this.textures.exists('map-markers');if(!this.hasMarkerArt)return;
    const texture=this.textures.get('map-markers');if(texture.has(5))return;
    const source=texture.getSourceImage(),w=Math.floor(source.width/6);
    for(let i=0;i<6;i++)texture.add(i,0,i*w,0,w,source.height);
  }
  travel(){
    this.travelling=true;
    this.travelTween=this.tweens.add({targets:this.token,progress:1,duration:WORLD_MAP.travelMs,ease:'Sine.easeInOut',onComplete:()=>this.arrive()});
  }
  arrive(){
    if(this.arrived)return;this.arrived=true;this.travelling=false;this.token.progress=1;
    this.tweens.add({targets:[this.title,this.subtitle],alpha:1,duration:300});
    this.cameras.main.flash?.(120,255,211,107);
    const view=legView(this.from,this.to,this.textures.exists('map-art'));
    // Arriving downtown from outside: dive in on the stop.
    if(!this.textures.exists('map-art') && this.to.downtown && view.zoom===1){const p=stopPoint(this.to);this.cameras.main.zoomTo(WORLD_MAP.zoom,WORLD_MAP.arriveMs,'Sine.easeInOut');this.cameras.main.pan(p.x,p.y,WORLD_MAP.arriveMs,'Sine.easeInOut');}
    this.time.delayedCall(WORLD_MAP.promptMs,()=>{this.ready=true;this.prompt.setText(this.game.touchControls?.mobile?.()?'TOCA PARA CONTINUAR →':'PRESIONA UNA TECLA O CLIC PARA CONTINUAR →');});
  }
  press(event){
    if(this.done)return;
    if(this.travelling){this.travelTween?.complete();return;} // first press skips the trip
    if(!this.ready)return;
    this.done=true;event?.preventDefault?.();event?.stopImmediatePropagation?.();
    const data={...this.nextData,kind:'map'};
    queueMicrotask(()=>{this.game.scene.stop('Map');this.game.events.emit('intro-complete',data);});
  }
  update(){
    const zoom=this.cameras.main.zoom,k=1/zoom,pulse=this.pulse.t;
    const t=this.token,x=t.x=this.start.x+(this.end.x-this.start.x)*t.progress,y=t.y=this.start.y+(this.end.y-this.start.y)*t.progress;
    // Route: cleared legs solid gold, the leg being travelled grows behind the token, future legs dim dots.
    const g=this.routeGraphics.clear();
    for(let i=1;i<this.route.length;i++){
      const a=stopPoint(this.route[i-1]),b=stopPoint(this.route[i]),done=i<this.current,live=i===this.current;
      this.dotted(g,a,live?{x,y}:b,done||live?COLORS.route:COLORS.routeDim,(done||live?3:2)*k,done||live?1:.5,k);
      if(live)this.dotted(g,{x,y},b,COLORS.routeDim,2*k,.5,k);
    }
    const m=this.markerGraphics.clear();
    this.route.forEach((stop,i)=>{
      const p=stopPoint(stop),state=i===this.current?(this.arrived?'current':'locked'):i===this.current-1?'cleared':stop.state;
      const r=(state==='current'?9+2*Math.sin(pulse*Math.PI*2):7)*k;
      if(this.hasMarkerArt){
        const frame=state==='locked' && stop.boss?MARKER_FRAME.boss:MARKER_FRAME[state];
        const s=this.markerSprites[i].setPosition(p.x,p.y).setFrame(frame);s.setScale(r*2.6/s.width).setAlpha(state==='locked'?.8:1);
      }else{
        m.fillStyle(0x0b1118,1).fillCircle(p.x,p.y,r+2*k);
        m.fillStyle(state==='cleared'?COLORS.cleared:state==='current'?COLORS.current:COLORS.locked,1).fillCircle(p.x,p.y,r);
        if(stop.boss && state!=='cleared')m.lineStyle(2*k,COLORS.boss,1).strokeCircle(p.x,p.y,r+3.5*k);
        if(state==='cleared')m.lineStyle(2*k,0xffffff,1).lineBetween(p.x-3*k,p.y,p.x-1*k,p.y+2.5*k).lineBetween(p.x-1*k,p.y+2.5*k,p.x+3.5*k,p.y-3*k);
      }
      const label=this.labels[i],show=i===this.current || i===this.current-1;
      label.setVisible(show).setScale(k).setPosition(p.x,p.y+(r+5*k));
    });
    this.tokenRing.setPosition(x,y-18*k).setScale(k);
    if(this.tokenFace){
      this.tokenFace.setPosition(x,y-18*k).setScale(this.tokenFace.baseScale*k);
      this.faceMask.clear().fillStyle(0xffffff).fillCircle(x,y-18*k,13*k);
    }
  }
  dotted(g,a,b,color,width,alpha,k){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),step=9*k,dash=5*k;if(len<1)return;
    g.lineStyle(width,color,alpha);
    for(let d=0;d<len;d+=step){const e=Math.min(len,d+dash);g.lineBetween(a.x+dx*d/len,a.y+dy*d/len,a.x+dx*e/len,a.y+dy*e/len);}
  }
  /** Stand-in city until the illustration exists: mountains east, the 26 west to the airport, downtown glow. */
  drawPlaceholder(){
    const g=this.add.graphics(),poly=points=>points.map(([x,y])=>new Phaser.Geom.Point(x,y));
    g.fillStyle(0x16202c,1).fillRect(0,0,960,540);
    g.fillStyle(0x2c2832,1).fillPoints(poly([[50,130],[290,60],[560,45],[780,60],[835,210],[840,420],[790,525],[420,532],[110,490],[30,300]]),true);
    let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    for(let i=0;i<420;i++){const x=60+rnd()*760,y=70+rnd()*450;g.fillStyle(rnd()<.5?0x3a3440:0x4a3a36,.55).fillRect(x,y,4+rnd()*7,3+rnd()*5);}
    g.fillStyle(0x24452f,.9).fillCircle(470,300,22).fillCircle(610,150,16).fillCircle(300,380,18); // parks
    g.fillStyle(0x1f4a2c,1).fillPoints(poly([[845,0],[960,0],[960,540],[870,540],[825,470],[852,380],[828,300],[858,205],[832,110]]),true);
    g.fillStyle(0x2f6a3d,1).fillTriangle(800,330,826,262,860,330).fillTriangle(830,230,858,170,890,230);
    g.fillStyle(0xf4f1e6,1).fillRect(822,258,8,6); // Monserrate sanctuary
    g.lineStyle(4,0x6b5a48,1);
    for(const [a,b] of [[[700,330],[120,236]],[[690,385],[640,55]],[[300,60],[250,520]],[[640,120],[610,0]],[[700,360],[420,520]]])g.lineBetween(a[0],a[1],b[0],b[1]);
    g.lineStyle(2,0xc8432e,.7);for(const [a,b] of [[[700,332],[380,276]],[[690,370],[650,120]]])g.lineBetween(a[0],a[1],b[0],b[1]); // trancón
    g.fillStyle(0x55565a,1).fillRect(70,232,130,14);g.fillStyle(0xe8edce,1).fillRect(80,238,110,2); // runway
    g.fillStyle(0xffb347,.12).fillCircle(700,355,70);g.fillStyle(0xff6fae,.12).fillCircle(650,108,45); // downtown and Zona Rosa glow
    return g;
  }
}
