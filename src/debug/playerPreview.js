// Opt-in development controls exercise the real scene and Phaser animations.
// This module is never imported by production builds.
export function installPlayerPreview(game,restart,character='office') {
  let comboPreview=null,airPreview=null,grabPreview=null,idlePreview=false,dashPreview=false;
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
  if(['gymbro','office','teleperforman'].includes(character)){
    if(character==='gymbro')add('Pisotón',s=>{stop(s);s.startAttack('stomp');});
    add('Reposo',s=>{stop(s);s.arcade.player.reset();s.arcade.clearInput();comboPreview=null;airPreview=null;grabPreview=null;idlePreview=true;s.paused=false;});
    add('Agarre',s=>{
      stop(s);s.arcade.player.reset();s.arcade.clearInput();comboPreview=null;airPreview=null;idlePreview=false;
      const target=s.enemies.find(e=>e.hp>0 && !e.crossing && !e.config.boss && e.config.grabbable!==false);if(!target)return;
      // Preview AI is frozen, including its arrival. Place a regular rival on the ground before walking into it.
      target.arriving=false;target.z=0;target.invulnerableUntil=0;
      const model=s.arcade.enemies.get(target);
      if(model){model.state='approach';model.age=0;model.action=null;}
      s.player.x=400;s.player.y=450;s.facing=1;target.x=450;target.y=450;
      s.keys.D.isDown=true;grabPreview='hold';s.paused=false;
    });
    for(const [label,input,kind] of [[character==='teleperforman'?'Latigazos':character==='office'?'Sacudida':'Rodillazo','punch',['office','teleperforman'].includes(character)?'shake':'knee'],['Proyectar','kick','throw']])add(label,s=>{
      if(s.arcade.player.state!=='grab')return;
      grabPreview=kind;s.paused=false;s.arcade.player.request(input);
    });
  }
  if(character!=='student')add('Enemigos cerca',s=>{stop(s);s.player.x=400;s.player.y=450;s.enemies.forEach((enemy,index)=>{enemy.x=400+(index?-62:62);enemy.y=450;});});
  add('Detener',stop);add('Puño',s=>{stop(s);s.startAttack('punch');});
  add('Vuvuzela',s=>{stop(s);s.vuvuzela.equip();});
  add('Patada',s=>{stop(s);s.arcade.player.request('kick');});add('Dash',s=>{
    stop(s);s.arcade.player.reset();s.arcade.clearInput();comboPreview=null;airPreview=null;grabPreview=null;idlePreview=false;
    s.paused=false;dashPreview=true;s.startDash(s.facing,0);
  });
  for(const [label,direction,kick] of [['Rollo adelante',1,false],['Rollo atrás',-1,false],['Patada aérea',1,true]])add(label,s=>{
    stop(s);s.paused=false;s.arcade.player.reset();s.arcade.clearInput();comboPreview=null;
    s.player.x=360;s.player.y=450;s.facing=1;
    for(const key of ['W','A','S','D','UP','LEFT','DOWN','RIGHT'])s.keys[key].isDown=false;
    s.keys[direction>0?'D':'A'].isDown=true;
    const touch=s.game.touchControls.input;touch.reset();touch.down('SPACE','air-preview');touch.up('air-preview');
    airPreview={kick,requested:false,at:direction>0?20:15};
  });
  for(const [label,inputs] of [
    ['PPKKK',['punch','punch','kick','kick','kick']],
    ...(['student','teleperforman'].includes(character)?[['KKK',['kick','kick','kick']]]:[]),
    ...(['office','teleperforman'].includes(character)?[['PPP',['punch','punch','punch']]]:[]),
  ])add(`Combo ${label}`,s=>{
    stop(s);s.paused=false;s.arcade.player.reset();s.arcade.clearInput();
    comboPreview={inputs,index:0};s.arcade.player.request(inputs[0]);
  });
  add('Continuar animación',s=>{comboPreview=null;airPreview=null;grabPreview=null;idlePreview=false;dashPreview=false;s.paused=false;});
  add('Daño',s=>{stop(s);s.invulnerableUntil=0;s.hitPlayer(10);});
  add('Probar caneca',s=>{stop(s);s.energyPickups.destroy();s.energyPickups.rolled.add(s.waves.arena);s.health=50;s.healthBar.width=100;s.facing=1;s.energyPickups.spawn(s.player.x+65,s.player.y);});
  add('Derrota',s=>{stop(s);s.invulnerableUntil=0;s.respawnProtectedUntil=0;s.hitPlayer(100);});
  add('Victoria',s=>{stop(s);if(s.arcade)s.arcade.player.transition('celebration');s.play(s.player,'victory',1000);s.playerAttack={start:s.combatTime,duration:1100,hit:true};});
  add('Reiniciar prueba',()=>restart());
  const status=document.createElement('output');status.style.cssText='width:100%;font:10px monospace;color:#e8edce';panel.append(status);
  const update=()=>{const s=scene();if(!s?.arcade)return;const p=s.arcade.player,a=s.player;
    if(dashPreview && p.state==='dash' && p.age>=8){s.paused=true;a.sprite.setAlpha(1);dashPreview=false;}
    if(idlePreview && p.state==='walk' && Number(a.sprite.frame.name)===s.character.idle){s.paused=true;a.sprite.setAlpha(1);idlePreview=false;}
    if(grabPreview && p.state==='grab'){
      s.keys.D.isDown=false;const g=p.grab,act=g.action;
      if((grabPreview==='hold' && g.age>=20) || (grabPreview==='knee' && act?.kind==='knee' && act.age>=act.hit)
        || (grabPreview==='shake' && g.shake?.age>=12)
        || (grabPreview==='throw' && act?.kind==='throw' && act.age>=act.release)){
        s.paused=true;a.sprite.setAlpha(1);grabPreview=null;
      }
    }
    if(airPreview){
      if(airPreview.kick && !airPreview.requested && p.state==='jump' && p.jumpAge>=6){p.request('kick');airPreview.requested=true;}
      if(airPreview.kick?p.action?.displayedFrame.phase==='active':p.state==='jump' && p.jumpAge>=airPreview.at){s.paused=true;a.sprite.setAlpha(1);airPreview=null;}
    }
    if(comboPreview && p.action){
      const clip=comboPreview,data=p.action.data,frame=data.frames[p.action.index];
      if(data.stage===clip.index && clip.index<clip.inputs.length-1 && frame?.cancel){clip.index++;p.request(clip.inputs[clip.index]);}
      else if(data.stage===clip.inputs.length-1 && frame?.phase==='active' && p.action.wasActive){s.paused=true;a.sprite.setAlpha(1);comboPreview=null;}
    }
    status.textContent=`${p.state} · sprite ${a.sprite.frame.name}/${a.sprite.visible} · ${p.action?.displayedFrame.phase??'—'} · combo ${(p.action?.data.stage??0)+1} ×${(p.action?.data.comboSpeed??1).toFixed(2)} · tokens ${s.arcade.combat.tokens.owners.size}/2 · energía ${s.health} · frame ${s.arcade.frame} · x ${a.x.toFixed(1)} y ${a.y.toFixed(1)} z ${(a.z??0).toFixed(1)} · ${game.canvas.width}×${game.canvas.height}`;
  };
  game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  add('Hitboxes',s=>{s.arcade.debugBoxes=!s.arcade.debugBoxes;});
  add('Activar / pausar IA',s=>{s.debugPreview=!s.debugPreview;});
  add('Ocultar pruebas',s=>{stop(s);s.debugPreview=false;s.invulnerableUntil=s.combatTime;game.events.off('poststep',update);panel.remove();});
  document.body.append(panel);
}
