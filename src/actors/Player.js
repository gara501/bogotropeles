import {ARCADE} from '../data/arcade.js';
import {playerAttackData,comboNext} from '../data/attacks.js';
import {InputBuffer} from '../input/InputBuffer.js';
import {canSpendSpecialEnergy,spendSpecialEnergy} from '../combat/specialEnergy.js';
import {strikeSound} from '../audio/SoundEffects.js';
// Strikes that choose their sound by result (hit → punch/kick, miss → wave) once the active frames end.
const STRIKES=['punch','kick','lowKick'];

export const PLAYER_STATES=['walk','attack','special','jump','hurt','knockdown','dash','celebration'];
const transitions={walk:['attack','special','jump','hurt','knockdown','dash','celebration'],jump:['walk','attack','hurt','knockdown','celebration'],
  attack:['walk','attack','jump','hurt','knockdown','dash','celebration'],special:['walk','hurt','knockdown','dash','celebration'],
  hurt:['walk','knockdown','celebration'],knockdown:['walk','knockdown','celebration'],dash:['walk','hurt','knockdown','celebration'],celebration:[]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Player {
  constructor(runtime){this.runtime=runtime;this.scene=runtime.scene;this.buffer=new InputBuffer();this.reset();}
  get actor(){return this.scene.player;}
  reset(){this.state='walk';this.age=0;this.action=null;this.jumpAge=ARCADE.jump.frames;this.dashReady=0;this.buffer.clear();if(this.actor)this.actor.z=0;}
  transition(state){if(state!==this.state && !transitions[this.state]?.includes(state))throw new Error(`Invalid player transition: ${this.state} → ${state}`);this.state=state;this.age=0;if(!['attack','special'].includes(state)){this.action=null;this.scene.playerAttack=null;}}
  request(type){this.buffer.push(type,this.runtime.frame);}
  begin(type,stage=0){
    const s=this.scene,airborne=this.jumpAge<ARCADE.jump.frames;this.lastCombo=null;
    if(airborne && type!=='kick')return false;
    if(type===s.character.special && (s.combatTime<s.specialReadyAt || !canSpendSpecialEnergy(s)))return false;
    const data=playerAttackData(s.character,type,stage,airborne);if(!data)return false;
    this.transition(type===s.character.special?'special':'attack');
    this.action={data,index:0,displayedFrame:data.frames[0],targets:new Set(),committed:false};
    s.playerAttack={...data,start:s.combatTime,facing:s.facing,hit:false};
    this.actor.sprite.stop().setFrame(data.frames[0].pose);
    return true;
  }
  dash(dx,dy){
    if(this.runtime.frame<this.dashReady || ['hurt','knockdown','celebration'].includes(this.state) || this.actor.z>0)return false;
    const length=Math.hypot(dx,dy)||1;this.vector=dx||dy?{x:dx/length,y:dy/length}:{x:this.scene.facing,y:0};
    this.transition('dash');this.buffer.clear();this.dashReady=this.runtime.frame+ARCADE.dash.cooldown;
    this.scene.dashUntil=this.scene.combatTime+ARCADE.dash.frames*ARCADE.clock.stepMs;
    this.scene.invulnerableUntil=this.scene.combatTime+ARCADE.dash.invulnerable*ARCADE.clock.stepMs;return true;
  }
  hurt(finisher=false){
    this.lastCombo=null;
    this.transition(this.scene.health<=0 || finisher?'knockdown':'hurt');this.buffer.clear();
    this.actor.z=0;this.jumpAge=ARCADE.jump.frames;
    const frames=this.state==='knockdown'?ARCADE.player.knockdownFrames+ARCADE.player.wakeInvulnerable:ARCADE.player.hitInvulnerable;
    this.scene.invulnerableUntil=this.scene.combatTime+frames*ARCADE.clock.stepMs;
  }
  pose(state,age=this.age){const art=this.scene.character.animations[state];if(art?.length){const index=Math.floor(age/ARCADE.animation.walkFramesPerPose);this.actor.sprite.stop().setFrame(art[state==='walk'||state==='dash'?index%art.length:Math.min(art.length-1,index)]);}}
  move(dx,dy,multiplier=1){
    const s=this.scene,n=Math.max(1,Math.hypot(dx,dy)),speed=s.character.speed*multiplier;
    this.actor.x=clamp(this.actor.x+dx/n*speed/ARCADE.clock.fps,s.floor.left,s.floor.right);
    this.actor.y=clamp(this.actor.y+dy/n*speed*ARCADE.movement.depthRatio/ARCADE.clock.fps,s.floor.top,s.floor.bottom);
  }
  step(input){
    const s=this.scene,combat=this.runtime.combat;this.buffer.expire(this.runtime.frame);
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
        const link=this.lastCombo && this.runtime.frame-this.lastCombo.endFrame<=ARCADE.input.comboLinkFrames && this.jumpAge>=ARCADE.jump.frames?this.lastCombo:null;
        for(const type of [s.character.special,'lowKick','kick','punch'])if(this.buffer.consume(type,this.runtime.frame) && this.begin(type,link?.next===type?link.stage+1:0))break;
      }
      if(this.state==='jump' && this.jumpAge>=ARCADE.jump.frames)this.transition('walk');
      if(this.state==='walk'){if(input.dx||input.dy)this.pose('walk');else this.actor.sprite.stop().setFrame(s.character.idle);}
      if(this.state==='jump')this.actor.sprite.stop().setFrame(s.character.jump);
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
  /** Impact sound fires on the first frame a strike connects; a whoosh if the active frames end empty. */
  resolveStrikeSound(action,connected=false){
    if(action.sounded || !STRIKES.includes(action.data.type) || (!connected && !action.wasActive))return;
    action.sounded=true;this.scene.sfx?.play(strikeSound(action.data.type,connected));
  }
  contact(action){
    const s=this.scene,attack=s.playerAttack;if(!attack)return;
    if(!action.committed){
      if(attack.type==='iphone'){action.committed=true;s.iphone?.release(attack);return;}
      if(attack.type==='books'){action.committed=true;s.books?.summon(attack);return;}
      if(attack.type===s.character.special){
        if(!spendSpecialEnergy(s)){this.transition('walk');return;}
        if(attack.cooldown)s.specialReadyAt=s.combatTime+attack.cooldown;
        s.sfx?.play(attack.sound??(attack.type==='headset'?'whip':'stomp'));
        if(attack.type==='stomp')this.runtime.combat.groundImpact(this.actor);
      }
      action.committed=true;attack.hit=true;
    }
    if(attack.projectile || attack.summon)return;
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
