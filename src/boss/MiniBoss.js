import {fitArcadeText} from '../data/arcade.js';

/** Big health bar, entrance notice and "done" timing for an enemy-type boss. */
export class MiniBoss {
  constructor(scene,enemy,def) {
    this.scene=scene;this.enemy=enemy;this.def=def;this.defeatedAt=null;this.noticeUntil=scene.combatTime+2200;
    const style={fontFamily:'monospace',fontSize:'12px',color:'#ffcf69',stroke:'#142127',strokeThickness:3};
    this.name=scene.add.text(480,22,def.name,style).setOrigin(.5,0).setDepth(1000);
    this.barBack=scene.add.rectangle(310,44,340,10,0x14282c).setOrigin(0).setDepth(1000);
    this.bar=scene.add.rectangle(312,46,336,6,0xe45c50).setOrigin(0).setDepth(1000);
    this.notice=scene.add.text(480,103,`¡${def.name} ENTRA A LA PELEA!`,{...style,fontSize:'16px'}).setOrigin(.5).setDepth(1001);
    for(const item of [this.name,this.barBack,this.bar,this.notice])item.setScrollFactor?.(0);
    if(scene.arcade)for(const text of [this.name,this.notice])fitArcadeText(text);
    // The Final Fight HUD shows the boss in its enemy row instead.
    if(scene.hud)for(const item of [this.name,this.barBack,this.bar])item.setVisible(false);
  }
  get done(){return this.defeatedAt!==null && this.scene.combatTime>=this.defeatedAt+(this.def.deathMs??1300);}
  update() {
    const e=this.enemy,now=this.scene.combatTime;
    this.bar.width=336*Math.max(0,e.hp)/e.config.hp;
    if(e.hp<=0 && this.defeatedAt===null){this.defeatedAt=now;this.scene.dismissMinions?.(e);this.notice.setText(`${this.def.name} DERROTADO`);this.noticeUntil=now+(this.def.deathMs??1300);}
    this.notice.setVisible(now<this.noticeUntil);
  }
  destroy(){for(const item of [this.name,this.barBack,this.bar,this.notice])item.destroy();}
}
