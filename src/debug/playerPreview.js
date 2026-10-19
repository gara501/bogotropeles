// Opt-in development controls exercise the real scene and Phaser animations.
// This module is never imported by production builds.
export function installPlayerPreview(game,restart,character='office') {
  const panel=document.createElement('div');panel.id='player-preview-controls';
  panel.style.cssText='position:fixed;right:12px;top:85px;z-index:10;display:flex;flex-wrap:wrap;gap:5px;max-width:330px;padding:8px;background:#142127f5;border:1px solid #d6ed64';
  const scene=()=>game.scene.isActive('Street')?game.scene.getScene('Street'):null;
  const stop=s=>{s.keys.A.isDown=false;s.keys.D.isDown=false;if(s.arcade?.player.state==='celebration')s.arcade.resetPlayer();};
  const add=(label,action)=>{
    const button=document.createElement('button');button.textContent=label;
    button.addEventListener('click',()=>{const s=scene();if(s)action(s);});panel.append(button);
  };
  for(const [arrow,facing] of [['←',-1],['→',1]]) {
    add(`Caminar ${arrow}`,s=>{stop(s);s.player.x=facing>0?200:760;s.keys[facing>0?'D':'A'].isDown=true;});
    if(character==='office')add(`iPhone ${arrow}`,s=>{stop(s);s.facing=facing;s.player.x=facing>0?200:830;s.startAttack('iphone');});
  }
  if(character==='student') {
    add('Libros',s=>{stop(s);s.startAttack('books');});
    add('Patada baja',s=>{stop(s);s.startAttack('lowKick');});
    add('Enemigos cerca',s=>{
      stop(s);s.player.x=400;s.player.y=450;
      s.enemies.forEach((enemy,index)=>{enemy.x=400+(index? -62:62);enemy.y=450;});
    });
  }
  if(character==='gymbro')add('Pisotón',s=>{stop(s);s.startAttack('stomp');});
  if(character!=='student')add('Enemigos cerca',s=>{stop(s);s.player.x=400;s.player.y=450;s.enemies.forEach((enemy,index)=>{enemy.x=400+(index?-62:62);enemy.y=450;});});
  add('Detener',stop);add('Puño',s=>{stop(s);s.startAttack('punch');});
  add('Patada',s=>{stop(s);s.startAttack('kick');});add('Dash',s=>{stop(s);s.startDash(s.facing,0);});
  add('Daño',s=>{stop(s);s.invulnerableUntil=0;s.hitPlayer(10);});
  add('Probar caneca',s=>{stop(s);s.energyPickups.destroy();s.energyPickups.rolled.add(s.waves.arena);s.health=50;s.healthBar.width=100;s.facing=1;s.energyPickups.spawn(s.player.x+65,s.player.y);});
  add('Derrota',s=>{stop(s);s.invulnerableUntil=0;s.respawnProtectedUntil=0;s.hitPlayer(100);});
  add('Victoria',s=>{stop(s);if(s.arcade)s.arcade.player.transition('celebration');s.play(s.player,'victory',1000);s.playerAttack={start:s.combatTime,duration:1100,hit:true};});
  add('Reiniciar prueba',()=>restart());
  const status=document.createElement('output');status.style.cssText='width:100%;font:10px monospace;color:#e8edce';panel.append(status);
  const update=()=>{const s=scene();if(!s?.arcade)return;const p=s.arcade.player,a=s.player;
    status.textContent=`${p.state} · ${p.action?.displayedFrame.phase??'—'} · combo ${(p.action?.data.stage??0)+1} · tokens ${s.arcade.combat.tokens.owners.size}/2 · energía ${s.health} · frame ${s.arcade.frame} · x ${a.x.toFixed(1)} y ${a.y.toFixed(1)} z ${(a.z??0).toFixed(1)} · ${game.canvas.width}×${game.canvas.height}`;
  };
  game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  add('Hitboxes',s=>{s.arcade.debugBoxes=!s.arcade.debugBoxes;});
  add('Activar / pausar IA',s=>{s.debugPreview=!s.debugPreview;});
  add('Ocultar pruebas',s=>{stop(s);s.debugPreview=false;s.invulnerableUntil=s.combatTime;game.events.off('poststep',update);panel.remove();});
  document.body.append(panel);
}
