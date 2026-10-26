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
  const previewKind=new URLSearchParams(location.search).get('enemyTest');
  if(previewKind==='reversa'){
    const boss=s=>s.arcade?.enemies.get(s.enemies.find(e=>e.key==='reversa'))?.reversa;
    add('Subir a la cabina',s=>{const c=boss(s);if(c){c.actor.hp=c.actor.config.hp*.49;c.actor.invulnerableUntil=0;c.phaseCheck();}});
    for(const [label,offset] of [['Golpear motor',-250],['Golpear costado',-65]])add(label,s=>{const c=boss(s);if(c?.phase===2 && c.mode!=='board'){s.arcade.player.reset();s.invulnerableUntil=Infinity;s.health=100;s.timeLeft=99000;s.player.x=c.truckX+offset;s.player.y=c.truckY+32;s.facing=1;s.arcade.player.request('punch');}});
    for(const [label,kind] of [['Costal','slam'],['Hombrazo','charge'],['Llamar estibadores','whistle'],['Tomar tinto','coffee'],['Reversa','reverse'],['Pito frontal','horn'],['Plataforma','platform'],['Exosto','exhaust'],['Caja de huevos','eggs']])add(label,s=>{const c=boss(s);if(c && !['entry','exit','board','dead'].includes(c.mode) && (c.phase===2?['reverse','horn','platform','exhaust','eggs']:['slam','charge','whistle','coffee']).includes(kind))c.start(kind);});
    add('Derrotar a Don Reversa',s=>{const c=boss(s);if(c){c.actor.invulnerableUntil=0;s.hitEnemy(c.actor,{damage:1e6,knockback:0,facing:1});}});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    game.events.on('poststep',()=>{const s=game.scene.getScene('Street'),c=boss(s);if(c)status.textContent=`DON REVERSA · fase ${c.phase} · ${c.mode} · ${Math.round(c.actor.hp)} HP · ${c.windowOpen || c.doorOpen?'VERDE':'BLINDADO'}`;});
  }
  if(previewKind==='papero'){
    for(const [label,kind] of [['Alzar costal','slam'],['Lanzar bulto','throw']])add(label,s=>{const m=s.arcade.enemies.get(s.enemies.find(e=>e.key==='papero'));if(m){m.papero.hasSack=true;m.transition('approach');m.papero.start(kind);}});
    add('Caja para recargar',s=>{const e=s.enemies.find(e=>e.key==='papero');if(e)s.energyPickups.spawn(e.x+50,e.y,'boxes');});
    add('Destruir cajas',s=>{for(const c of s.energyPickups.cans)c.hp=0;});
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='don_pico'){
    add('Soltar gallina',s=>{
      const e=s.enemies.find(e=>e.key==='don_pico' && e.hp>0),m=s.arcade?.enemies.get(e);
      if(m && ['approach','circle','windup','attack','recover','hurt'].includes(m.state)){
        s.arcade.poultry.clear();m.hurt();m.transition('approach');m.pollero?.beginRelease();
      }
    });
    add('Preparar devolución',s=>{
      const e=s.enemies.find(e=>e.key==='don_pico' && e.hp>0);if(!e)return;
      s.arcade.poultry.clear();e.x=720;e.y=450;s.player.x=400;s.player.y=450;s.facing=1;e.facing=-1;
      const hen=s.arcade.poultry.release(e);hen.x=455;hen.y=450;
      const other=s.enemies.find(a=>a.key==='frutatiana' && a.hp>0)??s.spawnEnemy('frutatiana',1,0,1,0);
      other.x=620;other.y=450;
    });
    add('Puño sobre gallina · H',s=>s.arcade.player.request('punch'));
    add('Devolver gallina · J',s=>s.arcade.player.request('kick'));
    add('Devolver gallina · L',s=>s.arcade.player.request('lowKick'));
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    game.events.on('poststep',()=>{
      const s=game.scene.getScene('Street');if(!s.arcade)return;
      status.textContent=`GALLINAS · ${s.arcade.poultry.hens.map(h=>h.phase).join(', ')||'ninguna'} · J: cualquier personaje · L: Universitaria`;
    });
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='don_diablo'){
    add('Probar captura',s=>{
      const e=s.enemies.find(e=>e.key==='don_diablo'),c=s.arcade.diablitos.carts[0];if(!c || !e || e.hp<=0)return;
      s.arcade.diablitos.recovering.delete(e);c.owner=e;c.phase='windup';c.age=30;c.dir=-1;c.remaining=390;
      e.x=660;e.y=450;s.player.x=480;s.player.y=450;s.invulnerableUntil=0;s.respawnProtectedUntil=0;
    });
    add('Dejar carrito clavado',s=>{const c=s.arcade.diablitos.carts[0];if(c){s.arcade.diablitos.park(c);c.age=35;}});
    add('Usar carrito · H',s=>{
      const c=s.arcade.diablitos.carts[0];if(!c || c.owner)return;
      s.player.x=c.x-60;s.player.y=c.y;s.facing=1;s.arcade.player.request('punch');
    });
    add('Otro enemigo toma carrito',s=>{
      const c=s.arcade.diablitos.carts[0];if(!c)return;s.arcade.diablitos.park(c);c.age=35;
      const e=s.spawnEnemy('frutatiana',1,0,1,0);e.x=c.x+45;e.y=c.y;
    });
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    game.events.on('poststep',()=>{
      const s=game.scene.getScene('Street'),c=s.arcade?.diablitos.carts[0];
      if(c)status.textContent=`DIABLITO · ${c.phase} · dueño: ${c.owner===s.player?'PLAYER':c.owner?.config.name??'LIBRE'} · captura: ${Boolean(s.arcade.diablitos.captured)}`;
    });
  }
  if(new URLSearchParams(location.search).get('enemyTest')==='frutatiana'){
    for(const [label,chance] of [['Probar naranja',.9],['Probar patilla',0]])add(label,s=>{
      const e=s.enemies.find(e=>e.key==='frutatiana' && e.hp>0),m=s.arcade?.enemies.get(e);
      if(m && ['approach','circle','windup','attack','recover','hurt'].includes(m.state)){
        m.hurt();m.transition('approach');m.beginThrow(()=>chance);
      }
    });
    add('Acercarse a Frutatiana',s=>{const e=s.enemies.find(e=>e.key==='frutatiana');if(e){s.player.x=e.x-45;s.player.y=e.y;}});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    game.events.on('poststep',()=>{
      const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.key==='frutatiana'),m=s.arcade?.enemies.get(e);
      if(!e)return;
      status.textContent=`FRUTATIANA · ${m?.state??'—'} · ${m?.action?.throwConfig?.fruit??'—'} · frutas en vuelo: ${s.projectiles.filter(p=>p.fruit).length}`;
    });
  }
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
    add('Rodillazo guitarrista',s=>{if(s.arcade?.player.state==='grab')s.arcade.player.request('punch');});
    add('Soltar guitarrista',s=>{if(s.arcade?.player.state==='grab')s.arcade.player.transition('walk');});
    const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:#e8edce';panel.append(status);
    const update=()=>{const s=game.scene.getScene('Street'),e=s.enemies?.find(e=>e.key==='guitarist'),m=s.arcade?.enemies.get(e);if(e && m)status.textContent=`GUITARRISTA · ${m.state} · golpe ${(m.stage??0)+1}/2 · sprite ${e.sprite.texture.key} · pose ${e.sprite.frame.name} · HP ${e.hp} · escala ${e.sprite.scaleY.toFixed(3)}`;};
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
