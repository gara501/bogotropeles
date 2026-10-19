import {ARCADE,toFrames} from '../data/arcade.js';
import {enemyAttackData,enemyThrowData,enemySummonData} from '../data/attacks.js';
import {ENEMY_ATTACK_SOUNDS,chargeSound} from '../audio/SoundEffects.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ENEMY_STATES=['approach','circle','windup','attack','recover','hurt','evade','heal'];
const transitions={approach:['circle','windup','hurt','heal'],circle:['approach','windup','hurt','heal','evade'],windup:['attack','recover','hurt'],attack:['recover','hurt'],recover:['windup','circle','hurt'],hurt:['approach','evade'],evade:['approach'],heal:['approach','hurt']};
export class Enemy {
  constructor(runtime,actor){this.runtime=runtime;this.scene=runtime.scene;this.actor=actor;this.state='approach';this.age=0;this.clock=0;this.ready=Math.round((ARCADE.ai.initialCooldown+(actor.slot??(actor.index??0)%ARCADE.ai.spawnSlots)*ARCADE.ai.spawnStagger)/this.scene.level.pressure);this.action=null;this.stage=0;}
  transition(state){if(state!==this.state && !transitions[this.state]?.includes(state))throw new Error(`Invalid enemy transition: ${this.state} → ${state}`);this.state=state;this.age=0;if(['circle','approach','recover','hurt'].includes(state))this.runtime.combat.tokens.release(this.actor);}
  pose(name,pose){const a=this.actor,art=a.config.animations[name];if(pose===undefined)pose=art?.[Math.floor(this.age/ARCADE.animation.walkFramesPerPose)%art.length]??a.config.idle;a.sprite.stop().setFrame(pose+(a.config.frameOffset??0));return pose;} // frameOffset: sheet row of a minion variant
  hurt(){
    const healing=this.state==='heal',heal=this.actor.config.heal;
    this.action=null;this.actor.pending=null;this.actor.tell.setVisible(false);this.rush=false;
    if(healing){this.actor.sprite.clearTint?.();this.healReady=this.clock+toFrames(heal.interruptCooldown);}
    this.transition('hurt');this.ready=this.clock+Math.round(ARCADE.ai.hurtCooldown/this.scene.level.pressure);
    const ev=this.actor.config.evade??this.cornerRule();if(!ev || this.actor.hp<=0)return;
    this.recentHits=(this.recentHits??[]).filter(frame=>this.clock-frame<=toFrames(ev.window));this.recentHits.push(this.clock);
    if(this.recentHits.length>=ev.hits){this.recentHits=[];if(this.actor.config.evade)this.startEvade();else if(this.cornered())this.startCornerEscape();}
  }
  /** Regular enemies (not bosses, minions or crossing bikes) use the corner-escape rule. */
  cornerRule(){const c=this.actor.config;return c.boss || c.minion || this.actor.crossing?null:ARCADE.cornerEscape;}
  cornered(){const a=this.actor,f=this.scene.floor,e=ARCADE.cornerEscape.edge;return a.x-f.left<=e || f.right-a.x<=e;}
  /** Trapped against a screen side: leap over the player and land on the open side, out of the corner. */
  startCornerEscape(){
    const a=this.actor,s=this.scene,rule=ARCADE.cornerEscape,f=s.floor;
    const side=a.x-f.left<=f.right-a.x?1:-1; // left wall → land to the right of the player, and vice versa
    const target=clamp(s.player.x+side*rule.land,f.left+20,f.right-20);
    this.transition('evade');this.runtime.combat.tokens.release(a);a.pending=null;a.tell.setVisible(false);
    a.facing=-side;a.sprite.setFlipX(a.facing<0); // faces the player once it lands
    const art=a.config.animations;
    this.evade={dir:Math.sign(target-a.x)||side,frames:toFrames(rule.duration),distance:Math.abs(target-a.x),height:rule.height,
      pose:art.jump?.[1]??art.walk?.[1]??a.config.idle??0,escape:true};
    a.invulnerableUntil=s.combatTime+rule.duration;
  }
  /** Boss escape: a backwards hop away from the player, invulnerable until it lands. */
  startEvade(){
    const a=this.actor,s=this.scene,ev=a.config.evade;this.transition('evade');this.runtime.combat.tokens.release(a);
    a.facing=Math.sign(s.player.x-a.x)||a.facing;a.sprite.setFlipX(a.facing<0);
    this.evade={dir:-a.facing,frames:toFrames(ev.duration)};a.invulnerableUntil=s.combatTime+ev.duration;
    if(ev.stain)s.paintStain?.(a.x,a.y,ev.stain,a); // takeoff mark
  }
  move(dx,dy,speed=this.actor.config.speed){const a=this.actor,n=Math.max(1,Math.hypot(dx,dy));a.x=clamp(a.x+dx/n*speed/ARCADE.clock.fps,this.scene.floor.left,this.scene.floor.right);a.y=clamp(a.y+dy/n*speed*ARCADE.ai.depthRatio/ARCADE.clock.fps,this.scene.floor.top,this.scene.floor.bottom);}
  begin(forceMelee=false){
    const a=this.actor,s=this.scene;if(!this.runtime.combat.tokens.acquire(a))return false;this.rush=false;
    a.facing=Math.sign(s.player.x-a.x)||1;a.pending={enemy:a,connected:false,finisher:false};this.stage=0;
    // Never start a charge from outside the floor span (e.g. still walking in): it would pin itself to the edge.
    const inside=a.x>=s.floor.left && a.x<=s.floor.right,wantsCharge=!forceMelee && a.config.charge && (!a.config.melee || Math.abs(s.player.x-a.x)>a.config.range);
    if(wantsCharge && !inside){this.runtime.combat.tokens.release(a);a.pending=null;return false;} // walk in first
    if(wantsCharge){
      a.pending.finisher=true;
      this.action={charge:true,windup:a.config.charge.frames?.startup??toFrames(a.config.charge.windup),activePoses:a.config.charge.frames?.activePoses??a.config.animations.rush,remaining:a.config.charge.distance,hit:false};
      a.tell.setText('¡CARGA!').setVisible(true);this.transition('windup');
    }else this.beginStage();return true;
  }
  beginStage(){
    const a=this.actor;
    if(!this.runtime.combat.tokens.acquire(a)){this.action=null;a.pending=null;this.transition('circle');return;}
    this.action={data:enemyAttackData(a.config,this.stage),index:0,hit:false};
    a.pending.finisher=this.action.data.finisher;a.tell.setText(a.config.combo?'! ×3':'!').setVisible(true);this.transition('windup');
  }
  hitPlayer(attack){
    const s=this.scene,a=this.actor;
    if(this.action.hit || !this.runtime.combat.touches(a,s.player,{...attack,facing:a.facing}))return;
    this.action.hit=true;
    if(s.hitPlayer(attack.damage,a.pending)){
      a.pending.connected=true;this.runtime.combat.push(s.player,{...attack,facing:a.facing});this.runtime.combat.impact(a,s.player,attack);
    }
  }
  step(){
    const s=this.scene,a=this.actor,combat=this.runtime.combat;if(a.hp<=0){combat.tokens.release(a);return;}
    if(combat.frozen(a))return;
    this.clock++;this.age++;
    if(this.state==='heal'){
      const h=a.config.heal,startup=toFrames(h.windup),total=startup+toFrames(h.duration);
      if(this.age<startup)this.pose('heal',h.startPoses[Math.min(h.startPoses.length-1,Math.floor(this.age/startup*h.startPoses.length))]);
      else {
        this.pose('heal',h.pose);a.hp=Math.min(a.config.hp,a.hp+a.config.hp*h.perSecond/ARCADE.clock.fps);
        if(Math.floor(this.age/8)%2)a.sprite.setTint?.(0xa8ffb0);else a.sprite.clearTint?.();
      }
      if(this.age>=total){a.sprite.clearTint?.();a.tell.setVisible(false);this.healReady=this.clock+toFrames(h.cooldown);this.transition('approach');}
      return;
    }
    if(this.state==='evade'){
      const ev=a.config.evade??{},p=this.evade,t=Math.min(1,this.age/p.frames);
      a.x=clamp(a.x+p.dir*(p.distance??ev.distance)/p.frames,s.floor.left,s.floor.right);a.z=Math.sin(t*Math.PI)*(p.height??ev.height);
      this.pose('evade',p.pose??(ev.poses?ev.poses[Math.min(ev.poses.length-1,Math.floor(t*ev.poses.length))]:ev.pose));
      if(this.age>=p.frames){a.z=0;this.evade=null;if(ev.stain)s.paintStain?.(a.x,a.y,ev.stain,a); // landing mark
        // Summoners call a wave instead of rushing back in; a cornered enemy that escaped just regroups.
        if(ev.summonAfter){this.summonReady=0;this.rush=false;}else this.rush=!p.escape;
        this.ready=this.clock;this.transition('approach');}
      return;
    }
    if(this.state==='hurt'){
      this.pose('hurt');if(this.age>=ARCADE.attack.stun)this.transition('approach');return;
    }
    if(this.action?.charge){
      const p=this.action,c=a.config.charge;
      if(this.state==='windup'){
        this.pose('prepare');if(this.age>=p.windup){this.transition('attack');a.tell.setVisible(false);s.sfx?.play(chargeSound(a.key));}
      }else if(this.state==='attack'){
        const previous=a.x,step=Math.min(p.remaining,c.speed/ARCADE.clock.fps);
        a.x=clamp(a.x+a.facing*step,s.floor.left,s.floor.right);p.remaining-=Math.abs(a.x-previous);const pose=this.pose('rush');
        const sweep={x:(previous+a.x)/2,y:a.y},attack={damage:a.config.damage,facing:a.facing,range:Math.abs(a.x-previous)/2+ARCADE.ai.chargeHalfWidth,lane:ARCADE.body.lane,finisher:true};
        if(!p.hit && p.activePoses.includes(pose) && combat.touches(sweep,s.player,attack)){
          p.hit=true;if(s.hitPlayer(attack.damage,a.pending)){a.pending.connected=true;combat.push(s.player,attack);combat.impact(a,s.player,attack);}
        }
        // Ends when the distance is run, when it can't advance any further (a screen side), or after a safety timeout.
        p.frames=(p.frames??0)+1;
        const blocked=Math.abs(a.x-previous)<.01,timeout=p.frames>Math.ceil(c.distance/c.speed*ARCADE.clock.fps)+30;
        if(p.remaining<=0 || blocked || timeout){this.transition('recover');this.recovery=c.frames?.recovery??toFrames(c.recovery);}
      }else {
        this.pose('brake');if(this.age>=this.recovery)this.finish(toFrames(c.cooldown/s.level.pressure));
      }
      return;
    }
    if(this.action){
      const p=this.action,frame=p.data.frames[p.index];this.pose('attack',frame.pose);
      if(frame.phase==='active'){
        if(this.state!=='attack'){
          this.transition('attack');a.tell.setVisible(false);
          const sound=ENEMY_ATTACK_SOUNDS[a.key];if(sound)s.sfx?.play(sound);
        }
        if(p.summon){if(!p.hit){p.hit=true;s.summonMinions?.(a,a.config.summon);}}
        else if(p.throw){if(!p.hit){p.hit=true;s.throwProjectile(a,a.facing,a.config.throw,p.data.damage);}}
        else if(a.config.ranged){if(!p.hit){p.hit=true;s.throwKnife(a,a.facing);}}else this.hitPlayer(p.data);
        if(a.config.paint && !p.throw && !p.summon && !p.painted){p.painted=true;s.paintFloor?.(a,a.facing,a.config.paint);}
      } else if(frame.phase==='recovery' && this.state!=='recover')this.transition('recover');
      if(++p.index>=p.data.frames.length){
        if(p.throw||p.summon)this.finish(Math.round(ARCADE.ai.initialCooldown/s.level.pressure));
        else if(a.config.combo && this.stage<ARCADE.ai.comboStages-1 && (!a.config.combo.confirmFirst || a.pending.connected)){this.stage++;this.beginStage();}
        else this.finish(a.config.combo?toFrames(a.config.combo.cooldown/s.level.pressure):Math.round((a.config.attackFrames?.cooldown??ARCADE.ai.cooldown)/s.level.pressure));
        // Painters hop back out of a player who stays on top of them after the spray.
        const ev=a.config.evade;if(ev?.afterAttack && !p.throw && !p.summon && this.state==='circle' && Math.abs(s.player.x-a.x)<ev.afterAttack)this.startEvade();
      }
      return;
    }
    const dx=s.player.x-a.x,dy=s.player.y-a.y,range=a.config.charge?.triggerRange??a.config.range;
    // Still outside the floor span (walking in from off-screen): step inside before anything else.
    if(a.x<s.floor.left || a.x>s.floor.right){this.move(a.x<s.floor.left?1:-1,0);this.pose('walk');return;}
    this.face(dx);
    // Shielded bosses only strike forward: a player behind them is safe until they turn around.
    const inRange=Math.abs(dx)<=range && Math.abs(dy)<ARCADE.body.lane && this.facesPlayer(dx);
    if(this.canSummon() && this.beginSummon())return;
    if(inRange && this.clock>=this.ready && this.begin())return;
    if(!inRange && !this.rush && this.canHeal(dx) && this.beginHeal())return;
    if(!inRange && !this.rush && this.facesPlayer(dx) && this.canThrow(dx,dy) && this.beginThrow())return;
    if(combat.tokens.owners.size>=combat.tokens.limit || this.clock<this.ready){
      if(this.state!=='circle')this.transition('circle');
      let side=(a.index??0)%2?1:-1;const slot=(a.index??0)%3-1;
      // Thrower bosses wait out of knife range while their ball is ready, then throw; otherwise they close in.
      const t=a.config.throw,keep=t && this.clock>=(this.throwReady??0)-ARCADE.ai.initialCooldown?t.minRange+40:a.config.keepDistance??a.config.range+ARCADE.ai.circleX;
      // Bosses that keep their distance stay on their current side, switching only when it has no room.
      if(a.config.boss && a.config.keepDistance){side=Math.sign(a.x-s.player.x)||1;const want=s.player.x+side*keep;if(want<s.floor.left||want>s.floor.right)side=-side;}
      const tx=clamp(s.player.x+side*keep,s.floor.left,s.floor.right);
      const ty=clamp(s.player.y+slot*ARCADE.ai.circleY,s.floor.top,s.floor.bottom);
      const mx=Math.abs(tx-a.x)>ARCADE.ai.alignY?Math.sign(tx-a.x):0,my=Math.abs(ty-a.y)>ARCADE.ai.alignY?Math.sign(ty-a.y):0;
      this.move(mx,my,a.config.speed*ARCADE.ai.circleSpeed);if(mx||my)this.pose('walk');else this.pose('idle',a.config.idle);return;
    }
    if(this.state!=='approach')this.transition('approach');
    const desired=a.config.keepDistance??a.config.range-ARCADE.body.halfWidth;
    // After an evade the boss runs straight back in (faster) for the knife combo.
    this.move(Math.abs(dx)>desired?Math.sign(dx):0,Math.abs(dy)>ARCADE.ai.alignY?Math.sign(dy):0,a.config.speed*(this.rush?a.config.evade?.rushSpeed??1:1));this.pose('walk');
  }
  /** Turn toward the player; shield bearers (config.shield.turnMs) take a while to turn around. */
  face(dx){
    const a=this.actor,side=Math.sign(dx)||a.facing,turn=a.config.shield?.turnMs;
    if(turn && a.facing!=null && side!==a.facing){
      this.behindSince??=this.clock;
      if(this.clock-this.behindSince<toFrames(turn))return;
    }
    this.behindSince=null;a.facing=side;a.sprite.setFlipX(a.facing<0);
  }
  facesPlayer(dx){return !this.actor.config.shield || (Math.sign(dx)||this.actor.facing)===this.actor.facing;}
  /** Summoner bosses: call a wave when the cooldown allows and few of their minions are still up. */
  canSummon(){
    const a=this.actor,m=a.config.summon;if(!m || this.clock<this.ready)return false;
    this.summonReady??=toFrames(m.first??0);
    return this.clock>=this.summonReady && this.scene.enemies.filter(e=>e.hp>0 && e.summoner===a).length<m.maxAlive;
  }
  beginSummon(){
    const a=this.actor,s=this.scene;this.runtime.combat.tokens.release(a);a.pending=null;this.stage=0;
    a.facing=Math.sign(s.player.x-a.x)||a.facing;a.sprite.setFlipX(a.facing<0);
    this.action={data:enemySummonData(a.config),index:0,hit:false,summon:true};
    this.summonReady=this.clock+Math.round(toFrames(a.config.summon.cooldown)/s.level.pressure);
    a.tell.setText('!!').setVisible(true);this.transition('windup');return true;
  }
  /** Healer bosses: when hurt enough and the player keeps away, start the ritual. */
  canHeal(dx){
    const a=this.actor,h=a.config.heal;
    return Boolean(h) && a.hp>0 && a.hp<a.config.hp*h.below && Math.abs(dx)>=h.minDistance && this.clock>=(this.healReady??0);
  }
  beginHeal(){
    const a=this.actor;this.runtime.combat.tokens.release(a);a.pending=null;this.action=null;
    a.tell.setText('+').setVisible(true);this.scene.sfx?.play('spell');this.transition('heal');return true;
  }
  /** Thrower bosses: ranged attack only from mid distance, roughly aligned in depth, on its own cooldown. */
  canThrow(dx,dy){
    const t=this.actor.config.throw;
    return Boolean(t) && this.clock>=this.ready && this.clock>=(this.throwReady??0) && Math.abs(dx)>=t.minRange && Math.abs(dx)<=t.maxRange && Math.abs(dy)<ARCADE.body.lane;
  }
  beginThrow(){
    const a=this.actor,s=this.scene;if(!this.runtime.combat.tokens.acquire(a))return false;
    a.facing=Math.sign(s.player.x-a.x)||1;a.sprite.setFlipX(a.facing<0);a.pending={enemy:a,connected:false,finisher:false};this.stage=0;
    this.action={data:enemyThrowData(a.config,s.level.damage??1),index:0,hit:false,throw:true};
    this.throwReady=this.clock+Math.round(toFrames(a.config.throw.cooldown)/s.level.pressure);
    a.tell.setText('!').setVisible(true);this.transition('windup');return true;
  }
  finish(cooldown){this.action=null;this.actor.pending=null;this.ready=this.clock+cooldown;this.transition('circle');}
}
