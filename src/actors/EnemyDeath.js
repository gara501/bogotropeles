export const ENEMY_DEATH={gravity:1800,holdMs:650,fadeMs:250,poseMs:300,sinkMs:380};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Death movement is independent of live AI, hitstop and victory/respawn timers. */
export function beginEnemyDeath(scene,actor,height=actor.z??0){
  if(actor.deathMotion)return;
  scene.tweens?.killTweensOf?.(actor.sprite);
  scene.arcade?.enemies.get(actor)?.endStruggle();
  height=Math.max(0,Number.isFinite(height)?height:0);
  actor.deathMotion={height,elapsed:0,fallMs:Math.sqrt(2*height/ENEMY_DEATH.gravity)*1000,landed:height===0,done:false,sink:Boolean(actor.sinking)};
  for(const visual of [actor.shadow,actor.healthBar,actor.tell,actor.taunt])visual?.setVisible(false);
  actor.jitterUntil=0;actor.sprite.rotation=0;actor.sprite.setAlpha(1);
  renderEnemyDeath(scene,actor);
}

export function renderEnemyDeath(scene,actor){
  const death=actor.deathMotion;if(!death)return;
  if(death.done){actor.z=0;return;}
  if(death.sink){ // fell into a manhole: drops below the floor and fades
    const t=clamp(death.elapsed/ENEMY_DEATH.sinkMs,0,1),frames=actor.config.animations.hurt??[actor.config.idle??0];
    actor.sprite.stop().setFrame(frames[0]+(actor.config.frameOffset??0));actor.sprite.setAlpha(1-t*t);
    scene.placeFighter(actor,-t*80);if(t===1){death.done=true;actor.z=0;actor.sprite.setVisible(false);}return;
  }
  const seconds=death.elapsed/1000;
  actor.z=Math.max(0,death.height-ENEMY_DEATH.gravity*seconds*seconds/2);
  death.landed=actor.z===0;
  const frames=actor.config.animations.defeat??[actor.config.idle??0];
  const progress=clamp(death.elapsed/Math.max(death.fallMs,ENEMY_DEATH.poseMs),0,1);
  const pose=frames[Math.min(frames.length-1,Math.floor(progress*frames.length))];
  actor.sprite.stop().setFrame(pose+(actor.config.frameOffset??0));
  const onFloor=Math.max(0,death.elapsed-death.fallMs);
  const alpha=death.landed?clamp(1-(onFloor-ENEMY_DEATH.holdMs)/ENEMY_DEATH.fadeMs,0,1):1;
  actor.sprite.setAlpha(alpha);
  if(alpha===0){death.done=true;actor.sprite.setVisible(false);}
  scene.placeFighter(actor,actor.z);
}

export function updateEnemyDeaths(scene,dtMs){
  for(const actor of scene.enemies){
    // Also recover airborne deaths caused directly by a scripted attack/controller.
    if(actor.hp<=0 && !actor.deathMotion && (actor.z??0)>0)beginEnemyDeath(scene,actor);
    const death=actor.deathMotion;if(!death || death.done)continue;
    death.elapsed+=dtMs;renderEnemyDeath(scene,actor);
  }
}
