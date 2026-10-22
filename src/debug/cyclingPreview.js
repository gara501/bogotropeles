import {characters} from '../data/characters.js';
import {CYCLING} from '../cycling/CyclingRun.js';
export function installCyclingPreview(game){
  const panel=document.createElement('div');panel.id='cycling-preview';panel.style.cssText='position:fixed;right:12px;top:65px;z-index:10;background:#102027ef;padding:8px;max-width:300px;display:flex;gap:5px;flex-wrap:wrap';
  const add=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{const s=game.scene.getScene('Street');if(s.cycling)action(s);};panel.append(b);};
  for(const [key,c] of Object.entries(characters))add(c.name,s=>s.switchCharacter(key));
  for(const kind of ['cyclist','dog','hole'])add(`Choque ${kind}`,s=>{const r=s.cycling.run;r.invulnerableUntil=0;r.obstacles.push({id:r.nextId++,kind,variant:0,x:CYCLING.playerX+80,y:r.y,hit:false});});
  add('Tarjeta +1000',s=>{const r=s.cycling.run;r.pickups.push({id:r.nextId++,kind:'money',x:CYCLING.playerX+180,y:r.y});});
  add('Changua',s=>{const r=s.cycling.run;s.health=30;s.healthBar.width=60;r.pickups.push({id:r.nextId++,kind:'full',x:CYCLING.playerX+600,y:r.y});});
  add('Hora pico',s=>{const r=s.cycling.run;r.elapsed=60000;r.extraDistance=0;r.dashUntil=0;r.obstacles=[];r.pickups=[];r.nextWave=r.elapsed;r.nextPickup=r.elapsed;});
  add('Guardián',s=>{const r=s.cycling.run;r.obstacles=[];r.pickups=[];r.spawnGuardian();r.nextWave=r.elapsed+3400;});
  add('Dash',s=>{s.cycling.run.startDash();});
  add('↑ Esquivar',s=>{s.cycling.run.y=CYCLING.top;});add('↓ Esquivar',s=>{s.cycling.run.y=CYCLING.bottom;});
  add('Perder vida',s=>{s.health=0;});add('Llegar a meta',s=>{const r=s.cycling.run;r.elapsed=CYCLING.duration-1500;r.extraDistance=0;r.dashUntil=0;r.obstacles=[];r.pickups=[];});
  add('Reiniciar',s=>s.restartLevel());
  add('Congelar vista',s=>s.cycling.setPaused(!s.paused,false));
  const status=document.createElement('output');status.style.cssText='width:100%;color:#d6ed64;font:11px monospace';panel.append(status);
  const update=()=>{const s=game.scene.getScene('Street');if(s.cycling)status.textContent=`${s.character.name} · ${Math.floor(s.cycling.run.elapsed)} ms · HP ${s.health} · VIDAS ${s.run.lives} · ${s.paused?'PAUSA':s.finished?'META':'PEDALEANDO'}`;};
  game.events.on('poststep',update);game.events.once('destroy',()=>{panel.remove();game.events.off('poststep',update);});
  add('Ocultar pruebas',()=>panel.remove());document.body.append(panel);
}
