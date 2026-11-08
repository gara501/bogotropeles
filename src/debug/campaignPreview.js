import {SUPER} from '../game/SuperPower.js';
import {characters} from '../data/characters.js';
// Opt-in QA shortcuts. Production never imports this module.
export function installCampaignPreview(game) {
  let freezeMotion=false;
  const panel=document.createElement('div');panel.id='campaign-preview';
  panel.style.cssText='position:fixed;right:12px;top:65px;z-index:10;padding:8px;background:#142127ee;border:1px solid #d6ed64';
  const scene=()=>game.scene.isActive('Street')?game.scene.getScene('Street'):null;
  function resolve(all) {
    const s=scene();if(!s || s.finished || s.cinematic)return;
    s.invulnerableUntil=Infinity;
    for(let wave=0;wave<(all?20:1) && !s.waves.cleared;wave++) {
      for(const enemy of s.enemies)if(enemy.hp>0)s.hitEnemy(enemy,{damage:10000,knockback:0,facing:1});
      if(all){s.waves.update();s.stage?.jumpToArena(s.waves.arena);s.waves.update();s.combatTime=Math.max(s.combatTime,s.waves.nextAt);s.waves.update();}
    }
  }
  for(const [text,all] of [['Resolver oleada',false],['Resolver tramo',true]]) {
    const button=document.createElement('button');button.textContent=text;button.onclick=()=>resolve(all);panel.append(button);
  }
  const panela=document.createElement('button');panela.textContent='Equipar panela';panela.onclick=()=>scene()?.panela?.equip();panel.append(panela);
  for(const [key,character] of Object.entries(characters)){
    const button=document.createElement('button');button.textContent=character.name;button.onclick=()=>{
      const s=scene();if(!s)return;s.paused=false;s.keys.A.isDown=s.keys.D.isDown=false;
      s.ensureCharacter(key,()=>{s.switchCharacter(key);(s.panela??s.vuvuzela)?.equip();s.debugPreview=true;});
    };panel.append(button);
  }
  for(const [label,direction] of [['Caminar ←',-1],['Caminar →',1],['Detener',0]]){
    const button=document.createElement('button');button.textContent=label;button.onclick=()=>{
      const s=scene();if(!s)return;s.paused=false;
      s.keys.A.isDown=direction<0;s.keys.D.isDown=direction>0;
      if(direction)s.player.x=direction>0?s.floor.left+100:s.floor.right-100;
    };panel.append(button);
  }
  const capture=document.createElement('button');capture.textContent='Capturar paso';capture.onclick=()=>{
    const s=scene();if(!s)return;s.paused=false;s.keys.A.isDown=false;s.keys.D.isDown=true;s.player.x=s.floor.left+180;freezeMotion=true;
  };panel.append(capture);
  const superButton=document.createElement('button');superButton.textContent='Cargar super';superButton.onclick=()=>{const p=scene()?.superPower;if(p){p.charge=SUPER.hits;p.showCharge();}};panel.append(superButton);
  const hide=document.createElement('button');hide.textContent='Ocultar pruebas';hide.onclick=()=>{const s=scene();if(s){s.paused=false;s.keys.A.isDown=s.keys.D.isDown=false;}game.events.off('poststep',update);panel.remove();};panel.append(hide);
  const status=document.createElement('output');status.style.cssText='display:block;font:10px monospace;color:#e8edce';panel.append(status);
  const update=()=>{const s=scene();if(!s?.arcade)return;const item=s.panela??s.vuvuzela;
    if(freezeMotion && item?.held.texture?.key?.endsWith('-run')){s.paused=true;s.player.sprite.setAlpha(1);item.held.setAlpha(1);freezeMotion=false;}
    status.textContent=`${s.arcade.player.state} · ${item?.held.texture?.key??'sin objeto'} · pose ${item?.held.frame?.name??0}`;
  };
  game.events.on('poststep',update);game.events.once('destroy',()=>game.events.off('poststep',update));
  document.body.append(panel);
}
