import {PICKUPS as C,CONTAINERS,ITEMS,containersFor} from '../data/pickups.js';
import {ARCADE} from '../data/arcade.js';

/** Breakable containers (can / taquilla / parking / boxes) that drop items: every C.fullEvery-th drop of the level a
 * changua (all energy); otherwise a TuLlave card (+1000 points, C.moneyChance) or a pandebono (+25 energy).
 * `cans` holds every container, whatever its kind (specials and combat target that list). */
export class EnergyPickups {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.rolled=new Set();this.cans=[];this.items=[];this.drops=0;}
  spawn(x,y,kind=containersFor(this.scene.level.combatIndex??this.scene.levelIndex??0)[0]){
    const s=this.scene,c=CONTAINERS[kind],sprite=s.add.image(x,y,`${kind}-0`).setOrigin(.5,1).setScale(c.height/c.rects[0][3]).setDepth(y);
    const can={x,y,kind,hp:C.hits,config:{height:c.height,hurtbox:{halfWidth:C.halfWidth,halfDepth:C.halfDepth}},sprite,brokenAt:null,hitAt:null};
    this.cans.push(can);return can;
  }
  hit(can){
    const s=this.scene;if(can.hp<=0 || s.health<=0 || s.paused || s.finished || s.cinematic)return false;
    can.hp--;can.hitAt=s.arcade.frame;
    if(!can.hp){can.brokenAt=s.arcade.frame;s.sfx?.play('metalCrack');}
    const poses=CONTAINERS[can.kind].poses;can.sprite.setTexture(`${can.kind}-${can.hp?poses.hit:poses.breaking[0]}`);s.arcade.combat.impact(s.player,can,{finisher:!can.hp});return true;
  }
  contact(actor,attack,targets){
    for(const can of this.cans)if(can.hp>0 && !targets.has(can) && this.scene.arcade.combat.touches(actor,can,attack)){
      targets.add(can);this.hit(can);
    }
  }
  /** Drops a pickup; without `kind`, every C.fullEvery-th drop is the full refill. */
  drop(x,y,kind=++this.drops%C.fullEvery===0?'full':this.random()<C.moneyChance?'money':'energy'){
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
        const left=s.stage?.arenaScroll(arena)??0,kinds=containersFor(s.level.combatIndex??s.levelIndex??0);
        const x=left+ARCADE.screen.width*(C.spawnLeft+this.random()*(C.spawnRight-C.spawnLeft));
        const y=s.floor.top+C.laneMargin+this.random()*Math.max(0,s.floor.bottom-s.floor.top-2*C.laneMargin);
        this.spawn(x,y,kinds.length>1?kinds[Math.min(kinds.length-1,Math.floor(this.random()*kinds.length))]:kinds[0]);
      }
    }
    this.cans=this.cans.filter(can=>{
      if(can.brokenAt!==null){
        const breaking=CONTAINERS[can.kind].poses.breaking,age=frame-can.brokenAt;
        can.sprite.setTexture(`${can.kind}-${breaking[Math.min(breaking.length-1,Math.floor(age/C.poseFrames))]}`);
        if(age>=C.poseFrames*Math.max(3,breaking.length)){can.sprite.destroy();this.drop(can.x,can.y);return false;}
      }else if(can.hitAt!==null && frame-can.hitAt>=C.poseFrames)can.sprite.setTexture(`${can.kind}-${CONTAINERS[can.kind].poses.dented}`);
      return true;
    });
    this.items=this.items.filter(item=>{
      const p=s.player,def=ITEMS[item.kind??'energy'];
      if(def.frames)item.sprite.setTexture(`${def.prefix}-${Math.floor(frame/def.frameTicks)%def.frames}`); // steam, sparkles, spinning card
      // Energy items wait while energy is full; the card can always be picked up.
      if((def.heal && s.health>=C.maxEnergy) || (p.z??0)>C.pickupZ || Math.abs(p.x-item.x)>C.pickupX || Math.abs(p.y-item.y)>=C.pickupY)return true;
      if(def.heal){s.health=Math.min(C.maxEnergy,s.health+def.heal);s.healthBar.width=s.health*2;}
      if(def.score){s.addScore?.(def.score);this.scorePopup(item.x,item.y,def.score);}
      s.iphone?.updateHud();s.books?.updateHud();s.sfx?.play('item');item.sprite.destroy();return false;
    });
  }
  /** "+1000" rising over a picked-up card. */
  scorePopup(x,y,points){
    const s=this.scene;if(s.scorePopup)return s.scorePopup(x,y-60,points);if(!s.add?.text)return;
    const label=s.add.text(x,y-60,`+${points}`,{fontFamily:"'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",fontSize:'22px',fontStyle:'bold',
      color:'#d6ed64',stroke:'#14282c',strokeThickness:3}).setOrigin(.5).setDepth(952);
    s.tweens?.add?.({targets:label,y:label.y-30,alpha:0,duration:800,onComplete:()=>label.destroy()});
  }
  destroy(){for(const object of [...this.cans,...this.items])object.sprite.destroy();this.cans=[];this.items=[];this.rolled.clear();this.drops=0;}
}
