import {ARCADE} from '../data/arcade.js';
import {timeline} from '../data/attacks.js';
import {ARMED_RUN,armedRunTexture,ARMED_BODY_SCALE} from '../data/armedRun.js';

export const VUVUZELA={uses:10,extraRange:65,damageMultiplier:1.25,spawnChance:.55,
  throwSpeed:520,flightFrames:36,throwLane:24,throwWidth:40};

/** Dedicated weapon timing; impact occurs only while the armed impact drawing is visible. */
export function vuvuzelaAttack(data,character){
  const frames=timeline({startup:8,active:4,recovery:12,
    startupPose:data.frames[0].pose,activePose:data.frames.find(f=>f.phase==='active').pose,recoveryPose:data.frames.at(-1).pose})
    .map((frame,i)=>({...frame,weaponPose:i<6?5:i<8?6:i<12?7:i<20?8:0}));
  return {...data,weapon:'vuvuzela',combo:false,stage:0,finisher:false,
    damage:Math.round(character.attacks.punch.damage*VUVUZELA.damageMultiplier),
    range:Math.max(data.range,character.attacks.punch.range)+VUVUZELA.extraRange,
    knockback:ARCADE.attack.knockback,frames};
}

export const VUVUZELA_TEXTURE='item-vuvuzela';

/** Trim transparent padding once; the grip stays at the red mouthpiece in every pose. */
export function prepareVuvuzela(scene){
  const texture=scene.textures.get(VUVUZELA_TEXTURE);
  if(texture.has('trimmed'))return;
  const image=texture.getSourceImage(),canvas=document.createElement('canvas');
  canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,image.width,image.height).data;
  let left=image.width,top=image.height,right=0,bottom=0;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>32){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right>=left)texture.add('trimmed',0,left,top,right-left+1,bottom-top+1);
}

