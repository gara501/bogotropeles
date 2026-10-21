import {ARCADE} from '../data/arcade.js';
import {viewLeft} from '../stage/scroll.js';

/** Telegraphs scattered landing spots, then lobs spray cans from Pinturita to those spots. */
export class SprayBarrage {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.cans=[];}
  get active(){return this.cans.length>0;}
  launch(owner,config,damage){
    if(this.active || owner.hp<=0)return false;
    const s=this.scene,rand=(lo,hi)=>lo+(hi-lo)*this.random(),vx=viewLeft(s);
    const left=Math.max(s.floor.left,vx+32),right=Math.min(s.floor.right,vx+ARCADE.screen.width-32);
    const top=s.floor.top+12,bottom=s.floor.bottom-12;
    const count=Math.floor(rand(config.count[0],config.count[1]+1));
    for(let i=0;i<count;i++){
      // Separate horizontal bands keep a random volley from clustering in one place.
      const x=i===0?Math.max(left,Math.min(right,s.player.x)):left+(right-left)*(i+rand(.15,.85))/count;
      const y=i===0?Math.max(top,Math.min(bottom,s.player.y)):rand(top,bottom);
      const startX=owner.x+owner.facing*55,startY=owner.y-(owner.config.throw.lift??92);
      const marker=s.add.ellipse(x,y,config.radius*2,config.depth*2,0xff43c6,.3).setDepth(y-2);
      const sprite=s.add.image(startX,startY,owner.config.throw.texture).setDisplaySize(42,22).setDepth(owner.y+2).setVisible(false);
      this.cans.push({x,y,startX,startY,sprite,marker,owner,damage,config,
        at:s.combatTime+i*config.stagger,duration:rand(config.flight[0],config.flight[1]),direction:Math.sign(x-startX)||1});
    }
    return true;
  }
  update(){
    const s=this.scene;
    this.cans=this.cans.filter(can=>{
      if(can.owner.hp<=0){this.destroyCan(can);return false;}
      const age=s.combatTime-can.at;
      if(age<0)return true;
      const t=Math.min(1,age/can.duration);
      can.marker.setAlpha?.(.25+t*.4);
      can.sprite.setVisible(true).setPosition(can.startX+(can.x-can.startX)*t,
        can.startY+(can.y-can.startY)*t-can.config.arc*4*t*(1-t));
      can.sprite.rotation=can.direction*t*Math.PI*5;
      if(t<1)return true;
      this.destroyCan(can);
      const p=s.player,c=can.config;
      if(Math.abs(p.x-can.x)<=c.radius && Math.abs(p.y-can.y)<=c.depth && Math.max(p.z??0,s.jumpHeight??0)<24)
        s.hitPlayer(can.damage,null,can.owner);
      s.paintStain?.(can.x,can.y,c.stain,can.owner);
      return false;
    });
  }
  destroyCan(can){can.sprite.destroy();can.marker.destroy();}
  clear(){for(const can of this.cans)this.destroyCan(can);this.cans=[];}
}
