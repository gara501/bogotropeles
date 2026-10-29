import {PICKUPS as C,CONTAINERS,ITEMS,containersFor} from '../data/pickups.js';
import {ARCADE} from '../data/arcade.js';

/** Breakable containers (can / taquilla / parking / boxes) that drop items: every C.fullEvery-th drop of the level a
 * changua (all energy); otherwise a TuLlave card (+1000 points, C.moneyChance) or a pandebono (+25 energy).
 * `cans` holds every container, whatever its kind (specials and combat target that list). */
export class EnergyPickups {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.rolled=new Set();this.cans=[];this.items=[];this.drops=0;}
  /** Place the finite route before it is seen; arena unlocks never create visible objects. */
  prepare(){
    const s=this.scene,count=s.stage?.layout?.arenas??1;
    for(let arena=0;arena<count;arena++){
      if(this.rolled.has(arena))continue;
      this.rolled.add(arena);
      const left=s.stage?.arenaScroll(arena)??0;
      if(s.level.potatoSupplies){
        const position=this.groundPosition(left+ARCADE.screen.width*.7,s.floor.top+28,left);
        if(position)this.spawn(position.x,position.y,'boxes').potatoSacks=2;
      }
      if(this.random()<C.chance){
        const kinds=containersFor(s.level.combatIndex??s.levelIndex??0);
        const x=left+ARCADE.screen.width*(C.spawnLeft+this.random()*(C.spawnRight-C.spawnLeft));
        const y=s.floor.top+C.laneMargin+this.random()*Math.max(0,s.floor.bottom-s.floor.top-2*C.laneMargin);
        const kind=kinds.length>1?kinds[Math.min(kinds.length-1,Math.floor(this.random()*kinds.length))]:kinds[0];
        const position=this.groundPosition(x,y,left);
        if(position)this.spawn(position.x,position.y,kind);
      }
    }
  }
  /** Reserve ground footprints, including scenery props that extend into the walkable street. */
  groundPosition(x,y,left){
    const s=this.scene,top=s.floor.top+C.laneMargin,bottom=s.floor.bottom-C.laneMargin;
    const minX=left+ARCADE.screen.width*C.spawnLeft,maxX=left+ARCADE.screen.width*C.spawnRight;
    // Try the rolled position first, then deterministic alternatives without rerolling the level.
    const positions=[{x,y:Math.max(top,Math.min(bottom,y))}];
    for(let lane=0;lane<=8;lane++)for(let column=0;column<=8;column++)positions.push({x:minX+(maxX-minX)*column/8,y:bottom-(bottom-top)*lane/8});
    return positions.find(p=>!this.cans.some(c=>Math.abs(c.x-p.x)<80 && Math.abs(c.y-p.y)<32)
      && !(s.stage?.props?.items??[]).some(prop=>!prop.walk && prop.factor===1
        && Math.abs(prop.sprite.x-p.x)<(prop.sprite.displayWidth??0)/2+40
        && p.y<prop.y+28 && p.y>prop.y-20));
  }
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
    this.prepare();
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