export class Vuvuzela {
  constructor(scene,random=Math.random){
    this.scene=scene;this.random=random;this.remaining=0;this.items=[];this.rolled=new Set();this.bursts=[];this.shots=[];
    this.held=scene.add.image(0,0,scene.characterKey,scene.character.idle).setOrigin(.5,1).setVisible(false);
    const frame=scene.textures?.get(VUVUZELA_TEXTURE).get('trimmed');
    this.artRatio=frame?frame.height/frame.width:.285;
    this.trail=scene.add.graphics();this.fx=scene.add.graphics();
    this.label=scene.add.text(372,69,'',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'11px',color:'#ffe14d',stroke:'#14282c',strokeThickness:2})
      .setDepth(1003).setScrollFactor(0).setVisible(false);
  }
  spawn(x,y){
    const item={x,y,graphic:this.scene.add.graphics(),sprite:this.scene.add.image(x,y-12,VUVUZELA_TEXTURE,'trimmed')
      .setDisplaySize(48,48*this.artRatio).setRotation(-.2).setDepth(y+1)};
    this.items.push(item);return item;
  }
  equip(remaining=VUVUZELA.uses){this.remaining=remaining;this.scene.sfx?.play('item');}
  /** J sends the horn forward; impact or landing shatters it permanently. */
  throwForward(){
    const s=this.scene,p=s.player;if(!this.remaining || this.pendingBreak)return false;
    const x=p.x+s.facing*24,lift=s.character.height*.55;
    this.shots.push({x,y:p.y,lift,startLift:lift,facing:s.facing,age:0,
      damage:Math.round(s.character.attacks.punch.damage*VUVUZELA.damageMultiplier),
      sprite:s.add.image(x,p.y-lift,VUVUZELA_TEXTURE,'trimmed').setDisplaySize(48,48*this.artRatio).setFlipX(s.facing<0).setDepth(p.y+1)});
    this.clearHeld();s.sfx?.play('wave');return true;
  }
  shatter(shot,frame){
    shot.sprite.destroy();
    const s=this.scene,x=Math.max(s.floor.left??-Infinity,Math.min(s.floor.right??Infinity,shot.x));
    this.bursts.push({x,y:shot.y-shot.lift,born:frame});
    s.sfx?.play('metalCrack');
  }
  clearFlights(){for(const shot of this.shots)shot.sprite.destroy();this.shots=[];}
  attack(data){return this.remaining>0 && data.type==='punch'?vuvuzelaAttack(data,this.scene.character):data;}
  commit(action){
    if(action.data.weapon!=='vuvuzela' || action.weaponUsed)return;
    action.weaponUsed=true;this.remaining=Math.max(0,this.remaining-1);
    if(!this.remaining)this.pendingBreak=true;
  }
  break(){
    const s=this.scene,p=s.player;
    this.bursts.push({x:p.x+s.facing*70,y:p.y-(p.z??0)-s.character.height*.55,born:s.arcade.frame});
    s.sfx?.play('metalCrack');this.clearHeld();
  }
  clearHeld(){this.remaining=0;this.pendingBreak=false;this.held.setVisible(false);this.scene.player.sprite.setVisible(true);this.trail.clear();this.label.setVisible(false);}
  update(frame){
    const s=this.scene,p=s.player,model=s.arcade.player,action=model.action;
    if(s.paused || s.cinematic)return;
    if(s.health<=0 || s.finished){this.clearHeld();this.clearFlights();return;}
    const arena=s.waves?.arena??0;
    if(!this.rolled.has(arena) && (!s.stage || s.stage.reached(arena))){
      this.rolled.add(arena);
      if(arena===0 || this.random()<VUVUZELA.spawnChance){
        const left=s.stage?.arenaScroll(arena)??0;
        this.spawn(left+ARCADE.screen.width*.62,(s.floor.top+s.floor.bottom)/2);
      }
    }
    this.items=this.items.filter(item=>{
      const g=item.graphic.clear().setDepth(item.y),bob=Math.sin(frame/12)*2;
      g.fillStyle(0x080d14,.35).fillEllipse(item.x,item.y,52,10);
      g.lineStyle(1,0xffdf65,.65).strokeEllipse(item.x,item.y-4,58,17);
      item.sprite.setPosition(item.x,item.y-16+bob);
      if(this.pendingBreak || this.remaining || action || model.state!=='walk' || (p.z??0)>8 || Math.abs(p.x-item.x)>28 || Math.abs(p.y-item.y)>20)return true;
      this.equip(item.remaining);g.destroy();item.sprite.destroy();return false;
    });
    // Keep the last swing alive through all active frames, then shatter once.
    if(this.pendingBreak && (!action || action.displayedFrame?.phase!=='active')){
      if(action)action.weaponBroken=true;this.break();
    }
    this.shots=this.shots.filter(shot=>{
      const previous=shot.x;shot.x+=shot.facing*VUVUZELA.throwSpeed/ARCADE.clock.fps;shot.age++;
      const t=Math.min(1,shot.age/VUVUZELA.flightFrames);
      shot.lift=shot.startLift*(1-t)+Math.sin(t*Math.PI)*24;
      const target=s.enemies.filter(enemy=>{
        const half=enemy.config?.hurtbox?.halfWidth??ARCADE.body.halfWidth;
        return enemy.hp>0 && (enemy.z??0)<ARCADE.body.airborneAvoidHeight && shot.lift>10
          && Math.abs(shot.y-enemy.y)<VUVUZELA.throwLane
          && enemy.x+half>=Math.min(previous,shot.x)-VUVUZELA.throwWidth/2
          && enemy.x-half<=Math.max(previous,shot.x)+VUVUZELA.throwWidth/2;
      }).sort((a,b)=>(a.x-b.x)*shot.facing)[0];
      if(target){
        shot.x=Math.max(Math.min(previous,shot.x),Math.min(Math.max(previous,shot.x),target.x));
        const attack={type:'vuvuzela',damage:shot.damage,facing:shot.facing,knockback:18,stun:300,finisher:false};
        const hp=target.hp;s.hitEnemy(target,attack);
        if(target.hp<hp)s.arcade.combat.impact?.(p,target,attack);
        this.shatter(shot,frame);return false;
      }
      shot.sprite.setPosition(shot.x,shot.y-shot.lift).setRotation(shot.age*shot.facing*.35);
      if(t>=1 || shot.x<=(s.floor.left??-Infinity) || shot.x>=(s.floor.right??Infinity)){
        this.shatter(shot,frame);return false;
      }
      return true;
    });
    this.trail.clear();
    const swinging=action?.data.weapon==='vuvuzela' && !action.weaponBroken;
    this.label.setVisible(Boolean(this.remaining || swinging)).setText(`H VUVUZELA · ${this.remaining}/10 · J LANZAR`);
    this.fx.clear().setDepth(p.y+10);
    this.bursts=this.bursts.filter(b=>{
      const t=(frame-b.born)/28;if(t>=1)return false;
      for(let i=0;i<12;i++){
        const a=i/12*Math.PI*2,r=8+t*60,x=b.x+Math.cos(a)*r,y=b.y+Math.sin(a)*r+t*t*30;
        this.fx.fillStyle([0xffdb24,0x164ed0,0xef2444][i%3],1-t).fillTriangle(x-5,y+3,x+5,y-4,x+3,y+5);
      }
      this.fx.lineStyle(2,0xffe6a3,1-t).strokeCircle(b.x,b.y,10+t*48);return true;
    });
  }
  /** Draw the complete armed body, never a floating item over unarmed punch art. */
  render(){
    const s=this.scene,p=s.player,model=s.arcade.player,action=model.action;
    const swing=action?.data.weapon==='vuvuzela' && !action.weaponBroken;
    const key=`${s.characterKey}-vuvuzela`,runKey=armedRunTexture(s.characterKey),runArt=ARMED_RUN[s.characterKey];
    const armed=s.health>0 && !s.finished && !s.arcade.diablitos?.holdsPlayer && (this.remaining>0 || swing)
      && (model.state==='walk' || swing) && s.textures.exists(key);
    p.sprite.setVisible(!armed);this.held.setVisible(Boolean(armed));
    if(!armed)return;
    const walking=s.arcade.input?.dx || s.arcade.input?.dy;
    // Armed run: the clean run-cycle body holding the horn (legs alternate); other characters use the sheet's 4 walking poses.
    const run=Boolean(runArt && !swing && walking && s.textures.exists(runKey));
    const cadence=s.character.walkFramesPerPose??ARCADE.animation.walkFramesPerPose;
    const pose=swing?action.displayedFrame.weaponPose:run?runArt.order[Math.floor(model.age/cadence)%runArt.order.length]:walking?1+Math.floor(model.age/ARCADE.animation.walkFramesPerPose)%4:0;
    const scale=s.character.height/s.textures.get(run?s.characterKey:key).referenceHeight
      *(run?1:(ARMED_BODY_SCALE[s.characterKey]??1));
    this.held.setTexture(run?runKey:key,pose).setScale(scale).setFlipX(s.facing<0).setAlpha(p.sprite.alpha)
      .setPosition(p.sprite.x,p.y-(p.z??0)+4*scale).setDepth(p.y);
  }
  destroy(){this.clearFlights();for(const item of this.items){item.graphic.destroy();item.sprite.destroy();}this.items=[];this.scene.player.sprite.setVisible(true);this.held.destroy();this.trail.destroy();this.fx.destroy();this.label.destroy();}
}
