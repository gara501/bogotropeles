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
  add('Perder vida',s=>{s.invulnerableUntil=0;s.respawnProtectedUntil=0;s.hitPlayer(100);});
  add('Última vida',s=>{s.run.lives=1;s.updateRunStatus();});
  add('Vencer jefe',s=>{if(s.boss&&!s.boss.dead){s.boss.state='idle';s.boss.guardUntil=0;s.boss.hit({damage:10000,range:2000,area:true,knockback:0},{x:s.boss.x,y:s.boss.y});}});
  add('Reiniciar prueba',s=>{if(s.enemyTest)s.scene.restart({character:s.characterKey,level:s.levelIndex,enemyTest:s.enemyTest});else s.restartLevel();});
  const hide=document.createElement('button');hide.textContent='Ocultar pruebas';hide.onclick=()=>panel.remove();panel.append(hide);
  document.body.append(panel);
}
