import {ARCADE} from '../data/arcade.js';
import {beginEnemyAttack} from '../combat/enemyAttacks.js';
import {beginEnemyCharge} from '../combat/enemyCharge.js';

export function installCombatPreview(game) {
  const panel=document.createElement('div');panel.id='combat-preview';
  panel.style.cssText='position:fixed;right:12px;top:70px;z-index:10;display:flex;flex-wrap:wrap;gap:6px;max-width:320px;padding:8px;background:#142127ee;border:1px solid #d6ed64';
  const add=(text,action)=>{
    const button=document.createElement('button');button.textContent=text;
    button.onclick=()=>{if(game.scene.isActive('Street'))action(game.scene.getScene('Street'));};panel.append(button);
  };
  add('Combo de enemigo',s=>{const e=s.enemies.find(e=>e.hp>0 && e.config.combo);if(e&&!e.pending&&!s.finished){if(s.arcade)s.arcade.enemies.get(e)?.begin();else beginEnemyAttack(s,e,s.player.x<e.x?-1:1);}});
  add('Carga del enemigo',s=>{const e=s.enemies.find(e=>e.hp>0 && e.config.charge);if(e&&!e.pending&&!s.finished){if(s.arcade)s.arcade.enemies.get(e)?.begin();else beginEnemyCharge(s,e,s.player.x<e.x?-1:1);}});
  add('Cruceta',s=>{const e=s.enemies.find(e=>e.hp>0 && e.config.melee);if(e&&!e.pending&&!s.finished){if(s.arcade)s.arcade.enemies.get(e)?.begin(true);else beginEnemyAttack(s,e,s.player.x<e.x?-1:1);}});
  add('Contraatacar',s=>{const e=s.enemies.find(e=>e.hp>0);if(e)s.hitEnemy(e,{damage:1,knockback:0,facing:1});});
  if(new URLSearchParams(location.search).get('enemyTest')==='malabarista'){
    add('Lanzar pinos',s=>{const e=s.enemies.find(e=>e.config.juggler),m=s.arcade?.enemies.get(e);if(m && ['approach','circle'].includes(m.state))m.beginThrow();});
    add('Acercarse al malabarista',s=>{const e=s.enemies.find(e=>e.config.juggler);if(e){s.player.x=e.x-55;s.player.y=e.y;}});
  }
  for(const side of ['left','right'])add(`Acorralar jefe ${side==='left'?'←':'→'}`,s=>{
    const e=s.enemies.find(e=>e.config.boss && e.hp>0),m=s.arcade?.enemies.get(e);if(!m || m.bossEscapeBlocked())return;
    e.x=s.floor[side];e.y=450;s.player.x=e.x+(side==='left'?55:-55);s.player.y=e.y;
    m.bossEscapeReady=0;m.bossPinnedAt=s.combatTime-900;
  });
  if(new URLSearchParams(location.search).get('enemyTest')==='guitarist'){
    add('Agarrar guitarrista',s=>{const e=s.enemies.find(e=>e.hp>0 && e.key==='guitarist'),m=s.arcade?.enemies.get(e),p=s.arcade?.player;
      if(m && p.state==='walk'){m.hurt();if(m.state!=='approach')m.transition('approach');m.ready=m.clock+600;e.x=s.player.x+50;e.y=s.player.y;
        for(let i=0;i<ARCADE.grab.touchFrames;i++)p.tryGrab({dx:1});}});
    add('Soltar guitarrista',s=>{if(s.arcade?.player.state==='grab')s.arcade.player.transition('walk');});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.key==='guitarist'),m=s.arcade?.enemies.get(e);if(e && m)status.textContent=`GUITARRISTA · ${m.state} · golpe ${(m.stage??0)+1}/2 · sprite ${e.sprite.texture.key} · pose ${e.sprite.frame.name}`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='parlanchin'){
    const mime=s=>s.enemies.find(e=>e.key==='parlanchin' && e.hp>0);
    const prepare=s=>{const e=mime(s),m=s.arcade?.enemies.get(e);if(!m)return null;m.hurt();if(m.state!=='approach')m.transition('approach');e.z=0;e.invulnerableUntil=0;m.ready=m.clock;return {e,m};};
    add('Patada voladora',s=>{const p=prepare(s);if(p){p.e.hp=p.e.config.hp;p.e.x=s.player.x+200;p.e.y=s.player.y;p.m.begin();}});
    add('Mímica +10%',s=>{const p=prepare(s);if(p){p.e.hp=p.e.config.hp*.5;p.e.healthBar.width=21;p.m.beginHeal();}});
    add('Interrumpir mímica',s=>{const e=mime(s);if(e)s.hitEnemy(e,{damage:5,knockback:0,facing:1});});
    add('Congelar mimo',s=>{s.paused=!s.paused;s.sfx?.setPaused(s.paused);s.music?.setPaused(s.paused);});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=mime(s),m=s.arcade?.enemies.get(e);if(e && m)status.textContent=`PARLANCHÍN · ${m.state} · HP ${e.hp.toFixed(1)}/${e.config.hp} · salto ${Math.round(e.z??0)}`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='rat'){
    add('Salto y mordida',s=>{const e=s.enemies.find(e=>e.hp>0 && e.config.leap),m=s.arcade?.enemies.get(e);if(m){m.hurt();if(m.state!=='approach')m.transition('approach');m.ready=m.clock;m.begin();}});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.config.leap),m=s.arcade?.enemies.get(e);if(e && m)status.textContent=`RATA · ${m.state} · HP ${e.hp} · salto ${Math.round(e.z??0)} · frame ${m.action?.index??0}`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='pacho'){
    add('Salto y disparos',s=>{const e=s.enemies.find(e=>e.config.pacho);s.arcade.enemies.get(e)?.pacho?.debugAttack('hop');});
    add('Segunda fase',s=>{const e=s.enemies.find(e=>e.config.pacho);const c=s.arcade.enemies.get(e)?.pacho;if(c){c.debugAttack('hop');s.hitEnemy(e,{damage:Math.max(1,e.hp-e.config.hp*.49),knockback:0,facing:1});}});
    add('Curación',s=>{const e=s.enemies.find(e=>e.config.pacho);s.arcade.enemies.get(e)?.pacho?.debugAttack('heal');});
    add('Vencer a Pacho',s=>{const e=s.enemies.find(e=>e.config.pacho);s.hitEnemy(e,{damage:e.hp+1,knockback:0,facing:1});});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.config.pacho),m=s.arcade?.enemies.get(e);if(e && m)status.textContent=`${m.state} · HP ${Math.round(e.hp)}/${e.config.hp} · fase ${m.pacho?.phase??1} · disparos ${m.pacho?.shots??0}`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='brayatan'){
    for(const [label,kind] of [['Cuchillos','knives'],['Baile machete','dance'],['Carga machete','charge'],['Salto stomp','stomp']])
      add(label,s=>{const e=s.enemies.find(e=>e.config.brayatan);s.arcade.enemies.get(e)?.brayatan?.debugAttack(kind);});
    add('Furia de Brayatan',s=>{const e=s.enemies.find(e=>e.config.brayatan);if(e?.hp>e.config.hp/2)s.hitEnemy(e,{damage:e.hp-Math.floor(e.config.hp*.49),knockback:0,facing:1});});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.config.brayatan),m=s.arcade?.enemies.get(e);
      if(e && m)status.textContent=`${m.state} · HP ${e.hp}/${e.config.hp} · fase ${m.brayatan?.phase??1} · cuchillos ${m.brayatan?.shots??0} · ${e.sprite.visible?'visible':'solo sombra'}`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='antidisturbios'){
    add('Romper escudo',s=>{const e=s.enemies.find(e=>e.config.shieldBreak);if(e?.hp>e.config.hp/2)s.hitEnemy(e,{damage:e.hp-Math.floor(e.config.hp*.49),knockback:0,facing:e.facing??1});});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.config.shieldBreak),m=s.arcade?.enemies.get(e);
      if(e && m)status.textContent=`${m.state} · HP ${e.hp}/${e.config.hp} · velocidad ${e.config.speed} · bombas ${m.shieldPhase?.shots??0}/4`;};
    game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  }
  add('Perder vida',s=>{s.invulnerableUntil=0;s.respawnProtectedUntil=0;s.hitPlayer(100);});
  add('Recoger vuvuzela',s=>{s.vuvuzela?.spawn(s.player.x,s.player.y);});
  add('Última vida',s=>{s.run.lives=1;s.updateRunStatus();});
  add('Vencer jefe',s=>{if(s.boss&&!s.boss.dead){s.boss.state='idle';s.boss.guardUntil=0;s.boss.hit({damage:10000,range:2000,area:true,knockback:0},{x:s.boss.x,y:s.boss.y});}});
  add('Reiniciar prueba',s=>{if(s.enemyTest)s.scene.restart({character:s.characterKey,level:s.levelIndex,enemyTest:s.enemyTest});else s.restartLevel();});
  const hide=document.createElement('button');hide.textContent='Ocultar pruebas';hide.onclick=()=>panel.remove();panel.append(hide);
  document.body.append(panel);
}
