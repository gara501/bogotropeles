import Phaser from 'phaser';
import {fitArcadeCamera} from '../data/arcade.js';
import {characterIntros} from '../data/characterIntros.js';
import {COMIC,COMIC_PANELS,CARD_CHARACTERS,CARD_FOCUS_X,captionMs,panelMs,framing} from '../data/comicIntro.js';

// Panels are optional files in src/scenes/comic/; the five cards reuse src/data/players/player_N_intro.png.
const ART=import.meta.env?import.meta.glob('./comic/*.png',{eager:true,query:'?url',import:'default'}):{};
const CARDS=import.meta.env?import.meta.glob('../data/players/player_*_intro.png',{eager:true,query:'?url',import:'default'}):{};
const cardUrl=n=>CARDS[`../data/players/player_${n}_intro.png`];
const W=960,H=540;
const TITLE="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",MONO="'IBM Plex Mono', monospace";

/** Motion comic before the character selection: slow pans, comic cuts and typed captions. Any key or tap skips it. */
export class ComicIntroScene extends Phaser.Scene {
  constructor(){super('Comic');}
  init(data={}){this.nextData={...data};this.done=false;this.index=-1;this.layer=null;}
  preload(){
    for(const panel of COMIC_PANELS){const url=ART[`./comic/${panel.file}`];if(panel.file && url && !this.textures.exists(`comic-${panel.id}`))this.load.image(`comic-${panel.id}`,url);}
    CARD_CHARACTERS.forEach((_,i)=>{const url=cardUrl(i+1);if(url && !this.textures.exists(`comic-card-${i}`))this.load.image(`comic-card-${i}`,url);});
    if(this.sound && !this.cache.audio.exists('comic-music'))this.load.audio('comic-music',`${import.meta.env?.BASE_URL??'./'}assets/${COMIC.music}`);
  }
  create(){
    fitArcadeCamera(this);this.cameras.main.setBackgroundColor('#05080a');
    if(this.cache.audio.exists('comic-music')){this.music=this.sound.add('comic-music',{loop:true,volume:COMIC.volume});this.music.play();}
    this.skipHint=this.add.text(W-16,H-14,this.game.touchControls?.mobile?.()?'TOCA PARA SALTAR':'ENTER · SALTAR',{fontFamily:MONO,fontSize:'11px',color:'#8c97a6'}).setOrigin(1,1).setDepth(50);
    this.input.keyboard?.on('keydown',this.skip,this);this.input.on('pointerdown',this.skip,this);
    this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown',this.skip,this);this.input.off('pointerdown',this.skip,this);this.music?.stop();this.music?.destroy();this.music=null;for(const m of [...(this.cardMasks??[]).map(e=>e.shape),...(this.stripMasks??[])])m.destroy();this.cardMasks=null;this.stripMasks=null;});
    this.next();
  }
  next(){
    if(this.done)return;
    this.index++;const panel=COMIC_PANELS[this.index];
    if(!panel){this.finish(true);return;}
    const previous=this.layer,oldMasks=[...(this.cardMasks??[]).map(m=>m.shape),...(this.stripMasks??[])];
    this.cardMasks=null;this.stripMasks=[];this.finaleReveal=null;
    this.layer=this.add.container(0,0).setDepth(this.index+1).setAlpha(0);
    this.tweens.add({targets:this.layer,alpha:1,duration:COMIC.fadeMs,onComplete:()=>{previous?.destroy();for(const m of oldMasks)m.destroy();}});
    if(panel.layout==='cards')this.cards(panel);
    else if(panel.layout==='strips')this.strips(panel);
    else this.illustration(panel,this.layer);
    this.captions(panel);
    this.time.delayedCall(panelMs(panel),()=>this.next());
  }
  /** The panel art, or a tinted placeholder with its name, moving along its camera keys. */
  illustration(panel,container,mask=null){
    const key=`comic-${panel.id}`,ms=panelMs(panel);
    if(!this.textures.exists(key)){
      const g=this.add.graphics();g.fillStyle(panel.tint,1).fillRect(0,0,W,H);
      for(let i=0;i<14;i++)g.fillStyle(0x000000,.05*i/14).fillRect(0,H*i/14,W,H/14);
      const label=this.add.text(W/2,H/2,`VIÑETA ${this.index+1}\n${panel.title}`,{fontFamily:TITLE,fontSize:'54px',fontStyle:'bold',color:'#ffffff',align:'center'}).setOrigin(.5).setAlpha(.18);
      const note=this.add.text(W/2,H/2+70,`falta src/scenes/comic/${panel.file}`,{fontFamily:MONO,fontSize:'12px',color:'#ffffff'}).setOrigin(.5).setAlpha(.35);
      container.add([g,label,note]);if(mask)for(const o of [g,label,note])o.setMask(mask);
      this.tweens.add({targets:label,scale:1.08,duration:ms});
      return;
    }
    const image=this.add.image(0,0,key),from=framing(image.width,image.height,panel.camera.from),to=framing(image.width,image.height,panel.camera.to);
    image.setScale(from.scale).setPosition(from.x,from.y);container.add(image);if(mask)image.setMask(mask);
    if(panel.finale)this.finaleReveal={image,to};
    else this.tweens.add({targets:image,scale:to.scale,x:to.x,y:to.y,duration:ms+COMIC.fadeMs,ease:'Sine.easeInOut'});
  }
  /** Three diagonal comic cuts slide in one after another (same illustration, revealed strip by strip). */
  strips(panel){
    const [[a,b],[c,d]]=panel.stripCuts??[[360/W,300/W],[640/W,580/W]];
    const cuts=[[[0,0],[a*W,0],[b*W,H],[0,H]],[[a*W,0],[c*W,0],[d*W,H],[b*W,H]],[[c*W,0],[W,0],[W,H],[d*W,H]]];
    cuts.forEach((points,i)=>{
      const shape=this.make.graphics({add:false});shape.fillStyle(0xffffff).fillPoints(points.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
      const strip=this.add.container(0,i%2?-H:H);this.layer.add(strip);this.illustration(panel,strip,shape.createGeometryMask());
      this.tweens.add({targets:strip,y:0,duration:380,delay:i*520,ease:'Back.easeOut'});
      this.stripMasks.push(shape);
    });
    if(!panel.bakedGutters || !this.textures.exists(`comic-${panel.id}`)){
      const gutters=this.add.graphics();gutters.lineStyle(10,0x05080a,1).lineBetween(a*W,0,b*W,H).lineBetween(c*W,0,d*W,H);
      gutters.setAlpha(0);this.layer.add(gutters);this.tweens.add({targets:gutters,alpha:1,duration:200,delay:1100});
    }
  }
  /** The five fighters as tilted cards, each with its name. */
  cards(panel){
    const g=this.add.graphics();g.fillStyle(panel.tint,1).fillRect(0,0,W,H);this.layer.add(g);
    CARD_CHARACTERS.forEach((character,i)=>{
      const x=104+188*i,y=236,angle=i%2?3.5:-3.5,card=this.add.container(x,H+260).setAngle(angle);
      card.add(this.add.rectangle(0,0,172,300,0xfff1b8).setStrokeStyle(4,0x05080a));
      const key=`comic-card-${i}`;
      if(this.textures.exists(key)){
        const image=this.add.image(0,-14,key),scale=Math.max(160/image.width,250/image.height);
        image.setOrigin(CARD_FOCUS_X[character]??.5,.5).setScale(scale);
        const shape=this.make.graphics({add:false});card.add(image);this.cardMasks??=[];this.cardMasks.push({shape,card,image});
      }else card.add(this.add.rectangle(0,-14,160,250,0x33404a));
      card.add(this.add.text(0,128,characterIntros[character]?.name??character.toUpperCase(),{fontFamily:TITLE,fontSize:'20px',fontStyle:'bold',color:'#05080a'}).setOrigin(.5));
      this.layer.add(card);
      this.tweens.add({targets:card,y,duration:420,delay:250+i*330,ease:'Back.easeOut'});
    });
  }
  /** Comic caption boxes typed letter by letter; the finale's last line slams in large. */
  captions(panel){
    let at=0;
    panel.captions.forEach((line,i)=>{
      const finale=panel.finale && i===panel.captions.length-1;
      this.time.delayedCall(at,()=>{
        if(this.done)return;
        if(finale){
          this.lastCaption?.forEach(o=>o.destroy());this.lastCaption=null;
          if(this.finaleReveal){
            const {image,to}=this.finaleReveal;
            this.tweens.add({targets:image,scale:to.scale,x:to.x,y:to.y,duration:220,ease:'Cubic.easeOut'});
          }
          const text=this.add.text(W/2,H/2,line,{fontFamily:TITLE,fontSize:'84px',fontStyle:'bold',color:'#ffd36b',stroke:'#7b2409',strokeThickness:10}).setOrigin(.5).setScale(2.4).setAlpha(0);
          this.layer.add(text);this.tweens.add({targets:text,scale:1,alpha:1,duration:220,ease:'Back.easeOut'});
          this.cameras.main.flash(160,255,240,200);this.cameras.main.shake(260,.01);return;
        }
        // Card panel: one centred caption under the cards, each line replacing the last. Others stack top-left.
        const centred=panel.layout==='cards',y=centred?452:30+i*58;
        if(centred){this.lastCaption?.forEach(o=>o.destroy());}
        const box=this.add.rectangle(centred?W/2:28,y,10,44,0xfff1b8).setOrigin(centred?.5:0,0).setStrokeStyle(3,0x05080a);
        const text=this.add.text(centred?W/2:42,y+8,'',{fontFamily:TITLE,fontSize:'26px',fontStyle:'bold',color:'#14141a'}).setOrigin(centred?.5:0,0);
        this.layer.add([box,text]);this.lastCaption=[box,text];
        let n=0;const width=()=>box.setSize(Math.max(10,text.width+28),44);
        this.time.addEvent({repeat:line.length-1,delay:COMIC.typeMs,callback:()=>{n++;text.setText(line.slice(0,n));width();}});
      });
      at+=captionMs(line)+COMIC.captionGap;
    });
  }
  update(){
    // Card portraits are clipped to the card window (masks follow the tilted, sliding cards).
    for(const {shape,card} of this.cardMasks??[]){
      shape.clear().fillStyle(0xffffff);
      const rad=Phaser.Math.DegToRad(card.angle),c=Math.cos(rad),s=Math.sin(rad),pts=[[-80,-139],[80,-139],[80,111],[-80,111]]
        .map(([x,y])=>new Phaser.Geom.Point(card.x+x*c-y*s,card.y+x*s+y*c));
      shape.fillPoints(pts,true);
    }
    for(const entry of this.cardMasks??[])if(!entry.masked){entry.masked=true;entry.image.setMask(entry.shape.createGeometryMask());}
  }
  skip(event){
    if(this.done)return;event?.preventDefault?.();event?.stopImmediatePropagation?.();this.finish();
  }
  finish(showTitle=false){
    if(this.done)return;this.done=true;
    const fadeMs=showTitle?0:COMIC.fadeMs;
    if(this.music && fadeMs)this.tweens.add({targets:this.music,volume:0,duration:fadeMs});
    if(fadeMs)this.cameras.main.fadeOut(fadeMs,5,8,10);
    this.time.delayedCall(fadeMs,()=>{
      const data={...this.nextData,kind:'story',...(showTitle?{showTitle:true}:{})};
      queueMicrotask(()=>{this.game.scene.stop('Comic');this.game.events.emit('intro-complete',data);});
    });
  }
}
