import {waveSize} from '../data/campaign.js';
import {TaxiRush} from '../stage/TaxiRush.js';

// With a StageCamera (s.stage) waves are grouped into arenas: the camera stays locked
// while an arena has enemies; once its waves are cleared the player must walk to the
// next arena (GO →) before the next wave spawns. Without a stage (unit tests, legacy
// loop) the original single-screen behaviour is preserved.
export class WaveDirector {
  constructor(scene){this.scene=scene;this.spawned=0;this.wave=0;this.nextAt=0;this.waiting=false;this.arena=0;this.arenaWave=0;}
  get cleared(){return this.spawned===this.scene.level.total && this.scene.defeated===this.scene.level.total;}
  get awaitingAdvance(){
    const s=this.scene;
    return !s.taxiRush?.active && Boolean(s.stage) && this.spawned<s.level.total && s.enemies.every(e=>e.hp<=0) && !s.stage.reached(this.arena);
  }
  update() {
    const s=this.scene;
    if(s.paused || s.finished || s.health<=0 || this.cleared)return;
    for(const enemy of s.enemies)if(enemy.hp>0)return;
    if(this.spawned>=s.level.total)return;
    if(s.stage){
      if(this.arenaWave>=s.stage.wavesPerArena){this.arena++;this.arenaWave=0;this.waiting=false;}
      if(s.level.taxiRush && !s.enemyTest && !this.rushSkipped && this.arena>=s.level.taxiRush.arena){
        s.taxiRush??=new TaxiRush(s,s.level.taxiRush);
        if(!s.taxiRush.done){s.taxiRush.start(this.arena);return;}
      }
      if(!s.stage.reached(this.arena))return;
    }
    // First wave: immediate. Same arena: normal gap. Arriving at a new arena: half gap.
    if(!this.waiting){const delay=!this.spawned?0:this.arenaWave?s.level.gap:s.level.gap/2;this.nextAt=s.combatTime+delay;this.waiting=true;}
    if(s.combatTime<this.nextAt)return;
    const count=waveSize(this.wave,s.level.total-this.spawned);
    for(let i=0;i<count;i++) {
      const index=this.spawned++,key=s.level.enemies[index%s.level.enemies.length];
      s.spawnEnemy(key,index,i,count,this.wave);
    }
    this.wave++;this.arenaWave++;this.waiting=false;s.updateCounter();
  }
  /** Boss checkpoints: every wave counts as resolved and the camera sits in the last arena. */
  skipToEnd(){this.rushSkipped=true;this.scene.taxiRush?.skip();this.spawned=this.scene.level.total;this.arena=this.scene.stage?.layout.arenas-1||0;this.arenaWave=0;}
}
