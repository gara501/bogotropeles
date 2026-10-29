import {ARCADE} from '../data/arcade.js';

/**
 * Tear-gas clouds (level 5 boss). The canister bursts where it lands: an immediate blast hurts a player
 * inside the radius, then the cloud lingers and keeps hurting (every `every` ms) until it fades after `ms`.
 * Textures: gas-1 (burst), gas-2 (small cloud), gas-3 (full cloud), cut from enemy_boss_5.png.
 */
export class GasClouds {
  constructor(scene){this.scene=scene;this.clouds=[];}
  inside(cloud,p){return (p.z??0)<40 && Math.abs(p.x-cloud.x)<=cloud.radius && Math.abs(p.y-cloud.y)<=cloud.depth+ARCADE.body.halfDepth;}
  spawn(x,y,gas,owner=null) {
    const s=this.scene,{left,right,top,bottom}=s.floor;
    x=Math.max(left,Math.min(right,x));y=Math.max(top,Math.min(bottom,y));
    const sprite=s.add.image(x,y+6,'gas-1').setOrigin(.5,1).setDepth(y+30);
    const cloud={x,y,radius:gas.radius,depth:gas.depth,damage:gas.damage,every:gas.every,ms:gas.ms,born:s.combatTime,until:s.combatTime+gas.ms,hitAt:s.combatTime,owner,sprite};
    this.size(cloud,0);this.clouds.push(cloud);
    s.sfx?.play('stomp');
    if(s.health>0 && this.inside(cloud,s.player))s.hitPlayer(gas.blast,null,owner);
    return cloud;
  }
  size(cloud,age) {
    // burst → small cloud → full cloud in the first 450 ms
    const frame=age<150?1:age<450?2:3,width=cloud.radius*2.3*(frame===1?.55:frame===2?.8:1);
    const texture=cloud.sprite.scene?.textures?.get?.(`gas-${frame}`)?.getSourceImage?.();
    cloud.sprite.setTexture?.(`gas-${frame}`);
    cloud.sprite.setDisplaySize?.(width,texture?.height?width*texture.height/texture.width:width*.5);
  }
  update() {
    const s=this.scene,now=s.combatTime,p=s.player;
    this.clouds=this.clouds.filter(cloud=>{
      const age=now-cloud.born,left=cloud.until-now;
      if(left<=0){cloud.sprite.destroy();return false;}
      this.size(cloud,age);cloud.sprite.setAlpha?.(Math.min(.9,left/cloud.ms*1.6));
      s.fx?.lamp(cloud,cloud.x,cloud.y-24,{color:0xb6ff7a,radius:cloud.radius*.9,intensity:.22*Math.min(1,left/cloud.ms*2)});
      if(s.health>0 && now>=cloud.hitAt+cloud.every && this.inside(cloud,p) && s.hitPlayer(cloud.damage,null,cloud.owner))cloud.hitAt=now;
      return true;
    });
  }
  clear(){for(const cloud of this.clouds)cloud.sprite.destroy();this.clouds=[];}
}
