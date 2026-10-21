import {ARCADE,toFrames} from '../data/arcade.js';
import {LeapingBite} from './LeapingBite.js';
import {SackSpin} from './SackSpin.js';
import {enemyAttackData,enemyThrowData,enemySummonData,enemyFlockData} from '../data/attacks.js';
import {ENEMY_ATTACK_SOUNDS,BOSS_SOUNDS,chargeSound} from '../audio/SoundEffects.js';
import {ShieldBreakPhase} from './ShieldBreakPhase.js';
import {BrayatanController,BRAYATAN_STATES} from './BrayatanController.js';
import {PachoController,PACHO_STATES} from './PachoController.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ENEMY_STATES=['approach','circle','windup','attack','recover','hurt','evade','heal','grabbed','thrown','down','shield','phaseChange','bombRun'];
// grabbed: held by the player · thrown: flying after a throw · down: knocked down on the floor, then getting up.
const transitions={approach:['circle','windup','hurt','heal','grabbed','down','evade'],circle:['approach','windup','hurt','heal','evade','grabbed','down'],
  windup:['attack','recover','hurt','grabbed','down'],attack:['recover','hurt','down'],recover:['windup','circle','hurt','grabbed','down','evade','shield'],
  hurt:['approach','evade','grabbed','down'],evade:['approach'],heal:['approach','hurt','down'],
  grabbed:['hurt','thrown','down','approach'],thrown:['down','hurt'],down:['approach','hurt'],shield:['circle'],phaseChange:['circle'],bombRun:['circle','hurt']};
