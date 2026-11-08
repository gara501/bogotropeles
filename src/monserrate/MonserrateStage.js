import Phaser from 'phaser';
import {MonserrateRun,MONSERRATE,MONSERRATE_DASH,MONSERRATE_JUMP,projectHiker} from './MonserrateRun.js';
import {fitArcadeCamera,fitArcadeText,applyPixelFilter} from '../data/arcade.js';
import {characters} from '../data/characters.js';
import {levels} from '../data/levels.js';
import {LevelMusic} from '../audio/LevelMusic.js';
import {SoundEffects,PLAYER_HURT_SOUNDS} from '../audio/SoundEffects.js';
import {MONSERRATE_CARD} from '../game/Collectibles.js';
import {MONSERRATE_HUD,forestObjects,projectForest,mountainTransform} from './MonserrateScenery.js';
import {trailOffset,trailRow,trailSection,cliffObjects,RAILING,logSpan} from './MonserrateTrail.js';

/** Kerb blocks (34 px ≈ 1.3 m of trail each): outer edge on the left, inner lip facing the stairs on the right. */
function makeCurbTexture(){
  const c=document.createElement('canvas');c.width=24;c.height=68;const g=c.getContext('2d');
  const tops=['#a3a59a','#959889'],moss=['#71883c','#5f7a33','#8aa04a'];
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let b=0;b<2;b++){
    const y0=b*34;g.fillStyle=tops[b];g.fillRect(0,y0,24,34);
    for(let i=0;i<70;i++){g.fillStyle=rnd()<.5?'#b4b6aa':'#7f8276';g.fillRect(Math.floor(rnd()*18),y0+2+Math.floor(rnd()*25),1+Math.floor(rnd()*2),1);} // grain
    for(let i=0;i<14;i++){g.fillStyle=moss[i%3];g.fillRect(Math.floor(rnd()*rnd()*14),y0+2+Math.floor(rnd()*25),2,1+Math.floor(rnd()*2));} // moss on the outer edge
    g.fillStyle='#43483f';g.fillRect(0,y0+28,24,6);g.fillStyle='#b9bbb0';g.fillRect(0,y0,24,2); // joint, lit front edge
    g.fillStyle='#5b6057';g.fillRect(18,y0,6,28);g.fillStyle='#474c44';g.fillRect(22,y0,2,28); // inner lip in shadow
  }
  return c;
}
/** The front post of fence.png, cut out once (left) and mirrored (right). */
function makeRailPosts(source){
  const make=flip=>{
    const c=document.createElement('canvas');c.width=46;c.height=148;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    if(flip){g.translate(46,0);g.scale(-1,1);}
    g.drawImage(source,64,360,46,148,0,0,46,148);
    g.setTransform(1,0,0,1,0,0);g.clearRect(flip?0:44,0,2,30); // cut the rail stub at the cap
    c.anchor=flip?1-30/46:30/46;return c;
  };
  return [make(false),make(true)];
}

// Layers: backdrop + stairs + kerb (1) < roadside nature, sorted among itself (1–2) < railing (2) < walkers, vendors
// and the runner (depth = screen y ≥ 156). Nothing on the trail can be hidden by the railing or the scenery.
const TRAIL_TOP=158; // first row below the horizon line
export const SCENERY_DEPTH={road:1,railing:2};
const sceneryDepth=(y,bias=0)=>1+Math.min(.99,y/1000+bias);
// How far below the kerb line each cutout is planted, in screen px at full scale.
const SINK={tree:46,bush:10,cliff:18,boulder:6};

