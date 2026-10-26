import {ARCADE} from '../data/arcade.js';
import {playerAttackData,comboNext,PLAYER_CONTACT_POSES} from '../data/attacks.js';
import {InputBuffer} from '../input/InputBuffer.js';
import {canSpendSpecialEnergy,spendSpecialEnergy} from '../combat/specialEnergy.js';
import {strikeSound,playPowerSound} from '../audio/SoundEffects.js';
// Strikes that choose their sound by result (hit → punch/kick, miss → wave) once the active frames end.
const STRIKES=['punch','kick','lowKick'];

export const PLAYER_STATES=['walk','attack','special','jump','hurt','knockdown','dash','celebration','grab'];
const transitions={walk:['attack','special','jump','hurt','knockdown','dash','celebration','grab'],grab:['walk','hurt','knockdown','celebration'],jump:['walk','attack','hurt','knockdown','celebration'],
  attack:['walk','attack','jump','hurt','knockdown','dash','celebration'],special:['walk','hurt','knockdown','dash','celebration'],
  hurt:['walk','knockdown','celebration'],knockdown:['walk','knockdown','celebration'],dash:['walk','hurt','knockdown','celebration'],celebration:[]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Player {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.buffer=new InputBuffer();this.reset();}
  get actor(){return this.scene.player;}
  reset(){this.dropGrab();this.state='walk';this.age=0;this.action=null;this.jumpAge=ARCADE.jump.frames;this.dashReady=0;this.buffer.clear();if(this.actor)this.actor.z=0;}
  transition(state){if(state!==this.state && !transitions[this.state]?.includes(state))throw new Error(`Invalid player transition: ${this.state} → ${state}`);if(this.state==='grab' && state!=='grab')this.dropGrab();this.state=state;this.age=0;if(!['attack','special'].includes(state)){this.action=null;this.scene.playerAttack=null;}}
  request(type){
    if(this.runtime.diablitos?.holdsPlayer)return;
    if(type==='punch' && this.runtime.diablitos?.tryPlayerUse())return;
    this.buffer.push(type,this.runtime.frame);
  }
  begin(type,stage=0){
    const s=this.scene,airborne=this.jumpAge<ARCADE.jump.frames;this.lastCombo=null;
    if(airborne && type!=='kick')return false;
    if(type===s.character.special && (s.combatTime<s.specialReadyAt || !canSpendSpecialEnergy(s)))return false;
    let data=playerAttackData(s.character,type,stage,airborne);if(!data)return false;
    if(!airborne)data=s.vuvuzela?.attack(data)??data;
    if(this.state==='jump' && !airborne)this.transition('walk'); // landing frame: the jump state ends this same step
    this.transition(type===s.character.special?'special':'attack');
    this.action={data,index:0,displayedFrame:data.frames[0],targets:new Set(),committed:false};
    s.playerAttack={...data,start:s.combatTime,facing:s.facing,hit:false};
    this.actor.sprite.stop().setFrame(data.frames[0].pose);
    return true;
  }
  dash(dx,dy){
    // Only from states that may dash (not while grabbing, hurt, down…): an invalid transition would throw inside the game loop.
    if(this.state!=='dash' && !transitions[this.state]?.includes('dash'))return false;
    if(this.runtime.frame<this.dashReady || ['hurt','knockdown','celebration'].includes(this.state) || this.actor.z>0)return false;
    const length=Math.hypot(dx,dy)||1;this.vector=dx||dy?{x:dx/length,y:dy/length}:{x:this.scene.facing,y:0};
    this.transition('dash');this.buffer.clear();this.dashReady=this.runtime.frame+ARCADE.dash.cooldown;
    this.scene.dashUntil=this.scene.combatTime+ARCADE.dash.frames*ARCADE.clock.stepMs;
    this.scene.invulnerableUntil=this.scene.combatTime+ARCADE.dash.invulnerable*ARCADE.clock.stepMs;return true;
  }
  hurt(finisher=false){
    if(this.state==='celebration')return; // level already won
    this.lastCombo=null;
    // A combo follow-up can land while the player is already down: stay down (knockdown → hurt is not a valid transition).
    this.transition(this.scene.health<=0 || finisher || this.state==='knockdown'?'knockdown':'hurt');this.buffer.clear();
    this.actor.z=0;this.jumpAge=ARCADE.jump.frames;
    const frames=this.state==='knockdown'?ARCADE.player.knockdownFrames+ARCADE.player.wakeInvulnerable:ARCADE.player.hitInvulnerable;
    this.scene.invulnerableUntil=this.scene.combatTime+frames*ARCADE.clock.stepMs;
  }
  pose(state,age=this.age){const art=this.scene.character.animations[state];if(art?.length){const index=Math.floor(age/ARCADE.animation.walkFramesPerPose);this.actor.sprite.stop().setFrame(art[state==='walk'||state==='dash'?index%art.length:Math.min(art.length-1,index)]);}}
  move(dx,dy,multiplier=1){
    const s=this.scene,n=Math.max(1,Math.hypot(dx,dy)),speed=s.character.speed*multiplier;
    const previous={x:this.actor.x,y:this.actor.y};
    this.actor.x=clamp(this.actor.x+dx/n*speed/ARCADE.clock.fps,s.floor.left,s.floor.right);
    this.actor.y=clamp(this.actor.y+dy/n*speed*ARCADE.movement.depthRatio/ARCADE.clock.fps,s.floor.top,s.floor.bottom);
    s.chivaBonus?.resolveMovement?.(previous);
    for(const model of (this.runtime.enemies?.values()??[]))model.reversa?.resolveMovement(previous);
  }
  step(input){
    const s=this.scene,combat=this.runtime.combat;this.buffer.expire(this.runtime.frame);
    if(this.runtime.diablitos?.holdsPlayer){this.buffer.clear();s.jumpHeight=this.actor.z??0;return;}
    if(combat.frozen(this.actor))return;
    const previous={x:this.actor.x,y:this.actor.y};
    if(input.dash && this.state!=='walk' && this.state!=='jump')this.dash(input.dx,input.dy);
    if(this.jumpAge<ARCADE.jump.frames){this.jumpAge++;this.actor.z=this.jumpAge===ARCADE.jump.frames?0:Math.sin(this.jumpAge/ARCADE.jump.frames*Math.PI)*ARCADE.jump.height;}
    if(this.state==='walk'||this.state==='jump') {
      if(input.jump && this.state==='walk'){this.transition('jump');this.jumpAge=0;s.jumpStart=s.combatTime;}
      if(input.dash)this.dash(input.dx,input.dy);
      if(this.state!=='dash') {
        if(input.dx)s.facing=Math.sign(input.dx);
        this.move(input.dx,input.dy,s.boss?.status.speedMultiplier??1);
        if(this.state==='walk' && this.tryGrab(input)){s.boss?.hazards.resolveMovement(previous);s.jumpHeight=0;this.age++;return;}
        const link=this.lastCombo && this.runtime.frame-this.lastCombo.endFrame<=ARCADE.input.comboLinkFrames && this.jumpAge>=ARCADE.jump.frames?this.lastCombo:null;
        for(const type of [s.character.special,'lowKick','kick','punch'])if(this.buffer.consume(type,this.runtime.frame) && this.begin(type,link?.next===type?link.stage+1:0))break;
      }
      if(this.state==='jump' && this.jumpAge>=ARCADE.jump.frames)this.transition('walk');
      if(this.state==='walk'){if(input.dx||input.dy)this.pose('walk');else this.actor.sprite.stop().setFrame(s.character.idle);}
      if(this.state==='jump')this.actor.sprite.stop().setFrame(s.character.jump);
    } else if(this.state==='grab') {
      this.stepGrab(input);
    } else if(this.state==='dash') {
      this.move(this.vector.x,this.vector.y,ARCADE.dash.speed/s.character.speed);this.pose('dash');
      if(this.age>=ARCADE.dash.frames){this.transition('walk');s.dashUntil=0;}
    } else if(this.state==='hurt'||this.state==='knockdown') {
      this.pose(this.state==='hurt'?'hurt':'defeat');
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
      if(frame.phase==='active'){this.contact(action);action.wasActive=true;}
      else if(action.wasActive)this.resolveStrikeSound(action);
      // Combos: during the cancel window the next input of the character's chain (H,H,H · H,H,J · J,J,J) links the next strike.
      const next=frame.cancel?comboNext(s.character,data):null;
      if(next && this.buffer.consume(next,this.runtime.frame))this.begin(next,data.stage+1);
      else if(++action.index>=data.frames.length){
        this.resolveStrikeSound(action);
        const following=comboNext(s.character,data);this.lastCombo=following?{next:following,stage:data.stage,endFrame:this.runtime.frame}:null;
        this.transition(this.jumpAge<ARCADE.jump.frames?'jump':'walk');
      }
    }
    s.boss?.hazards.resolveMovement(previous);s.jumpHeight=this.actor.z??0;this.age++;
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
    if(!dir || (p.z??0)>0 || s.vuvuzela?.remaining){this.grabTouch=null;return false;}
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
        if(act.age<act.release)this.holdTarget();
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
    if(this.buffer.consume('kick',frame))g.action={kind:'throw',age:0,release:G.throwRelease,total:G.throwTotal};
    else if(this.buffer.consume('punch',frame)){
      if(back){s.facing=-s.facing;this.holdTarget();g.action={kind:'throw',age:0,release:G.throwRelease,total:G.throwTotal};} // throw backward
      else g.action={kind:'knee',age:0,hit:G.kneeHit,total:G.kneeTotal};
    }
    else if(g.age>=G.holdFrames){g.model.breakFree();this.actor.x=clamp(this.actor.x-s.facing*12,s.floor.left,s.floor.right);this.transition('walk');}
  }
  /** Leaving the grab state for any reason (hurt, reset…) lets a still-held enemy go. */
  dropGrab(){if(this.grab?.model?.state==='grabbed')this.grab.model.breakFree();this.grab=null;}
  /** Impact sound fires on the first frame a strike connects; a whoosh if the active frames end empty. */
  resolveStrikeSound(action,connected=false){
    if(action.sounded || !STRIKES.includes(action.data.type) || (!connected && !action.wasActive))return;
    action.sounded=true;this.scene.sfx?.play(strikeSound(action.data.type,connected));
  }
  contact(action){
    const s=this.scene,attack=s.playerAttack;if(!attack)return;
    if(!action.committed){
      s.vuvuzela?.commit(action);
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
      action.committed=true;attack.hit=true;
    }
    if(attack.projectile || attack.summon)return;
    this.runtime.poultry?.contact(this.actor,attack,action.targets);
    s.energyPickups?.contact(this.actor,attack,action.targets);
    for(const target of s.enemies)if(target.hp>0 && s.combatTime>=(target.invulnerableUntil??0) && !action.targets.has(target) && this.runtime.combat.touches(this.actor,target,attack)){
      action.targets.add(target);s.hitEnemy(target,attack);
    }
    const boss=s.boss;
    if(boss && !action.targets.has(boss.actor) && this.runtime.combat.touches(this.actor,boss.actor,attack)){
      action.targets.add(boss.actor);boss.hit(attack);
    }
    s.boss?.hazards.hitObstacles(attack);
    if(action.targets.size)this.resolveStrikeSound(action,true);
  }
}