for(const [state,next] of Object.entries(transitions))if(state!=='phaseChange')next.push('phaseChange');
transitions.approach.push('bombRun');transitions.circle.push('bombRun');
ENEMY_STATES.push(...BRAYATAN_STATES);
for(const state of BRAYATAN_STATES)transitions[state]=['hurt','recover','approach','rage',...BRAYATAN_STATES.filter(next=>next!==state)];
transitions.approach.push(...BRAYATAN_STATES);transitions.circle.push(...BRAYATAN_STATES);
ENEMY_STATES.push(...PACHO_STATES);
for(const state of PACHO_STATES)transitions[state]=['hurt','recover','approach',...PACHO_STATES.filter(next=>next!==state)];
transitions.approach.push(...PACHO_STATES);transitions.circle.push(...PACHO_STATES);
export class Enemy {
  constructor(runtime,actor){this.runtime=runtime;this.scene=runtime.scene;this.actor=actor;this.state='approach';this.age=0;this.clock=0;this.ready=Math.round((ARCADE.ai.initialCooldown+(actor.slot??(actor.index??0)%ARCADE.ai.spawnSlots)*ARCADE.ai.spawnStagger)/this.scene.level.pressure);this.action=null;this.stage=0;}
  transition(state){if(state!==this.state && !transitions[this.state]?.includes(state))throw new Error(`Invalid enemy transition: ${this.state} → ${state}`);if(this.state==='grabbed' && state!=='grabbed')this.endStruggle();this.state=state;this.age=0;if(['circle','approach','recover','hurt'].includes(state))this.runtime.combat.tokens.release(this.actor);}
  pose(name,pose){const a=this.actor,art=a.config.animations[name];if(pose===undefined)pose=art?.[Math.floor(this.age/ARCADE.animation.walkFramesPerPose)%art.length]??a.config.idle;a.sprite.stop().setFrame(pose+(a.config.frameOffset??0));return pose;} // frameOffset: sheet row of a minion variant
  hurt(attack=null){
    if(this.actor.arriving || this.actor.sackSpinning)return;
    this.sackSpin?.interrupt();
    this.action?.leap?.cancel();
    if(this.actor.config.pacho){this.pacho??=new PachoController(this);this.pacho.hurt(attack);return;}
    if(this.actor.config.brayatan){this.brayatan??=new BrayatanController(this);this.brayatan.hurt(attack);return;}
    if(this.checkShieldPhase())return;
    if(this.state==='bombRun')this.shieldPhase.interrupt();
    if(this.state==='grabbed' && attack?.grab)return; // knees: it stays held
    if(this.state==='down' || this.state==='shield' || (this.state==='thrown' && !attack?.landing))return; // shield: invincible
    const healing=this.state==='heal',heal=this.actor.config.heal;
    this.action=null;this.actor.pending=null;this.actor.tell.setVisible(false);this.rush=false;
    if(healing){this.actor.sprite.clearTint?.();this.healReady=this.clock+toFrames(heal.interruptCooldown);}
    if(this.cornerHit())return; // cornered: leaps out instead of taking the rest of the combo
    // Third strike of a combo, a throw landing or being hit by a thrown body: knocked down.
    if((attack?.knockdown || (attack?.combo && attack?.finisher)) && this.canKnockdown()){this.knockdown(attack);return;}
    this.transition('hurt');this.ready=this.clock+Math.round(ARCADE.ai.hurtCooldown/this.scene.level.pressure);
    const ev=this.actor.config.evade;if(!ev || this.actor.hp<=0)return; // bosses with their own evade rule
    this.recentHits=(this.recentHits??[]).filter(frame=>this.clock-frame<=toFrames(ev.window));this.recentHits.push(this.clock);
    if(this.recentHits.length>=ev.hits){this.recentHits=[];this.startEvade();}
  }
  /** Corner rule (regular enemies): counts hits taken near a screen side; on the `hits`-th one it leaps out. */
  cornerHit(){
    if(this.sackSpin?.phase==='dizzy')return false;
    const rule=this.cornerRule();if(!rule || this.actor.hp<=0)return false;
    if(!this.cornered()){this.cornerHits=[];return false;}
    this.cornerHits=(this.cornerHits??[]).filter(frame=>this.clock-frame<=toFrames(rule.window));this.cornerHits.push(this.clock);
    if(this.cornerHits.length<rule.hits)return false;
    this.cornerHits=[];if(this.state!=='hurt')this.transition('hurt');this.startCornerEscape();return true;
  }
  canKnockdown(){const a=this.actor;return a.hp>0 && !a.config.boss && !a.crossing;}
  /** Falls, lies on the floor and gets up; invulnerable the whole time (as in Final Fight). */
  knockdown(attack=null){
    const a=this.actor,s=this.scene,k=ARCADE.knockdown;
    // The hit already pushed it back in one jump; replay that push as a slide over the fall instead.
    const pushed=attack?.knockback && !attack.landing?(attack.facing||1)*attack.knockback:0;
    const to=a.x,from=Math.max(s.floor.left,Math.min(s.floor.right,a.x-pushed));
    this.transition('down');this.runtime.combat.tokens.release(a);a.z=0;a.x=from;
    this.down={fall:k.fall,lie:k.lie,getup:k.getup,total:k.fall+k.lie+k.getup,from,to,arc:attack?.landing?0:k.arc,landed:false};
    a.invulnerableUntil=s.combatTime+this.down.total*ARCADE.clock.stepMs;
  }
  /** Acrobats (config.dodge): a strike started close by may make them hop to the player's other side. */
  tryDodge(){
    const a=this.actor,s=this.scene,d=a.config.dodge,attack=s.playerAttack;
    if(!d || !attack || attack===this.dodgedAttack || this.clock<(this.dodgeReady??0) || a.hp<=0)return false;
    this.dodgedAttack=attack;
    if(Math.abs(s.player.x-a.x)>d.range || Math.abs(s.player.y-a.y)>=ARCADE.body.lane || (Math.random?.()??0)>=d.chance)return false;
    const side=Math.sign(a.x-s.player.x)||1,target=clamp(s.player.x-side*d.distance,s.floor.left+20,s.floor.right-20);
    this.transition('evade');this.runtime.combat.tokens.release(a);a.pending=null;a.tell.setVisible(false);this.action=null;
    this.evade={dir:Math.sign(target-a.x)||-side,frames:toFrames(d.duration),distance:Math.abs(target-a.x),height:d.height,poses:d.poses,escape:true};
    a.facing=side;a.sprite.setFlipX(a.facing<0);a.invulnerableUntil=s.combatTime+d.duration;
    this.dodgeReady=this.clock+toFrames(d.cooldown);this.ready=this.clock+toFrames(d.duration)+8; // strikes right after landing
    return true;
  }
  /** Can the player grab it right now? Regular enemies on the ground, not mid-strike, charge, hop or fall. */
  grabbable(){
    const a=this.actor,c=a.config;
    return a.hp>0 && !a.arriving && !c.boss && c.grabbable!==false && !a.crossing && (a.z??0)===0 && this.scene.combatTime>=(a.invulnerableUntil??0) &&
      ['approach','circle','windup','recover','hurt'].includes(this.state) && !this.action?.charge;
  }
  seize(){
    this.sackSpin?.interrupt();
    const a=this.actor;this.action=null;a.pending=null;a.tell.setVisible(false);this.rush=false;
    this.transition('grabbed');this.runtime.combat.tokens.release(a);
  }
  /** Held by the player: loops its struggle sheet (`<key>-struggle` texture, see STRUGGLE_SHEET). False if it has none. */
  struggle(){
    const poses=this.actor.config.animations.struggle;
    if(poses?.length){this.pose('struggle',poses[Math.floor(this.age/ARCADE.grab.struggleFramesPerPose)%poses.length]);return true;}
    const a=this.actor,key=`${a.key}-struggle`,textures=this.scene.textures;
    if(!a.config.struggle || !textures?.exists?.(key) || !a.sprite?.setTexture)return false;
    if(a.sprite.texture?.key!==key){
      const base=a.config.height/textures.get(a.key).referenceHeight;
      a.sprite.stop().setTexture(key,0).setScale(base*(a.config.struggle.scale??1));
    }
    a.sprite.setFrame(Math.floor(this.age/ARCADE.grab.struggleFramesPerPose)%6);return true;
  }
  /** Back to the main sheet (and its scale) when the hold ends. */
  endStruggle(){
    const a=this.actor,textures=this.scene.textures;
    if(a.sprite?.texture?.key!==`${a.key}-struggle` || !textures?.exists?.(a.key))return;
    a.sprite.setTexture(a.key,a.config.idle??0).setScale(a.config.height/textures.get(a.key).referenceHeight);
  }
  /** Held too long: it shakes the player off. */
  breakFree(){if(this.state!=='grabbed')return;this.transition('hurt');this.ready=this.clock+Math.round(ARCADE.ai.hurtCooldown/this.scene.level.pressure);}
  startThrown(dir,damage){
    const a=this.actor,s=this.scene,g=ARCADE.grab;
    this.transition('thrown');this.thrown={dir,damage,frames:g.throwFrames,distance:g.throwDistance,height:g.throwHeight,hit:new Set()};
    a.facing=-dir;a.sprite.setFlipX(a.facing<0);a.invulnerableUntil=s.combatTime+g.throwFrames*ARCADE.clock.stepMs+50;
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
  move(dx,dy,speed=this.actor.config.speed){const a=this.actor,n=Math.max(1,Math.hypot(dx,dy));if(this.barragePhase())speed*=a.config.barrage.speedMultiplier;a.x=clamp(a.x+dx/n*speed/ARCADE.clock.fps,this.scene.floor.left,this.scene.floor.right);a.y=clamp(a.y+dy/n*speed*ARCADE.ai.depthRatio/ARCADE.clock.fps,this.scene.floor.top,this.scene.floor.bottom);}
  begin(forceMelee=false){
    if(this.actor.config.sackSpin)return (this.sackSpin??=new SackSpin(this)).begin();
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
    a.pending.finisher=this.action.data.finisher;a.tell.setText(a.config.leap?'¡MORDIDA!':a.config.combo?`! ×${a.config.combo.stages??ARCADE.ai.comboStages}`:'!').setVisible(true);this.transition('windup');
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
    const s=this.scene,a=this.actor,combat=this.runtime.combat;if(a.hp<=0){combat.tokens.release(a);this.sackSpin?.clear();this.endStruggle();return;}
    if(a.arriving)return;
    this.checkShieldPhase();
    if(combat.frozen(a))return;
    this.clock++;this.age++;
    if(this.sackSpin?.step())return;
    if(a.config.pacho){this.pacho??=new PachoController(this);this.pacho.step();return;}
    if(a.config.brayatan){this.brayatan??=new BrayatanController(this);this.brayatan.step();return;}
    if(this.shieldPhase?.step())return;
    if(this.state==='grabbed'){if(!this.struggle())this.pose('hurt',a.config.animations.hurt?.[0]??a.config.idle);return;} // the player positions it
    if(this.state==='thrown'){
      const t=this.thrown,g=ARCADE.grab,art=a.config.animations.defeat??a.config.animations.hurt;
      a.x=clamp(a.x+t.dir*t.distance/t.frames,s.floor.left,s.floor.right);a.z=Math.sin(Math.min(1,this.age/t.frames)*Math.PI)*t.height;
      this.pose('defeat',art[0]);
      // The flying body bowls over anyone in its way.
      for(const other of s.enemies)if(other!==a && other.hp>0 && !t.hit.has(other) && !other.crossing && Math.abs(other.x-a.x)<44 && Math.abs(other.y-a.y)<ARCADE.body.lane &&
        s.combatTime>=(other.invulnerableUntil??0)){
        t.hit.add(other);s.hitEnemy(other,{damage:g.collideDamage,knockback:ARCADE.knockdown.knockback,facing:t.dir,stun:300,knockdown:true,finisher:true,lane:ARCADE.body.lane});s.sfx?.play('kick');
      }
      if(this.age>=t.frames){
        a.z=0;a.invulnerableUntil=0;s.sfx?.play('stomp');
        s.hitEnemy(a,{damage:t.damage,knockback:8,facing:t.dir,stun:300,knockdown:true,finisher:true,landing:true,lane:ARCADE.body.lane});
        if(a.hp>0 && this.state==='thrown')this.knockdown();
      }
      return;
    }
    if(this.state==='down'){
      const d=this.down,art=a.config.animations.defeat??a.config.animations.hurt;
      if(this.age<d.fall){
        // Thrown back along a short arc, easing out.
        const t=this.age/d.fall,e=1-(1-t)**2;
        a.x=d.from+(d.to-d.from)*e;a.z=Math.sin(t*Math.PI)*d.arc;
        this.pose('defeat',art[Math.min(art.length-1,Math.floor(t*art.length))]);
      }else if(!d.landed){
        // Hits the floor: thud, dust ring and a little bounce of the screen.
        d.landed=true;a.x=d.to;a.z=0;s.sfx?.play('stomp');this.runtime.combat.groundImpact(a);s.cameras?.main?.shake?.(60,.002);
      }
      if(this.age>=d.fall && this.age<d.fall+d.lie)this.pose('defeat',art.at(-1));
      else if(this.age>=d.fall+d.lie)this.pose('getup',a.config.animations.getup?.[0]??a.config.animations.hurt?.[0]??a.config.idle); // getting up
      if(this.age>=d.total){a.invulnerableUntil=0;this.ready=this.clock+Math.round(ARCADE.ai.hurtCooldown/s.level.pressure);this.transition('approach');
        // Getting up in a corner with the player on top of it: leap straight out.
        const rule=this.cornerRule();if(rule && a.hp>0 && this.cornered() && Math.abs(s.player.x-a.x)<=rule.getupRange){this.cornerHits=[];this.startCornerEscape();}}
      return;
    }
    if(this.state==='shield'){
      const c=a.config.pigeonShield,cycle=toFrames(c.interval),t=this.age%cycle;
      a.invulnerableUntil=s.combatTime+ARCADE.clock.stepMs*2;
      a.sprite.setTint?.(c.colors[Math.floor(this.age/4)%c.colors.length]); // multicolour glow while invincible
      this.face(s.player.x-a.x);this.pose('throw',c.throwPoses[Math.min(c.throwPoses.length-1,Math.floor(t/cycle*c.throwPoses.length))]);
      if(t===Math.floor(cycle*c.release)){
        const throwCfg=a.config.throw;s.throwProjectile(a,a.facing,throwCfg,Math.max(1,Math.round(throwCfg.damage*(s.level.damage??1))));
        // Aimed at the player's lane, give or take: stepping out of the line of fire is how to dodge them.
        const pigeon=s.projectiles?.at(-1);
        if(pigeon?.owner===a){pigeon.y=clamp(s.player.y+(Math.random()*2-1)*c.laneSpread,s.floor.top,s.floor.bottom);pigeon.sprite.y=pigeon.y-(throwCfg.lift??70);pigeon.sprite.setDepth?.(pigeon.y+1);}
        const voice=BOSS_SOUNDS[a.key];if(voice?.throw && this.age<cycle)s.sfx?.play(voice.throw);
      }
      s.pigeonShieldStep?.(a,c);
      if(this.age>=toFrames(c.duration))this.endPigeonShield();
      return;
    }
    if(this.state==='heal'){
      const h=a.config.heal,startup=toFrames(h.windup),total=startup+toFrames(h.duration);
      if(this.age<startup)this.pose('heal',h.startPoses[Math.min(h.startPoses.length-1,Math.floor(this.age/startup*h.startPoses.length))]);
      else {
        this.pose('heal',h.loopPoses?h.loopPoses[Math.floor((this.age-startup)/(h.framesPerPose??8))%h.loopPoses.length]:h.pose);a.hp=Math.min(a.config.hp,a.hp+a.config.hp*h.perSecond/ARCADE.clock.fps);
        if(Math.floor(this.age/8)%2)a.sprite.setTint?.(0xa8ffb0);else a.sprite.clearTint?.();
      }
      if(this.age>=total){a.sprite.clearTint?.();a.tell.setVisible(false);this.healReady=this.clock+toFrames(h.cooldown);this.transition('approach');}
      return;
    }
    if(this.state==='evade'){
      const ev=a.config.evade??{},p=this.evade,t=Math.min(1,this.age/p.frames);
      a.x=clamp(a.x+p.dir*(p.distance??ev.distance)/p.frames,s.floor.left,s.floor.right);a.z=Math.sin(t*Math.PI)*(p.height??ev.height);
      this.pose('evade',p.poses?p.poses[Math.min(p.poses.length-1,Math.floor(t*p.poses.length))]:p.pose??(ev.poses?ev.poses[Math.min(ev.poses.length-1,Math.floor(t*ev.poses.length))]:ev.pose));
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
        if(a.config.leap)p.leap??=new LeapingBite(this,p.data.active);
        const biteActive=!p.leap || p.leap.step();
        if(this.state!=='attack'){
          this.transition('attack');a.tell.setVisible(false);
          const sound=p.summon?(a.config.summon.sound??ENEMY_ATTACK_SOUNDS[a.key]):ENEMY_ATTACK_SOUNDS[a.key];if(sound)s.sfx?.play(sound);
          const voice=BOSS_SOUNDS[a.key];
          if(voice && !(p.summon && a.config.summon.sound)){if((p.throw||p.flock) && voice.throw)s.sfx?.play(voice.throw);else if(voice.attack && this.stage===0)s.sfx?.play(voice.attack);}
        }
        if(p.flock){if(!p.hit){p.hit=true;s.launchFlock?.(a,a.config.flock);}}
        else if(p.summon){if(!p.hit){p.hit=true;s.summonMinions?.(a,a.config.summon);}}
        else if(p.throw){if(!p.hit){p.hit=true;if(p.barrage)s.launchSprayBarrage?.(a,a.config.barrage,p.data.damage);else s.throwProjectile(a,a.facing,a.config.throw,p.data.damage);}}
        else if(a.config.ranged){if(!p.hit){p.hit=true;s.throwKnife(a,a.facing);}}else if(biteActive)this.hitPlayer(p.data);
        if(a.config.paint && !p.throw && !p.summon && !p.painted){p.painted=true;s.paintFloor?.(a,a.facing,a.config.paint);}
      } else if(frame.phase==='recovery' && this.state!=='recover'){p.leap?.cancel();this.transition('recover');}
      if(++p.index>=p.data.frames.length){
        if(p.flock && a.config.pigeonShield)this.beginPigeonShield();
        else if(p.throw||p.summon||p.flock)this.finish(Math.round(ARCADE.ai.initialCooldown/s.level.pressure));
        else if(a.config.combo && this.stage<(a.config.combo.stages??ARCADE.ai.comboStages)-1 && (!a.config.combo.confirmFirst || a.pending.connected)){this.stage++;this.beginStage();}
        else this.finish(a.config.combo?toFrames(a.config.combo.cooldown/s.level.pressure):Math.round((a.config.attackFrames?.cooldown??ARCADE.ai.cooldown)/s.level.pressure));
        // Painters hop back out of a player who stays on top of them after the spray.
        const ev=a.config.evade;if(ev?.afterAttack && !p.throw && !p.summon && this.state==='circle' && Math.abs(s.player.x-a.x)<ev.afterAttack)this.startEvade();
      }
      return;
    }
    const dx=s.player.x-a.x,dy=s.player.y-a.y,range=a.config.charge?.triggerRange??a.config.range;
    if(this.tryDodge())return;
    // Still outside the floor span (walking in from off-screen): step inside before anything else.
    if(a.x<s.floor.left || a.x>s.floor.right){this.move(a.x<s.floor.left?1:-1,0);this.pose('walk');return;}
    this.face(dx);
    // Shielded bosses only strike forward: a player behind them is safe until they turn around.
    const inRange=Math.abs(dx)<=range && Math.abs(dy)<ARCADE.body.lane && this.facesPlayer(dx);
    if(this.canFlock() && this.beginFlock())return;
    if(this.canSummon() && this.beginSummon())return;
    if(this.canBarrage() && this.beginBarrage())return;
    if(inRange && this.clock>=this.ready && this.begin())return;
    if(!inRange && !this.rush && this.canHeal(dx) && this.beginHeal())return;
    if(!inRange && !this.rush && this.facesPlayer(dx) && this.canThrow(dx,dy) && this.beginThrow())return;
    if(combat.tokens.owners.size>=combat.tokens.limit || this.clock<this.ready){
      if(this.state!=='circle')this.transition('circle');
      // keepAway throwers line up with the player's depth so the throw can connect.
      let side=(a.index??0)%2?1:-1;const slot=a.config.throw?.keepAway?0:(a.index??0)%3-1;
      // Thrower bosses wait out of knife range while their ball is ready, then throw; otherwise they close in.
      // keepAway throwers always back off to throwing distance between attacks.
      const t=a.config.throw,keep=t && (t.keepAway || this.clock>=(this.throwReady??0)-ARCADE.ai.initialCooldown)?t.minRange+40:a.config.keepDistance??a.config.range+ARCADE.ai.circleX;
      // Bosses that keep their distance stay on their current side, switching only when it has no room.
      if(a.config.boss && (a.config.keepDistance || t?.keepAway)){side=Math.sign(a.x-s.player.x)||1;const want=s.player.x+side*keep;if(want<s.floor.left||want>s.floor.right)side=-side;}
      const tx=clamp(s.player.x+side*keep,s.floor.left,s.floor.right);
      const ty=clamp(s.player.y+slot*ARCADE.ai.circleY,s.floor.top,s.floor.bottom);
      const mx=Math.abs(tx-a.x)>ARCADE.ai.alignY?Math.sign(tx-a.x):0,my=Math.abs(ty-a.y)>ARCADE.ai.alignY?Math.sign(ty-a.y):0;
      this.move(mx,my,a.config.speed*ARCADE.ai.circleSpeed);if(mx||my)this.pose('walk');else this.pose('idle',a.config.animations.idle?.length?undefined:a.config.idle);return;
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
  barragePhase(){const a=this.actor,c=a.config.barrage;return Boolean(c) && a.hp>0 && a.hp<a.config.hp*c.below;}
  canBarrage(){
    if(!this.barragePhase() || this.clock<this.ready)return false;
    this.barrageReady??=this.clock+toFrames(this.actor.config.barrage.first);
    return this.clock>=this.barrageReady && !this.scene.sprayBarrage?.active;
  }
  beginBarrage(){
    const a=this.actor,s=this.scene,c=a.config.barrage;
    if(!this.runtime.combat.tokens.acquire(a))return false;
    this.face(s.player.x-a.x);this.rush=false;this.stage=0;a.pending={enemy:a,connected:false,finisher:false};
    const config={...a.config,throw:{...a.config.throw,windup:c.windup,recovery:c.recovery,damage:c.damage}};
    this.action={data:enemyThrowData(config,s.level.damage??1),index:0,hit:false,throw:true,barrage:true};
    this.barrageReady=this.clock+toFrames((c.cooldown[0]+Math.random()*(c.cooldown[1]-c.cooldown[0]))/s.level.pressure);
    a.tell.setText('¡LLUVIA DE SPRAY!').setVisible(true);this.transition('windup');return true;
  }
  /** Summoner bosses: call a wave when the cooldown allows and few of their minions are still up. */
  canSummon(){
    const a=this.actor,m=a.config.summon;if(!m || a.hp<=0 || this.clock<this.ready)return false;
    if(m.below!=null && a.hp>=a.config.hp*m.below)return false;
    this.summonReady??=(m.below!=null?this.clock:0)+toFrames(m.first??0);
    return this.clock>=this.summonReady && this.scene.enemies.filter(e=>e.hp>0 && e.summoner===a).length<m.maxAlive;
  }
  beginSummon(){
    const a=this.actor,s=this.scene;this.runtime.combat.tokens.release(a);a.pending=null;this.stage=0;
    a.facing=Math.sign(s.player.x-a.x)||a.facing;a.sprite.setFlipX(a.facing<0);
    this.action={data:enemySummonData(a.config),index:0,hit:false,summon:true};
    this.summonReady=this.clock+Math.round(toFrames(a.config.summon.cooldown)/s.level.pressure);
    a.tell.setText(a.config.summon.label??'!!').setVisible(true);this.transition('windup');return true;
  }
  /** Palomera from half health (config.flock): the pigeon cloud, on its own cooldown, at any distance. */
  canFlock(){
    const a=this.actor,f=a.config.flock;if(!f || a.hp<=0 || a.hp>a.config.hp*f.below || this.clock<this.ready)return false;
    this.flockReady??=this.clock+toFrames(f.first??0); // armed the moment she drops to half health
    return this.clock>=this.flockReady && !this.scene.flock?.active;
  }
  beginFlock(){
    const a=this.actor,s=this.scene;this.runtime.combat.tokens.release(a);a.pending=null;this.stage=0;
    a.facing=Math.sign(s.player.x-a.x)||a.facing;a.sprite.setFlipX(a.facing<0);
    this.action={data:enemyFlockData(a.config),index:0,hit:false,flock:true};
    this.flockReady=this.clock+Math.round(toFrames(a.config.flock.cooldown)/s.level.pressure);
    a.tell.setText('!!').setVisible(true);this.transition('windup');return true;
  }
  /** Palomera's pigeon shield (config.pigeonShield), right after the pigeon cloud. */
  beginPigeonShield(){
    const a=this.actor,s=this.scene;this.runtime.combat.tokens.release(a);this.action=null;a.pending=null;a.tell.setVisible(false);
    a.pigeonShielded=true;a.invulnerableUntil=s.combatTime+ARCADE.clock.stepMs*2;s.sfx?.play('spell');this.transition('shield');
  }
  endPigeonShield(){
    const a=this.actor,s=this.scene;a.pigeonShielded=false;a.invulnerableUntil=0;a.sprite.clearTint?.();s.stopPigeonShield?.(a);
    this.ready=this.clock+Math.round(ARCADE.ai.initialCooldown/s.level.pressure);this.transition('circle');
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
    if(this.shieldPhase)return false;
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
  checkShieldPhase(){
    const a=this.actor,p=a.config.shieldBreak;
    if(!this.shieldPhase && p && a.hp>0 && a.hp<a.config.hp*p.below)this.shieldPhase=new ShieldBreakPhase(this);
    return this.state==='phaseChange';
  }
}
