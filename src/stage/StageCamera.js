import {ARCADE} from '../data/arcade.js';
import {stageLayout,arenaScroll,nextScroll,stepScroll,floorSpan} from './scroll.js';
import {ParallaxBackground} from './ParallaxBackground.js';
import {AmbientTraffic} from './AmbientTraffic.js';
import {StageProps} from './StageProps.js';
import {StageRain} from './StageRain.js';
import {GroundPigeons} from './GroundPigeons.js';

/** Owns the camera scroll, the walkable floor span, the parallax layers and the GO → prompt. */
export class StageCamera {
  constructor(scene) {
    this.scene=scene;this.camera=scene.cameras.main;this.layout=stageLayout(scene.level);this.scrollX=0;this.time=0;
    this.background=new ParallaxBackground(scene,scene.level.layers??[{key:scene.level.key,factor:1}]);
    this.go=scene.add.text(ARCADE.screen.width-36,250,'GO →',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'30px',color:'#ffcf69',fontStyle:'bold',stroke:'#142127',strokeThickness:6})
      .setOrigin(1,.5).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.traffic=scene.level.traffic?new AmbientTraffic(scene,scene.level.traffic,this.background):null;
    this.props=new StageProps(scene,scene.level.props,this.layout.width);
    this.rain=scene.level.rain?new StageRain(scene,scene.level.rain):null;
    this.pigeons=scene.level.groundPigeons?new GroundPigeons(scene,scene.level.groundPigeons,this.layout.width):null;
    this.apply(0);
  }
  get wavesPerArena(){return this.layout.perArena;}
  get width(){return this.layout.width;}
  arenaScroll(index){return arenaScroll(this.layout,index);}
  reached(index){return this.scrollX>=this.arenaScroll(index);}
  /** Right edge of the world the player may currently see. */
  get limit(){return this.arenaScroll(this.scene.waves?.arena??0)+ARCADE.screen.width;}
  update(frame=0) {
    const s=this.scene;this.time+=ARCADE.clock.stepMs;
    if(!s.finished && !s.cinematic && s.health>0 && !s.paused)this.apply(stepScroll(this.scrollX,nextScroll({scrollX:this.scrollX,playerX:s.player.x,limit:this.limit})));
    this.background.update(this.scrollX,this.time);
    this.traffic?.update(this.scrollX);
    this.props?.update(ARCADE.clock.stepMs);
    this.rain?.update(ARCADE.clock.stepMs/1000);
    this.pigeons?.update();
    const waiting=Boolean(s.waves?.awaitingAdvance) && !s.finished && s.health>0;
    this.go.setVisible(waiting && frame%40<26);
  }
  apply(scrollX) {
    this.scrollX=scrollX;this.camera.scrollX=scrollX;
    Object.assign(this.scene.floor,floorSpan(scrollX));
    this.background.update(scrollX,this.time);
  }
  /** Checkpoints and QA: place the camera at an arena and keep the player inside it. */
  jumpToArena(index) {
    this.apply(this.arenaScroll(index));
    const p=this.scene.player,{left,right}=this.scene.floor;
    if(p){p.x=Math.max(left,Math.min(right,p.x<left?left+135:p.x));this.scene.placeFighter?.(p,p.z??0);}
  }
  destroy(){this.background.destroy();this.traffic?.destroy();this.props?.destroy();this.rain?.destroy();this.pigeons?.destroy();this.go.destroy();}
}
