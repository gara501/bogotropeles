// Opt-in QA shortcuts. Production never imports this module.
export function installCampaignPreview(game) {
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
  const hide=document.createElement('button');hide.textContent='Ocultar pruebas';hide.onclick=()=>panel.remove();panel.append(hide);
  document.body.append(panel);
}
