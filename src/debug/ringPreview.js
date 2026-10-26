/** Development-only controls for the four real consecutive fights. */
export function installRingPreview(game){
  const panel=document.createElement('div');panel.id='ring-preview';panel.style.cssText='position:fixed;right:12px;top:70px;z-index:10;display:flex;flex-wrap:wrap;gap:6px;max-width:290px;padding:8px;background:#142127ee;border:1px solid #d6ed64';
  const scene=()=>game.scene.isActive('Street')?game.scene.getScene('Street'):null;
  const add=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{const s=scene();if(s?.ringBonus)fn(s,s.ringBonus);};panel.append(b);};
  add('Vencer rival', (s,b)=>{if(b.current && !b.locked){b.current.invulnerableUntil=0;s.hitEnemy(b.current,{damage:1e6,knockback:0,facing:1});}});
  add('Restablecer 2 minutos',(s,b)=>{if(!b.locked)b.round.remainingMs=120000;});
  add('Últimos 5 segundos',(s,b)=>{b.round.remainingMs=5000;});
  add('Player protegido',(s)=>{s.invulnerableUntil=Infinity;s.health=100;});
  add('Probar ataque',(s,b)=>{const m=s.arcade.enemies.get(b.current)?.ringFighter;if(m)m.start(m.kind==='cristiano'?'flail':m.kind==='piernas'?'money':m.kind==='brincolas'?'hop':'cap');});
  add('MiniLaja a 19%',(s,b)=>{if(b.current?.key==='minilaja')b.current.hp=b.current.config.hp*.19;});
  add('Player a la lona',(s,b)=>{if(!b.locked){s.invulnerableUntil=0;s.respawnProtectedUntil=0;s.hitPlayer(1000);}});
  add('Ocultar pruebas',()=>panel.remove());
  const status=document.createElement('output');status.style.cssText='width:100%;font:11px monospace;color:white';panel.append(status);
  game.events.on('poststep',()=>{const s=scene(),b=s?.ringBonus;if(!b)return;const m=s.arcade.enemies.get(b.current)?.ringFighter;status.textContent=`${b.round.state} · ${b.round.defeated}/4 · ${b.current?.config.name??'entrada'} · ${m?.mode??''}`;});
  document.body.append(panel);
}
