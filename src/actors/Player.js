import {ARCADE} from '../data/arcade.js';
import {matchingRoutes} from '../data/comboRoutes.js';
import {playerAttackData,comboOptions,PLAYER_CONTACT_POSES} from '../data/attacks.js';
import {InputBuffer} from '../input/InputBuffer.js';
import {canSpendSpecialEnergy,spendSpecialEnergy} from '../combat/specialEnergy.js';
import {strikeSound,playPowerSound} from '../audio/SoundEffects.js';
import {GrabPiledriver} from './GrabPiledriver.js';
import {GrabShake} from './GrabShake.js';
// Strikes that choose their sound by result (hit → punch/kick, miss → wave) once the active frames end.
const STRIKES=['punch','kick','lowKick','upperPunch','slide','shoulder','airDashKick'];

export const PLAYER_STATES=['walk','attack','special','jump','hurt','knockdown','dash','celebration','grab','parry'];
const transitions={walk:['attack','special','jump','hurt','knockdown','dash','celebration','grab','parry'],parry:['walk','attack','special','dash','hurt','knockdown','celebration'],grab:['walk','hurt','knockdown','celebration'],jump:['walk','attack','hurt','knockdown','celebration'],
  attack:['walk','attack','jump','hurt','knockdown','dash','celebration'],special:['walk','hurt','knockdown','dash','celebration'],
  hurt:['walk','knockdown','celebration'],knockdown:['walk','knockdown','celebration'],dash:['walk','attack','hurt','knockdown','celebration'],celebration:[]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Player {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.buffer=new InputBuffer();this.jumpRoll=0;this.reset();}
  get actor(){return this.scene.player;}
  reset(){this.captor?.releasePlayer();this.dropGrab();this.state='walk';this.pendingComboDown=null;this.lastCombo=null;this.age=0;this.action=null;this.jumpRoll=0;this.jumpAge=ARCADE.jump.frames;this.airMotion=null;this.airDashUsed=false;this.airDashWindow=-Infinity;this.dashReady=0;this.parry=null;this.buffer.clear();if(this.actor){this.actor.z=0;this.actor.sprite?.clearTint?.();}}
  transition(state){if(state!==this.state && !transitions[this.state]?.includes(state))throw new Error(`Invalid player transition: ${this.state} → ${state}`);if(this.state==='grab' && state!=='grab')this.dropGrab();if(this.state==='parry' && state!=='parry')this.actor?.sprite?.clearTint?.();this.state=state;this.age=0;if(!['attack','special'].includes(state)){this.action=null;this.scene.playerAttack=null;}}
  request(type){
    if(type==='super'){this.scene.superPower?.activate();return;}
    if(this.scene.superPower?.active)return;
    if(this.captor){this.captor.strugglePress?.(type);return;}
    if(this.runtime.diablitos?.holdsPlayer)return;
    if(type==='punch' && this.runtime.diablitos?.tryPlayerUse())return;
    this.buffer.push(type,this.runtime.frame);
  }
  begin(type,stage=0,route){
    if(this.pendingComboDown){if(Array.isArray(route))this.pendingComboDown=null;else this.finishComboDown();}
    const s=this.scene,airborne=this.jumpAge<ARCADE.jump.frames;this.lastCombo=null;
    if(airborne && type!=='kick' && type!=='airDashKick')return false;
    if(type==='airDashKick' && (!airborne || !s.character.airDashKick || this.airDashUsed))return false;
    if(type===s.character.special && (s.combatTime<s.specialReadyAt || !canSpendSpecialEnergy(s)))return false;
    let data=playerAttackData(s.character,type,stage,airborne,route);if(!data)return false;
    if(!airborne){data=s.vuvuzela?.attack(data)??data;data=s.panela?.attack(data)??data;}
    if(this.state==='jump' && !airborne)this.transition('walk'); // landing frame: the jump state ends this same step
    if(this.state==='dash')this.scene.dashUntil=0; // dash + K: the slide takes over the dash
    this.transition(type===s.character.special?'special':'attack');
    this.action={data,index:0,displayedFrame:data.frames[0],targets:new Set(),committed:false};
    if(data.airDash){
      const c=s.character.airDashKick;this.airDashUsed=true;this.airDashWindow=-Infinity;
      this.actor.z=Math.max(16,this.actor.z??0);this.jumpAge=0;
      this.airMotion={kind:'dash',age:0,frames:c.flightFrames,from:this.actor.z,height:c.flightHeight};
    }
    s.playerAttack={...data,start:s.combatTime,facing:s.facing,hit:false};
    this.actor.sprite.stop().setFrame(data.frames[0].pose);
    return true;
  }
  dash(dx,dy){
    if(this.captor)return false;
    const air=this.scene.character.airDashKick;
    if(air && this.jumpAge<ARCADE.jump.frames){
      if(this.airDashUsed || !['walk','jump'].includes(this.state))return false;
      if(dx)this.scene.facing=Math.sign(dx);
      this.airDashWindow=this.runtime.frame+air.window;return true;
    }
    // Only from states that may dash (not while grabbing, hurt, down…): an invalid transition would throw inside the game loop.
    if(this.state!=='dash' && !transitions[this.state]?.includes('dash'))return false;
    if(this.state==='parry' && !this.parry?.success)return false;
    if(this.runtime.frame<this.dashReady || ['hurt','knockdown','celebration'].includes(this.state) || this.actor.z>0)return false;
    const length=Math.hypot(dx,dy)||1;this.vector=dx||dy?{x:dx/length,y:dy/length}:{x:this.scene.facing,y:0};
    this.finishComboDown();this.lastCombo=null;this.transition('dash');this.buffer.clear();this.dashReady=this.runtime.frame+ARCADE.dash.cooldown;
    this.scene.dashUntil=this.scene.combatTime+ARCADE.dash.frames*ARCADE.clock.stepMs;
    this.scene.invulnerableUntil=this.scene.combatTime+ARCADE.dash.invulnerable*ARCADE.clock.stepMs;return true;
  }
  /** Dash + K (characters with a dashCombo): during the dash or right after it, a buffered kick starts the opener (slide/shoulder). */
  dashKick(window){
    if(!window || !this.scene.character.dashCombo || this.scene.vuvuzela?.remaining || (this.actor.z??0)>0 || !this.buffer.consume('kick',this.runtime.frame))return false;
    this.dashEndFrame=-Infinity;return this.begin(this.scene.character.dashCombo.inputs[0],0,'dash'); // slide, or Gymbro's shoulder
  }
  tryAirDashKick(){
    if(this.jumpAge>=ARCADE.jump.frames || this.runtime.frame>this.airDashWindow || this.airDashUsed
      || !this.scene.character.airDashKick || !this.buffer.consume('kick',this.runtime.frame))return false;
    return this.begin('airDashKick');
  }
  rebound(action){
    const c=this.scene.character.airDashKick;
    this.resolveStrikeSound(action,true);this.transition('jump');this.jumpAge=0;
    this.airMotion={kind:'bounce',age:0,frames:c.bounceFrames,from:this.actor.z??0,height:c.bounceHeight};
    this.airDashUsed=false;this.airDashWindow=-Infinity;this.buffer.clear();
  }
  /** Grounded J throws the held vuvuzela instead of kicking. */
  throwWeapon(){
    const v=this.scene.vuvuzela;
    if(!['walk','dash'].includes(this.state) || !v?.remaining || v.pendingBreak || (this.actor.z??0)>0 || !this.buffer.consume('kick',this.runtime.frame))return false;
    return v.throwForward();
  }
  hurt(finisher=false){
    if(this.state==='celebration')return; // level already won
    this.captor?.onPlayerHit?.(finisher || this.scene.health<=0);
    this.finishComboDown();this.lastCombo=null;
    // A combo follow-up can land while the player is already down: stay down (knockdown → hurt is not a valid transition).
    this.transition(this.scene.health<=0 || finisher || this.state==='knockdown'?'knockdown':'hurt');this.buffer.clear();
    this.actor.z=0;this.jumpAge=ARCADE.jump.frames;
    this.airMotion=null;this.airDashUsed=false;this.airDashWindow=-Infinity;
    if(this.state==='knockdown')this.holeCheck=true; // checked once the hit's push has moved the body
    const frames=this.state==='knockdown'?ARCADE.player.knockdownFrames+ARCADE.player.wakeInvulnerable:ARCADE.player.hitInvulnerable;
    this.scene.invulnerableUntil=this.scene.combatTime+frames*ARCADE.clock.stepMs;
  }
  pose(state,age=this.age){const art=this.scene.character.animations[state];if(art?.length){const index=Math.floor(age/(state==='walk'?this.scene.character.walkFramesPerPose??ARCADE.animation.walkFramesPerPose:ARCADE.animation.walkFramesPerPose));this.actor.sprite.stop().setFrame(art[state==='walk'||state==='dash'?index%art.length:Math.min(art.length-1,index)]);}}
  move(dx,dy,multiplier=1){
    const s=this.scene,n=Math.max(1,Math.hypot(dx,dy)),speed=s.character.speed*multiplier*(s.hazards?.speedFactor(this.actor)??1);
    const previous={x:this.actor.x,y:this.actor.y};
    this.actor.x=clamp(this.actor.x+dx/n*speed/ARCADE.clock.fps,s.floor.left,s.floor.right);
    this.actor.y=clamp(this.actor.y+dy/n*speed*ARCADE.movement.depthRatio/ARCADE.clock.fps,s.floor.top,s.floor.bottom);
    s.hazards?.resolve(this.actor);
    s.chivaBonus?.resolveMovement?.(previous);
    for(const model of (this.runtime.enemies?.values()??[]))model.reversa?.resolveMovement(previous);
  }
  step(input){
    const s=this.scene,combat=this.runtime.combat;this.buffer.expire(this.runtime.frame);
    if(this.pendingComboDown && this.runtime.frame>this.pendingComboDown.until)this.finishComboDown();
    this.captor?.heldInput?.(input);
    if(this.captor){this.captor.holdPlayer();this.buffer.clear();s.jumpHeight=0;return;}
    if(this.runtime.diablitos?.holdsPlayer){this.buffer.clear();s.jumpHeight=this.actor.z??0;return;}
    if(s.superPower?.active){this.buffer.clear();s.jumpHeight=0;return;}
    if(combat.frozen(this.actor))return;
    const previous={x:this.actor.x,y:this.actor.y};
    if(input.dash && this.state!=='walk' && this.state!=='jump')this.dash(input.dx,input.dy);
    if(this.airMotion){
      const motion=this.airMotion,t=Math.min(1,++motion.age/motion.frames);
      this.actor.z=t===1?0:Math.min(120,motion.from*(1-t)+Math.sin(t*Math.PI)*motion.height);
      this.jumpAge=t===1?ARCADE.jump.frames:Math.min(ARCADE.jump.frames-1,Math.floor(t*ARCADE.jump.frames));
      if(t===1)this.airMotion=null;
    }else if(this.jumpAge<ARCADE.jump.frames){this.jumpAge++;this.actor.z=this.jumpAge===ARCADE.jump.frames?0:Math.sin(this.jumpAge/ARCADE.jump.frames*Math.PI)*ARCADE.jump.height;}
    if(this.jumpAge>=ARCADE.jump.frames){this.airDashUsed=false;this.airDashWindow=-Infinity;}
    if(this.state==='walk'||this.state==='jump') {
      if(input.jump && this.state==='walk'){
        this.jumpRoll=input.dx?(Math.sign(input.dx)===s.facing?1:-1):0;
        this.transition('jump');this.jumpAge=0;s.jumpStart=s.combatTime;
      }
      if(input.dash)this.dash(input.dx,input.dy);
      if(this.state!=='dash') {
        if(input.dx && !(this.state==='jump' && this.jumpRoll))s.facing=Math.sign(input.dx);
        this.move(input.dx,input.dy,s.boss?.status.speedMultiplier??1);
        if(this.state==='walk' && this.tryGrab(input)){s.boss?.hazards.resolveMovement(previous);s.jumpHeight=0;this.age++;return;}
        if(this.state==='walk' && this.tryParry()){s.boss?.hazards.resolveMovement(previous);s.jumpHeight=0;this.age++;return;}
        const link=this.lastCombo && this.runtime.frame-this.lastCombo.endFrame<=ARCADE.input.comboLinkFrames && this.jumpAge>=ARCADE.jump.frames?this.lastCombo:null;
        if(!this.tryAirDashKick() && !this.throwWeapon() && !this.dashKick(this.runtime.frame-(this.dashEndFrame??-Infinity)<=ARCADE.dash.attackGrace)){
          const next=link && this.consumeCombo(link.data);
          if(!next)for(const type of [s.character.special,'lowKick','kick','upperPunch','punch'])if(this.buffer.consume(type,this.runtime.frame) && this.begin(type))break;
        }
      }
      if(this.state==='jump' && this.jumpAge>=ARCADE.jump.frames)this.transition('walk');
      if(this.state==='walk'){if(input.dx||input.dy)this.pose('walk');else this.actor.sprite.stop().setFrame(s.character.idle);}
      if(this.state==='jump'){
        const bounce=this.airMotion?.kind==='bounce'?s.character.animations.airBounce:null;
        const roll=this.jumpRoll<0?s.character.animations.jumpRollBack:this.jumpRoll>0?s.character.animations.jumpRoll:null;
        this.actor.sprite.stop().setFrame(bounce?bounce[Math.min(bounce.length-1,Math.floor(this.airMotion.age/this.airMotion.frames*bounce.length))]:roll?roll[Math.min(roll.length-1,Math.floor(this.jumpAge/ARCADE.jump.frames*roll.length))]:s.character.jump);
      }
    } else if(this.state==='grab') {
      this.stepGrab(input);
    } else if(this.state==='parry') {
      if(this.stepParry(input)){s.boss?.hazards.resolveMovement(previous);s.jumpHeight=this.actor.z??0;this.age++;return;}
    } else if(this.state==='dash') {
      this.move(this.vector.x,this.vector.y,ARCADE.dash.speed/s.character.speed);this.pose('dash');
      this.throwWeapon();
      if(!this.dashKick(true) && this.age>=ARCADE.dash.frames){this.transition('walk');s.dashUntil=0;this.dashEndFrame=this.runtime.frame;}
    } else if(this.state==='hurt'||this.state==='knockdown') {
      this.pose(this.state==='hurt'?'hurt':'defeat');
      if(this.holeCheck && this.state==='knockdown' && this.age>=2){this.holeCheck=false;s.hazards?.playerDown(this.actor);}
      const duration=this.state==='hurt'?ARCADE.player.hurtFrames:ARCADE.player.knockdownFrames;
      if(this.age>=duration && s.health>0 && s.combatTime>=s.hurtUntil){
        if(this.state==='knockdown')s.invulnerableUntil=s.combatTime+ARCADE.player.wakeInvulnerable*ARCADE.clock.stepMs;
        this.transition('walk');s.hurtUntil=0;
      }
    }
    if(this.action){
      const action=this.action,data=action.data,frame=data.frames[action.index];
      action.displayedFrame=frame;
      this.actor.sprite.stop().setFrame(frame.pose);
      // Slide: keeps travelling forward until it connects, so it trips the target instead of passing through it.
      if(data.slide && frame.phase!=='recovery' && !action.targets.size)this.move(s.playerAttack?.facing??s.facing,0,ARCADE.dash.slideSpeed/s.character.speed);
      if(data.airDash && frame.phase!=='recovery' && !action.targets.size)this.move(s.playerAttack?.facing??s.facing,0,s.character.airDashKick.speed/s.character.speed);
      if(frame.phase==='active'){this.contact(action);action.wasActive=true;}
      else if(action.wasActive)this.resolveStrikeSound(action);
      if(action.bounceHit){this.rebound(action);s.boss?.hazards.resolveMovement(previous);s.jumpHeight=this.actor.z??0;this.age++;return;}
      // Combos: during the cancel window the next input of the character's chain (H,H,H · H,H,J · J,J,J) links the next strike.
      const linked=frame.cancel && this.consumeCombo(data);
      if(!linked && ++action.index>=data.frames.length){
        this.resolveStrikeSound(action);
        this.lastCombo=comboOptions(s.character,data).length?{data,endFrame:this.runtime.frame}:null;
        if(this.pendingComboDown)this.pendingComboDown.until=this.runtime.frame+ARCADE.input.comboLinkFrames;
        this.transition(this.jumpAge<ARCADE.jump.frames?'jump':'walk');
      }
    }
    s.boss?.hazards.resolveMovement(previous);s.jumpHeight=this.actor.z??0;this.age++;
  }
  finishComboDown(){
    const pending=this.pendingComboDown;this.pendingComboDown=null;if(!pending)return;
    for(const target of pending.targets){
      if(target===this.scene.boss?.actor){if(this.scene.boss.hp>0)this.scene.boss.comboKnockdown();continue;}
      const model=this.runtime.enemies.get(target);
      // A boss takes the whole combo, then leaps out instead of being knocked down again and again by repeated PPPs.
      if(target.hp>0 && target.config?.boss){if(!model?.startBossEscape?.('pressure'))model?.superKnockdown();continue;}
      if(model?.canKnockdown() && !['down','thrown','dead'].includes(model.state))model.knockdown({...pending.attack,knockback:0});
    }
  }
  consumeCombo(data){
    const options=comboOptions(this.scene.character,data);
    if(!options.length)return false;
    const entry=this.buffer.entries.find(e=>['punch','kick','lowKick','upperPunch'].includes(e.action));
    if(!entry)return false;
    if(!options.includes(entry.action)){data.comboBroken=true;return false;}
    this.buffer.consume(entry.action,this.runtime.frame);
    const linked=this.begin(entry.action,data.stage+1,data.path?[...data.path,entry.action]:data.chain);
    // Only the strike that completes a route bursts out with the speed trail; opening strikes are ordinary.
    if(linked && data.path && this.action.data.finisher)this.runtime.combat.comboRush?.(this.actor,this.scene.facing,this.action.data.comboSpeed);
    return linked;
  }
  /** Grab poses. With a `grab` config (dedicated sheet): start/hold loops and knee/throw sequences with their
   * contact pose; otherwise existing poses stand in (arm out to hold, the kick for the knee, the combo finisher to throw). */
  grabPoses(){
    const c=this.scene.character,g=c.grab,contact=PLAYER_CONTACT_POSES[c.texture]??{},art=c.animations;
    if(g)return g;
    const hold=contact.punch??art.punch?.[1]??c.idle,knee=contact.kick??art.kick?.[1]??c.idle,toss=contact.combo3??contact.kick??art.kick?.at(-1)??c.idle;
    return {start:[hold],hold:[hold],knee:[hold,knee],kneeContact:knee,throw:[hold,toss],throwContact:toss};
  }
  /** Pose of a sequence at `age`, with its contact pose shown exactly at `hit` and the rest spread before/after it. */
  sequencePose(poses,contactPose,age,hit,total){
    const at=Math.max(0,poses.indexOf(contactPose));
    if(age<hit)return poses[Math.min(at,Math.floor(age/hit*at))]??contactPose;
    return poses[Math.min(poses.length-1,at+Math.floor((age-hit)/Math.max(1,total-hit)*(poses.length-at)))];
  }
  /** Walking into a grabbable enemy for a few frames seizes it. */
  tryGrab(input){
    const s=this.scene,p=this.actor,g=ARCADE.grab,dir=Math.sign(input.dx);
    if(!dir || (p.z??0)>0 || s.vuvuzela?.remaining || s.panela?.remaining){this.grabTouch=null;return false;}
    const target=s.enemies.find(e=>{
      const model=this.runtime.enemies.get(e);
      return model?.grabbable() && Math.sign(e.x-p.x)===dir && Math.abs(e.x-p.x)<=g.reach && Math.abs(e.y-p.y)<=g.depth;
    });
    if(!target){this.grabTouch=null;return false;}
    if(this.grabTouch?.target!==target)this.grabTouch={target,frames:0};
    if(++this.grabTouch.frames<g.touchFrames)return false;
    this.grabTouch=null;s.facing=dir;this.transition('grab');this.buffer.clear();
    const model=this.runtime.enemies.get(target);model.seize();
    this.grab={target,model,age:0,knees:0,action:null};this.holdTarget();s.sfx?.play('wave');
    return true;
  }
  holdTarget(){
    const s=this.scene,p=this.actor,t=this.grab.target;
    t.x=clamp(p.x+s.facing*ARCADE.grab.hold,s.floor.left,s.floor.right);t.y=p.y;t.z=0;t.facing=-s.facing;t.sprite.setFlipX(t.facing<0);
  }
  stepGrab(input){
    const s=this.scene,g=this.grab,G=ARCADE.grab,t=g.target,poses=this.grabPoses();g.age++;
    if(g.piledriver){g.piledriver.step();return;}
    if(g.shake){g.shake.step();return;}
    if(!g.action && (t.hp<=0 || g.model.state!=='grabbed')){this.transition('walk');return;}
    if(g.action){
      const act=g.action;act.age++;
      if(act.kind==='knee'){
        this.actor.sprite.stop().setFrame(this.sequencePose(poses.knee,poses.kneeContact,act.age,act.hit,act.total));
        if(act.age===act.hit){
          g.knees++;const last=g.knees>=G.maxKnees;s.sfx?.play('punch');g.age=Math.min(g.age,Math.round(G.holdFrames/2)); // each knee buys time before it breaks free
          // Knees keep it held; the last one knocks it down and ends the hold.
          s.hitEnemy(t,{damage:Math.round(s.character.attacks.punch.damage*G.kneeDamage),knockback:last?ARCADE.knockdown.knockback:0,facing:s.facing,stun:200,
            grab:!last,knockdown:last,finisher:last,lane:ARCADE.body.lane});
        }
      }else{
        this.actor.sprite.stop().setFrame(this.sequencePose(poses.throw,poses.throwContact,act.age,act.release,act.total));
        // Load the body onto the shoulder before release, rather than teleporting it across on a back throw.
        if(act.age<=act.release){
          const progress=act.age/act.release;
          t.x=clamp(this.actor.x+act.fromFacing*G.hold*(1-progress)+s.facing*12*progress,s.floor.left,s.floor.right);
          t.y=this.actor.y;t.z=Math.sin(progress*Math.PI/2)*G.throwLift;
        }
        if(act.age===act.release && t.hp>0 && g.model.state==='grabbed'){
          g.model.startThrown(s.facing,Math.round(s.character.attacks.kick.damage*G.throwDamage));s.sfx?.play('whip');
        }
      }
      if(act.age>=act.total){g.action=null;if(act.kind==='throw' || g.knees>=G.maxKnees || g.model.state!=='grabbed')this.transition('walk');}
      return;
    }
    // Reaching in (start poses) for the first frames, then the grip loops.
    const reach=8*poses.start.length;
    this.holdTarget();this.actor.sprite.stop().setFrame(g.age<reach?poses.start[Math.floor(g.age/8)]:poses.hold[Math.floor((g.age-reach)/12)%poses.hold.length]);
    const frame=this.runtime.frame,back=input.dx && Math.sign(input.dx)===-s.facing;
    if(input.jump && s.character.piledriver && g.age<G.holdFrames){g.piledriver=new GrabPiledriver(this,g);g.piledriver.step();}
    else if(this.buffer.consume('kick',frame)){
      const fromFacing=s.facing;if(back && s.character.grabShake)s.facing=-s.facing;
      g.action={kind:'throw',age:0,fromFacing,release:G.throwRelease,total:G.throwTotal};
    }
    else if(this.buffer.consume('punch',frame)){
      if(s.character.grabShake)g.shake=new GrabShake(this,g);
      else if(back){const fromFacing=s.facing;s.facing=-s.facing;g.action={kind:'throw',age:0,fromFacing,release:G.throwRelease,total:G.throwTotal};}
      else g.action={kind:'knee',age:0,hit:G.kneeHit,total:G.kneeTotal};
    }
    else if(g.age>=G.holdFrames){g.model.breakFree();this.actor.x=clamp(this.actor.x-s.facing*12,s.floor.left,s.floor.right);this.transition('walk');}
  }
  /** U on the ground starts a parry stance (arms out, blue tint). */
  tryParry(){
    if((this.actor.z??0)>0 || this.jumpAge<ARCADE.jump.frames || !this.buffer.consume('parry',this.runtime.frame))return false;
    this.beginParry();return true;
  }
  beginParry(){
    this.transition('parry');this.parry={success:false};this.buffer.clear();
    this.actor.sprite.stop().setFrame(this.grabPoses().hold[0]);this.actor.sprite.setTint?.(0x9ad8ff);
  }
  /** The catch window is open (only the first frames of the stance, before any success). */
  get parryActive(){return this.state==='parry' && Boolean(this.parry) && !this.parry.success && this.age<ARCADE.parry.active;}
  /** Returns true when it changed state itself (counter started), so step() skips the rest. */
  stepParry(input){
    const s=this.scene,P=ARCADE.parry,p=this.parry,frame=this.runtime.frame;
    if(!p){this.transition('walk');return false;}
    if(!p.success && this.age===P.active)this.actor.sprite.clearTint?.(); // window closed: open to hits
    if(!p.success)this.actor.sprite.stop().setFrame(this.grabPoses().hold[0]);
    if(p.success){
      // Counter: any action cancels what is left of the stance.
      if(input.dash && this.dash(input.dx,input.dy))return true;
      for(const type of [s.character.special,'lowKick','kick','punch'])if(this.buffer.consume(type,frame) && this.begin(type))return true;
      if(this.buffer.consume('parry',frame)){this.beginParry();return true;}
    }
    if(this.age>=(p.success?P.successRecovery:P.active+P.recovery))this.transition('walk');
    return false;
  }
  /** Called from scene.hitPlayer: a melee strike (it carries its attacker's `pending`) inside the window is parried. */
  catchStrike(combo){
    const attacker=combo?.enemy;
    if(!this.parryActive || !attacker || attacker.hp<=0)return false;
    this.parrySuccess(attacker);return true;
  }
  /** Straight projectiles (knives, thrown items) are knocked away. */
  catchProjectile(projectile){
    if(!this.parryActive)return false;
    this.parrySuccess(null,projectile);return true;
  }
  parrySuccess(attacker,projectile=null){
    const s=this.scene,P=ARCADE.parry,combat=this.runtime.combat,p=this.actor,step=ARCADE.clock.stepMs;
    this.parry.success=true;this.age=0;this.buffer.clear();
    s.invulnerableUntil=Math.max(s.invulnerableUntil??0,s.combatTime+P.invulnerable*step);
    s.sfx?.play('metalCrack');
    const x=attacker?(attacker.x+p.x)/2:projectile?.x??p.x,y=p.y-(s.character.height??110)*.55;
    if(attacker){
      const facing=Math.sign(attacker.x-p.x)||s.facing;s.facing=facing;
      const model=this.runtime.enemies.get(attacker),staggered=Boolean(model?.parried?.(P.stunFrames));
      if(staggered){attacker.parriedUntil=s.combatTime+P.counterMs;attacker.counterShown=false;}
      else p.x=clamp(p.x-facing*P.push,s.floor.left,s.floor.right); // bosses keep their footing: both bounce apart
      combat.impact(p,attacker,{finisher:true,type:'parry',facing});
      const until=combat.frame+P.hitstop;
      for(const actor of [p,attacker])combat.stops.set(actor,Math.max(combat.stops.get(actor)??0,until));
    }
    s.fx?.flash?.(x,y,{color:0x9ad8ff,radius:120,intensity:.85,ms:280});
    s.cameras?.main?.flash?.(70,154,216,255);
    s.combo?.onParry?.();
    if(!s.add?.text)return;
    const label=s.add.text(p.x,p.y-(s.character.height??110)-34,'¡PARRY!',{fontFamily:"'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",fontSize:'26px',fontStyle:'bold',
      color:'#bff0ff',stroke:'#0d2230',strokeThickness:4}).setOrigin(.5).setDepth(953);
    s.tweens?.add?.({targets:label,y:label.y-22,scale:{from:1.35,to:1},duration:160,ease:'Back.Out',onComplete:()=>
      s.tweens?.add?.({targets:label,y:label.y-20,alpha:0,duration:420,delay:200,onComplete:()=>label.destroy()})});
  }
  /** Leaving the grab state for any reason (hurt, reset…) lets a still-held enemy go. */
  dropGrab(){this.grab?.piledriver?.cancel();this.grab?.shake?.cancel();if(this.grab?.model?.state==='grabbed'){this.grab.target.z=0;this.grab.model.breakFree();}this.grab=null;}
  /** Impact sound fires on the first frame a strike connects; a whoosh if the active frames end empty. */
  resolveStrikeSound(action,connected=false){
    if(action.sounded || !STRIKES.includes(action.data.type) || (!connected && !action.wasActive))return;
    const impact=action.data.impactType??action.data.type;
    action.sounded=true;this.scene.sfx?.play(connected && action.data.impactSound?action.data.impactSound:strikeSound(['upperPunch','book'].includes(impact)?'punch':impact,connected));
  }
  contact(action){
    const s=this.scene,attack=s.playerAttack;if(!attack)return;
    if(!action.committed){
      s.vuvuzela?.commit(action);
      s.panela?.commit(action);
      if(attack.type==='iphone'){action.committed=true;s.iphone?.release(attack);return;}
      if(attack.type==='books'){action.committed=true;s.books?.summon(attack);return;}
      if(attack.type===s.character.special){
        if(!spendSpecialEnergy(s)){this.transition('walk');return;}
        if(attack.cooldown)s.specialReadyAt=s.combatTime+attack.cooldown;
        s.sfx?.play(attack.sound??(attack.type==='headset'?'whip':'stomp'));playPowerSound(s);
        if(attack.type==='stomp')this.runtime.combat.quake(this.actor,attack.range);
        if(attack.splash)this.runtime.combat.splash(this.actor,attack.facing,attack.range);
        if(attack.wave)this.runtime.combat.energyWave(this.actor,attack.facing,attack.range);
      }
      if(attack.comboEffect)this.runtime.combat.comboEffect?.(this.actor,attack);
      action.committed=true;attack.hit=true;
    }
    if(attack.projectile || attack.summon)return;
    const defer=attack.path && attack.finisher && comboOptions(s.character,action.data).length>0;
    const strike=defer?{...attack,finisher:false,knockdown:false,knockback:0}:attack;
    this.runtime.poultry?.contact(this.actor,attack,action.targets);
    s.energyPickups?.contact(this.actor,attack,action.targets);
    for(const target of s.enemies)if(target.hp>0 && s.combatTime>=(target.invulnerableUntil??0) && !action.targets.has(target) && this.runtime.combat.touches(this.actor,target,attack)){
      const hp=target.hp,blocked=attack.airDash && target.config?.shield && s.shieldBlocks(target,attack);
      action.targets.add(target);s.hitEnemy(target,strike);
      if(defer && target.hp<hp && target.hp>0){
        this.pendingComboDown??={targets:new Set(),attack,until:Infinity};this.pendingComboDown.targets.add(target);
      }
      if(attack.airDash && target.hp<hp && !blocked)action.bounceHit=true;
    }
    const boss=s.boss;
    if(boss && !action.targets.has(boss.actor) && this.runtime.combat.touches(this.actor,boss.actor,attack)){
      const hp=boss.hp;action.targets.add(boss.actor);boss.hit(strike);
      if(defer && boss.hp<hp && boss.hp>0){this.pendingComboDown??={targets:new Set(),attack,until:Infinity};this.pendingComboDown.targets.add(boss.actor);}
      if(attack.airDash && boss.hp<hp)action.bounceHit=true;
    }
    s.boss?.hazards.hitObstacles(attack);
    // A completed combo route lands: emphasise it once, on the first target it hit.
    if(attack.path && attack.finisher && action.targets.size && !action.comboFinished){
      action.comboFinished=true;const target=[...action.targets].find(t=>t!==this.actor && t.config);
      const route=matchingRoutes(attack.path,s.character).find(r=>r.inputs.length===attack.path.length);
      if(target && route)this.runtime.combat.comboFinish?.(this.actor,target,attack,route.notation);
    }
    if(action.targets.size)this.resolveStrikeSound(action,true);
  }
}
