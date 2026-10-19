import {PICKUPS as C,CONTAINERS,ITEMS,containersFor} from '../data/pickups.js';
import {ARCADE} from '../data/arcade.js';

/** Breakable containers (can / taquilla) that drop energy: usually a pandebono (+25),
 * and every C.fullEvery-th drop of the level a changua that refills all energy.
 * `cans` holds every container, whatever its kind (specials and combat target that list). */
export class EnergyPickups {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.rolled=new Set();this.cans=[];this.items=[];this.drops=0;}
  spawn(x,y,kind=containersFor(this.scene.levelIndex??0)[0]){
    const s=this.scene,c=CONTAINERS[kind],sprite=s.add.image(x,y,`${kind}-0`).setOrigin(.5,1).setScale(c.height/c.rects[0][3]).setDepth(y);
    const can={x,y,kind,hp:C.hits,config:{height:c.height,hurtbox:{halfWidth:C.halfWidth,halfDepth:C.halfDepth}},sprite,brokenAt:null,hitAt:null};
    this.cans.push(can);return can;
  }
  hit(can){
    const s=this.scene;if(can.hp<=0 || s.health<=0 || s.paused || s.finished || s.cinematic)return false;
    can.hp--;can.hitAt=s.arcade.frame;
    if(!can.hp){can.brokenAt=s.arcade.frame;s.sfx?.play('metalCrack');}
    can.sprite.setTexture(`${can.kind}-${can.hp?1:3}`);s.arcade.combat.impact(s.player,can,{finisher:!can.hp});return true;
  }
  contact(actor,attack,targets){
    for(const can of this.cans)if(can.hp>0 && !targets.has(can) && this.scene.arcade.combat.touches(actor,can,attack)){
      targets.add(can);this.hit(can);
    }
  }
  /** Drops a pickup; without `kind`, every C.fullEvery-th drop is the full refill. */
  drop(x,y,kind=++this.drops%C.fullEvery===0?'full':'energy'){
    const def=ITEMS[kind];
    const sprite=this.scene.add.image(x,y,def.texture).setOrigin(.5,1).setDisplaySize(def.width,def.height).setDepth(y);
    const item={x,y,kind,sprite};this.items.push(item);return item;
  }
  update(frame){
    const s=this.scene;if(s.paused || s.finished || s.cinematic || s.health<=0)return;
    const arena=s.waves?.arena??0;
    if(!this.rolled.has(arena) && (!s.stage || s.stage.reached(arena))){
      this.rolled.add(arena);
      if(this.random()<C.chance){
        const left=s.stage?.arenaScroll(arena)??0,kinds=containersFor(s.levelIndex??0);
        const x=left+ARCADE.screen.width*(C.spawnLeft+this.random()*(C.spawnRight-C.spawnLeft));
        const y=s.floor.top+C.laneMargin+this.random()*Math.max(0,s.floor.bottom-s.floor.top-2*C.laneMargin);
        this.spawn(x,y,kinds.length>1?kinds[Math.min(kinds.length-1,Math.floor(this.random()*kinds.length))]:kinds[0]);
      }
    }
    this.cans=this.cans.filter(can=>{
      if(can.brokenAt!==null){
        const age=frame-can.brokenAt,pose=3+Math.min(2,Math.floor(age/C.poseFrames));can.sprite.setTexture(`${can.kind}-${pose}`);
        if(age>=C.poseFrames*3){can.sprite.destroy();this.drop(can.x,can.y);return false;}
      }else if(can.hitAt!==null && frame-can.hitAt>=C.poseFrames)can.sprite.setTexture(`${can.kind}-2`);
      return true;
    });
    this.items=this.items.filter(item=>{
      const p=s.player,def=ITEMS[item.kind??'energy'];
      if(def.frames)item.sprite.setTexture(`item-full-${Math.floor(frame/def.frameTicks)%def.frames}`); // rising steam
      if(s.health>=C.maxEnergy || (p.z??0)>C.pickupZ || Math.abs(p.x-item.x)>C.pickupX || Math.abs(p.y-item.y)>=C.pickupY)return true;
      s.health=Math.min(C.maxEnergy,s.health+def.heal);s.healthBar.width=s.health*2;
      s.iphone?.updateHud();s.books?.updateHud();s.sfx?.play('item');item.sprite.destroy();return false;
    });
  }
  destroy(){for(const object of [...this.cans,...this.items])object.sprite.destroy();this.cans=[];this.items=[];this.rolled.clear();this.drops=0;}
}