/** Uphill runner: world simulation stays independent of perspective and sprite frames. */
export class MonserrateStage{
  constructor(scene){this.scene=scene;this.run=new MonserrateRun();this.visuals=new Map();}
  create(){
    const s=this.scene;fitArcadeCamera(s);applyPixelFilter(s);
    s.arcade=null;s.enemies=[];s.boss=null;s.miniBoss=null;s.hud=null;
    // Layer 0: the landscape, never bent (only a slow uniform zoom toward the sanctuary), so trees keep their shape.
    // Layer 1 (road canvas): stairs and kerb, bent along the trail. Layer 2: railing. Then walkers and runner.
    this.backdrop=s.add.image(480,24,'monserrate-background').setOrigin(.5,24/540).setDepth(0);
    // Roadside cutouts (trees, bushes, rocks) removed: the painted backdrop carries the forest; only the stairs, kerb and railing stream past.
    this.forest=[];this.cliffs=[];
    this.vendors=this.run.vendors.map(vendor=>({state:vendor,sprite:s.add.image(0,0,'monserrate-vendors',vendor.variant).setOrigin(.5,240/256)}));
    if(s.textures.exists('monserrate-road'))s.textures.remove('monserrate-road');
    this.road=s.textures.createCanvas('monserrate-road',960,540);
    s.add.image(0,0,'monserrate-road').setOrigin(0).setDepth(1);
    if(s.textures.exists('monserrate-fence-layer'))s.textures.remove('monserrate-fence-layer');
    this.fence=s.textures.createCanvas('monserrate-fence-layer',960,540);
    this.curb=makeCurbTexture();this.posts=makeRailPosts(s.textures.get('monserrate-fence-source').getSourceImage());
    // Railing occludes the roadside plants and rocks, using the same warp as the road.
    s.add.image(0,0,'monserrate-fence-layer').setOrigin(0).setDepth(SCENERY_DEPTH.railing);
    this.stone=s.textures.get('monserrate-stone').getSourceImage();
    this.roughStone=s.textures.get('monserrate-rough-stone').getSourceImage();
    s.player={x:480,y:470,key:s.characterKey,config:s.character,
      sprite:s.add.sprite(480,470,`monserrate-${s.characterKey}`,0).setOrigin(.5,240/256),
      shadow:s.add.ellipse(480,468,56,10,0x15251f,.22)};
    const text=(x,y,value,size=14,color='#ecf1dc')=>fitArcadeText(s.add.text(x,y,value,{fontFamily:"'IBM Plex Mono', monospace",fontSize:`${size}px`,color,stroke:'#14261f',strokeThickness:3}).setDepth(1002));
    for(const panel of [MONSERRATE_HUD.left,MONSERRATE_HUD.right])s.add.rectangle(panel.x,panel.y,panel.width,panel.height,0x112820,.9).setOrigin(0).setDepth(1000);
    s.playerName=text(22,12,s.character.name,18,'#ffe14d');
    s.add.rectangle(22,43,204,16,0xe9efd8).setOrigin(0).setDepth(1001);
    s.healthBar=s.add.rectangle(24,45,200,12,0xffdf22).setOrigin(0).setDepth(1002);
    s.runStatus=text(22,66,'',10);s.updateRunStatus();
    s.counter=text(935,18,`NIVEL ${String(s.levelIndex+1).padStart(2,'0')} · MONSERRATE`,12,'#c8ec80').setOrigin(1,0);
    this.distance=text(704,44,'',12);this.speed=text(935,68,'',15,'#ffda84').setOrigin(1,0);
    s.add.rectangle(704,94,MONSERRATE_HUD.progressWidth,7,0x48634e).setOrigin(0).setDepth(1001);
    this.progress=s.add.rectangle(704,94,1,7,0xc8ec80).setOrigin(0).setDepth(1002);
    this.status=text(704,112,'',9,'#c8ec80');
    s.controlsLabel=text(480,520,s.game.touchControls?.mobile?.()?'JOYSTICK ← → · ESQUIVAR   |   ↑ SALTO   |   » DASH   |   Ⅱ PAUSA':'← → / A D · ESQUIVAR   |   ESPACIO SALTAR   |   SHIFT DASH   |   P PAUSA',11).setOrigin(.5);
    s.overlay=s.add.container(480,265,[s.add.rectangle(0,0,710,145,0x112820,.96),text(0,-22,'',24,'#c8ec80').setOrigin(.5),text(0,27,'',12).setOrigin(.5)]).setDepth(2000).setVisible(false);
    this.banner=text(480,163,'¡A SUBIR MONSERRATE!',22,'#ffe14d').setOrigin(.5);
    this.tip=text(480,192,'← → ESQUIVA · ESPACIO SALTA HUECOS Y TRONCOS · SHIFT DASH',11).setOrigin(.5);
    this.dashLabel=text(704,68,'',11,'#c8ec80');
    // keydown events: a quick tap shorter than one frame still triggers the dash
    this.dashQueued=false;this.jumpQueued=false;s.input.keyboard.on?.('keydown-SHIFT',()=>{this.dashQueued=true;});
    for(const key of ['SPACE','UP','W'])s.input.keyboard.on?.(`keydown-${key}`,()=>{this.jumpQueued=true;});
    // speed lines and the "¡SALTA!" warning sit above the trail, below the HUD
    this.streaks=s.add.graphics?.().setDepth(999);this.flash=0;
    this.warning=text(480,206,'¡SALTA!',26,'#ff7a3d').setOrigin(.5).setVisible(false);
    this.callout=text(480,290,'',20,'#ffe14d').setOrigin(.5).setVisible(false);this.calloutUntil=0;
    s.music=new LevelMusic(s,s.level.music.key);s.sfx=new SoundEffects(s.sound,s.cache.audio);
    s.keys=s.input.keyboard.addKeys('W,A,S,D,H,J,K,L,SHIFT,SPACE,P,R,ENTER,UP,DOWN,LEFT,RIGHT');
    this.setCharacter(s.characterKey);s.game.touchControls?.setMonserrate(true);
    s.game.events.emit('level-start',s.levelIndex);
    s.events.once('shutdown',()=>{
      s.music?.destroy();s.sfx?.destroy();s.music=null;s.sfx=null;s.game.touchControls?.setMonserrate(false);
      this.visuals.clear();s.monserrate=null;
    });this.render();
  }
  setCharacter(key){
    const s=this.scene;s.characterKey=key;s.character=characters[key];
    Object.assign(s.player,{key,config:s.character});
    s.player.sprite.setTexture(`monserrate-${key}`,0).setScale(152/208);
    s.playerName?.setText(s.character.name);s.input.keyboard.resetKeys();
  }
  respawn(){
    const s=this.scene;this.run.respawn();s.health=100;s.healthBar.width=200;s.deathHandled=false;s.respawnDelay=0;
    s.music?.setPaused(false);s.sfx?.setPaused(false);s.updateRunStatus();s.input.keyboard.resetKeys();
    s.game.events.emit('player-respawn');this.render();
  }
  setPaused(value,showOverlay=true){
    const s=this.scene;s.paused=value;s.music?.setPaused(value);s.sfx?.setPaused(value);
    if(value){s.tweens.pauseAll();if(showOverlay)s.showOverlay('PAUSA','P / ▶ PARA CONTINUAR');else s.overlay.setVisible(false);}
    else{s.tweens.resumeAll();s.overlay.setVisible(false);}
    s.game.events.emit('combat-paused',value);
  }
  finish(){
    const s=this.scene;if(s.finished || s.health<=0)return;
    s.finished=true;s.addScore(MONSERRATE.finishPoints);s.music?.stop();s.sfx?.play('wave');
    const card=this.run.flawless?MONSERRATE_CARD:null;
    if(card)s.addScore(card.points);
    s.victoryRemaining=1400;s.pendingResult={won:true,last:false,monserrate:true,collectible:card?.id??null,crashes:this.run.crashes,score:s.run.score,character:s.character.name};
    s.game.events.emit('level-clear',s.levelIndex);s.game.events.emit('level-victory');
    s.showOverlay('¡LLEGASTE A LA CIMA!',card?'CERO CHOQUES · TARJETA COLECCIONABLE +5000':`+${MONSERRATE.finishPoints} PUNTOS · SIGUE ${levels[s.levelIndex+1]?.name.toUpperCase()??'LA AVENTURA'}`);
  }
  update(delta){
    const s=this.scene,k=s.keys,touch=s.game.touchControls?.input;
    const pressed=key=>Phaser.Input.Keyboard.JustDown(k[key])||Boolean(touch?.justDown(key));
    if(pressed('P') && !s.finished && s.health>0)this.setPaused(!s.paused);
    if(pressed('R')){s.restartLevel();return;}
    if(s.paused || s.waitingContinue || s.gameOver){touch?.discardPresses();return;}
    const ms=Math.min(Math.max(0,delta),50);
    if(s.pendingResult){s.victoryRemaining=Math.max(0,s.victoryRemaining-ms);if(!s.victoryRemaining){const r=s.pendingResult;s.pendingResult=null;s.game.events.emit('level-result',r);}return;}
    if(s.finished){if(pressed('ENTER'))s.nextLevel();return;}
    if(s.health<=0){s.handleDeath();if(!s.waitingContinue && !s.gameOver){s.respawnDelay-=ms;if(s.respawnDelay<=0)this.respawn();}return;}
    const steer=Number(k.RIGHT.isDown||k.D.isDown)-Number(k.LEFT.isDown||k.A.isDown)||touch?.x||0;
    const dashPressed=pressed('SHIFT') || this.dashQueued;this.dashQueued=false;
    if(dashPressed && this.run.dash()){s.sfx?.play('whip');s.cameras.main.shake(120,.002);}
    const jumpPressed=pressed('SPACE') || pressed('UP') || pressed('W') || this.jumpQueued;this.jumpQueued=false;
    if(jumpPressed && this.run.jump())s.sfx?.play('whip');
    touch?.discardPresses();const events=this.run.step(ms,steer);s.combatTime=this.run.elapsed;
    for(const _ of events.hits){s.health=Math.max(0,s.health-MONSERRATE.damage);s.healthBar.width=s.health*2;s.cameras.main.shake(100,.003);s.sfx?.play(PLAYER_HURT_SOUNDS[s.characterKey]);}
    for(const _ of events.falls){
      s.health=Math.max(0,s.health-MONSERRATE.gapDamage);s.healthBar.width=s.health*2;s.cameras.main.shake(260,.007);
      s.cameras.main.flash?.(160,120,30,20);s.sfx?.play(PLAYER_HURT_SOUNDS[s.characterKey]);this.say('¡AL HUECO!','#ff7a3d');
    }
    for(const jump of events.jumped){s.addScore(MONSERRATE_JUMP.points);this.say(jump.kind==='gap'?'¡QUÉ SALTO!':'¡HOP!');}
    for(const passed of events.passed)s.addScore(passed.jumped?MONSERRATE_JUMP.points:passed.dashed?MONSERRATE_DASH.dodgePoints:25);
    this.render();if(this.run.done && s.health>0)this.finish();
  }
  say(value,color='#ffe14d'){this.callout?.setText(value).setColor(color);this.calloutUntil=this.run.elapsed+700;}
  /** Streaks from the vanishing point: more and longer the faster the run goes. */
  renderSpeed(){
    const g=this.streaks;if(!g)return;g.clear();
    const run=this.run,feel=Math.max(0,Math.min(1,(run.speed-MONSERRATE.startSpeed*.8)/(MONSERRATE.endSpeed*MONSERRATE_DASH.speed-MONSERRATE.startSpeed*.8)));
    const count=10+Math.round(feel*22),t=run.distance;
    for(let i=0;i<count;i++){
      // wind streaks fan out from the vanishing point over the forest on both sides, never across the trail ahead
      const side=i%2?1:-1,deg=(i*37)%55-22,angle=deg*Math.PI/180;
      const dx=side*Math.cos(angle),dy=Math.sin(angle);
      const phase=((t*1.4+i*13.7)%12)/12,r0=230+phase*560,len=50+feel*150+phase*60;
      const x0=480+dx*r0,y0=170+dy*r0;
      if(y0>520)continue;
      g.lineStyle(1.5+feel*2.5,run.dashing?0xffe14d:0xffffff,(.18+feel*.42)*(1-phase*.5));
      g.lineBetween(x0,y0,480+dx*(r0+len),170+dy*(r0+len));
    }
  }
  /** Broken stairs: a dark pit with a lit far lip. Logs: a trunk lying across its lanes. */
  renderJumps(ctx,distance){
    for(const jump of this.run.jumps){
      const z0=jump.at-distance,z1=z0+jump.length;
      if(z1<-3 || z0>110)continue;
      if(jump.kind==='gap'){
        const near=projectHiker(0,Math.max(-3,z0),distance),far=projectHiker(0,z1,distance);
        for(let y=Math.floor(far.y);y<near.y;y+=2){
          const {width,centre,z}=trailRow(y,distance);
          const depth=Math.max(0,Math.min(1,(z-z0)/jump.length));
          ctx.fillStyle=depth>.82?'#6d6a5c':depth>.7?'#2b2a24':'#0b0d0b';
          ctx.fillRect(centre-width/2,y,width,2);
        }
        // broken edges: jagged stones on the near lip and the far side's lit step
        for(const [edge,colour,up] of [[near,'#b8b29a',-1],[far,'#d6cfb4',1]]){
          if(edge===near && z0<=-3)continue;
          const row=trailRow(Math.max(TRAIL_TOP,Math.floor(edge.y)),distance),teeth=14,w=row.width/teeth;
          ctx.fillStyle=colour;ctx.fillRect(row.centre-row.width/2,Math.floor(edge.y)-1,row.width,Math.max(1,3*edge.scale));
          for(let k=0;k<teeth;k++){const h=((k*7+jump.at)%5+1)*2.2*edge.scale;ctx.fillRect(row.centre-row.width/2+k*w,Math.floor(edge.y)+(up>0?0:-h),w*.8,h);}
        }
        continue;
      }
      if(z0<-1.5)continue;
      const [left,right]=logSpan(jump),a=projectHiker(left,z0,distance),b=projectHiker(right,z0,distance);
      const h=Math.max(3,44*a.scale),y=a.y-h;
      ctx.fillStyle='#3b2412';ctx.fillRect(a.x,y,b.x-a.x,h);
      ctx.fillStyle='#7a4c26';ctx.fillRect(a.x,y,b.x-a.x,h*.55);
      ctx.fillStyle='#a8743f';ctx.fillRect(a.x,y,b.x-a.x,Math.max(1,h*.18));
      ctx.fillStyle='#d9b27a';for(const x of [a.x,b.x-h*.7]){ctx.fillRect(x,y+h*.1,h*.7,h*.8);}
      ctx.fillStyle='#8a5a32';for(const x of [a.x,b.x-h*.7]){ctx.fillRect(x+h*.22,y+h*.32,h*.26,h*.36);}
    }
  }
  renderRoad(){
    const ctx=this.road.context;ctx.clearRect(0,0,960,540);ctx.imageSmoothingEnabled=false;
    const fence=this.fence.context;fence.clearRect(0,0,960,540);fence.imageSmoothingEnabled=false;
    const distance=this.run.distance,mountain=mountainTransform(this.run.progress),zoom=mountain.scale;
    this.backdrop.setScale(zoom);
    // Only the trail bends: the stairs are drawn row by row from the horizon down, over a backdrop without stairs.
    for(let y=TRAIL_TOP;y<540;y+=2){
      const {z,width,centre}=trailRow(y,distance);
      const sourceY=((z+this.run.distance)*26%this.stone.height+this.stone.height)%this.stone.height;
      ctx.drawImage(this.stone,0,Math.floor(sourceY),this.stone.width,1,centre-width/2,y,width,2);
      const {rock}=trailSection(distance+Math.max(0,z));
      if(rock>0){
        ctx.globalAlpha=rock;
        ctx.drawImage(this.roughStone,0,Math.floor(sourceY)%this.roughStone.height,this.roughStone.width,1,centre-width/2,y,width,2);
        ctx.globalAlpha=1;
      }
    }
    this.renderJumps(ctx,distance);this.renderCurbs(ctx,distance);this.renderRailings(fence,distance);
    this.road.refresh();this.fence.refresh();
  }
  /** Stone kerbs beside the steps: sampled per row from the same world distance as the stairs, so they stream past together. */
  renderCurbs(ctx,distance){
    const {inner,outer}=RAILING,tex=this.curb,h=tex.height;
    for(let y=TRAIL_TOP;y<540;y+=2){
      const {z,width,centre}=trailRow(y,distance),edge=width/2,band=edge*(outer/inner-1);
      const v=Math.floor((((z+distance)*26)%h+h)%h);
      ctx.drawImage(tex,0,v,tex.width,1,centre-edge-band,y,band,2);
      ctx.drawImage(tex,0,v,tex.width,1,centre+edge+band,y,-band,2); // mirrored: the inner lip faces the stairs on both sides
    }
  }
  /** Posts and two rails, placed every few metres along the trail and bent with it. */
  renderRailings(ctx,distance){
    const {post,lane,far,height,top,mid,lip}=RAILING;
    for(const side of [-1,1]){
      const image=this.posts[side<0?0:1],point=z=>projectHiker(side*lane,z,distance);
      const firstPost=Math.ceil((distance-3)/post),lastPost=Math.floor((distance+far)/post);
      let prev=point(Math.min(far,(lastPost+1)*post-distance));
      const rail=(from,to)=>{
        for(const [h,w] of [[top,6],[mid,4.5]]){
          const fy=from.y-(lip+height*h)*from.scale,ty=to.y-(lip+height*h)*to.scale,width=Math.max(1,w*to.scale);
          ctx.strokeStyle='#211f27';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(from.x,fy);ctx.lineTo(to.x,ty);ctx.stroke();
          ctx.strokeStyle='#77748a';ctx.lineWidth=Math.max(1,width*.25);ctx.beginPath();ctx.moveTo(from.x,fy-width*.3);ctx.lineTo(to.x,ty-width*.3);ctx.stroke();
        }
      };
      for(let n=lastPost;n>=firstPost;){
        const z=n*post-distance,stride=z>160?4:z>60?2:1; // far away, fewer posts: they are only a few pixels apart
        // rails in short steps so they follow the curve between posts
        for(let step=1;step<=2;step++){const next=point(z+post*stride*(1-step/2));rail(prev,next);prev=next;}
        const p=point(z),h=height*p.scale,w=h*image.width/image.height;
        ctx.globalAlpha=Math.min(1,Math.max(0,(far-z)/12));
        ctx.drawImage(image,Math.round(p.x-w*image.anchor),Math.round(p.y-lip*p.scale-h),Math.round(w),Math.round(h));
        ctx.globalAlpha=1;n-=stride;
      }
      const end=point(-3);rail(prev,end);
    }
  }
  render(){
    const s=this.scene,t=this.run.elapsed,p=projectHiker(this.run.x,0,this.run.distance);this.renderRoad();
    for(const object of this.forest){
      const p=projectForest(object,this.run.distance);
      const {rock}=trailSection(this.run.distance+p.z);
      // trees grow from the slope below the ridge: sink the trunk so it never stands on air; bushes cover the join
      const tree=object.frame<3,sink=(tree?SINK.tree:SINK.bush)*p.scale;
      object.sprite.setPosition(p.x,p.y+sink).setScale(p.height/(tree?340:130)).setDepth(sceneryDepth(p.y,tree?0:.0004)).setAlpha(p.alpha*(1-rock*.78));
    }
    for(const object of this.cliffs){
      const p=projectForest(object,this.run.distance),{rock}=trailSection(this.run.distance+p.z);
      const sink=(object.frame<2?SINK.cliff:SINK.boulder)*p.scale;
      object.sprite.setVisible(rock>.01).setPosition(p.x,p.y+sink).setScale(p.height/(object.frame<2?340:180)).setDepth(sceneryDepth(p.y,.0002)).setAlpha(p.alpha*rock);
    }
    for(const {state:vendor,sprite} of this.vendors){
      const z=vendor.at-this.run.distance,p=projectHiker(vendor.lane,z,this.run.distance);
      sprite.setVisible(z>=-4 && z<=60).setPosition(p.x,p.y).setScale(152/208*p.scale).setDepth(p.y).setAlpha(Math.min(1,Math.max(0,(60-z)/8))*(vendor.hit?.65:1));
    }
    const lift=this.run.jumpHeight*MONSERRATE_JUMP.height;this.renderSpeed();
    const next=this.run.nextJump(),warn=next && next.eta<MONSERRATE_JUMP.warn && next.eta>-.1 && (next.kind==='gap' || next.lanes.length===3);
    this.warning?.setVisible(Boolean(warn) && Math.floor(t/140)%2===0).setText(next?.kind==='gap'?'¡HUECO! ¡SALTA!':'¡TRONCO! ¡SALTA!');
    this.callout?.setVisible(t<this.calloutUntil);
    this.banner.setVisible(t<2400 && !warn);this.tip.setVisible(t<4200 && !warn);this.progress.width=MONSERRATE_HUD.progressWidth*this.run.progress;
    s.player.x=p.x;s.player.sprite.setPosition(p.x,p.y-lift).setDepth(p.y).setFrame(Math.floor(t/(this.run.dashing?45:62))%8)
      .setAlpha(t<this.run.invulnerableUntil && Math.floor(t/90)%2?.4:1);
    s.player.shadow.setPosition(p.x,p.y-2).setDepth(p.y-1).setScale?.(1-this.run.jumpHeight*.45);
    this.distance.setText(`${Math.floor(this.run.distance)} / ${MONSERRATE.length} m · ASCENSO`);
    this.speed.setText(`${Math.round(this.run.speed*3.6)} km/h`).setColor(this.run.dashing?'#ffe14d':'#ffda84');
    this.dashLabel.setText(this.run.dashing?'» DASH ×2 PTS':this.run.dashReady?'» DASH LISTO':`» DASH ${'▮'.repeat(Math.round(this.run.dashCharge*5))}${'▯'.repeat(5-Math.round(this.run.dashCharge*5))}`)
      .setColor(this.run.dashing?'#ffe14d':this.run.dashReady?'#c8ec80':'#8fa58a');
    this.status.setText(`${trailSection(this.run.distance).label} · ESQUIVADOS ${this.run.dodged}`);
    const alive=new Set();
    for(const npc of this.run.npcs){
      alive.add(npc.id);let sprite=this.visuals.get(npc.id);
      const kneeling=npc.kind==='kneeler';
      if(!sprite){sprite=s.add.sprite(0,0,`monserrate-${kneeling?'kneeler':'hiker'}-${npc.variant}`,0).setOrigin(.5,240/256);this.visuals.set(npc.id,sprite);}
      const p=projectHiker(npc.lane,npc.z,this.run.distance);
      const drifting=npc.to!==undefined && npc.lane!==npc.to && npc.z<=npc.changeAt; // leans into the lane change
      sprite.setPosition(p.x,p.y).setScale(152/208*p.scale).setDepth(p.y).setFrame(Math.floor((t+npc.variant*127)/(kneeling?200:drifting?110:155))%(kneeling?8:4))
        .setAngle(drifting?Math.sign(npc.to-npc.lane)*7:0).setAlpha(npc.hit?.6:1);
    }
    for(const [id,sprite] of this.visuals)if(!alive.has(id)){sprite.destroy();this.visuals.delete(id);}
  }
}
