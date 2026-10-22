import {ARCADE} from '../data/arcade.js';
import {CHIVA_CROWD,CROWD_HEIGHT} from '../data/chivaCrowd.js';
import {CHIVA_BONUS,ChivaBonusRound} from './chivaRules.js';

const COLORS=[0xff44b6,0x43e8ff,0xd6ed64,0x9c79ff];
const FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const VEHICLE={x:560,bottom:454,width:479*205/234,height:205};

/** Implements the destructible interface used by punches, kicks, the phone and the books. */
export class ChivaBonus {
  constructor(scene){
    this.scene=scene;this.round=new ChivaBonusRound();this.age=0;this.awarded=false;this.ready=false;this.items=[];this.scaredAt=null;
    // The bonus target sits behind the playable strip, including its destruction smoke.
    const vehicleDepth=scene.floor.top-2;
    this.dim=scene.add.rectangle(0,78,960,430,0x07091c,.42).setOrigin(0).setDepth(1);
    this.lights=scene.add.graphics().setDepth(5);this.smoke=scene.add.graphics().setDepth(vehicleDepth+1);
    const sprite=scene.add.image(VEHICLE.x,VEHICLE.bottom,'bonus-chiva',0).setOrigin(.5,1).setScale(205/234).setDepth(vehicleDepth);
    this.target={x:VEHICLE.x,y:450,hp:CHIVA_BONUS.hitsRequired,sprite,config:{height:205,hurtbox:{halfWidth:VEHICLE.width/2,halfDepth:12}}};
    this.collisionBox={left:VEHICLE.x-VEHICLE.width/2,right:VEHICLE.x+VEHICLE.width/2,
      top:VEHICLE.bottom-VEHICLE.height,bottom:VEHICLE.bottom};
    this.cans=[this.target];
    // Keep the front-right space free for Coste's entrance and kneeling animation.
    this.crowd=[[80,410],[165,405],[285,410],[115,490],[810,385],[885,395],[925,410],[915,490]].map(([x,y],i)=>{
      const npc=CHIVA_CROWD[i],texture=scene.textures.get(npc.key),scale=CROWD_HEIGHT/texture.referenceHeight;
      const width=texture.get(0).width*scale;
      x=clamp(x,width/2+8,ARCADE.screen.width-width/2-8);
      const shadow=scene.add.ellipse(x,y,width*.6,10,0x071018,.35).setDepth(y-1);
      const image=scene.add.image(x,y+4*scale,npc.key,0).setOrigin(.5,1).setScale(scale).setDepth(y).setFlipX(x>560);
      return {image,shadow,index:i,x,y,scale};
    });
    this.coste=scene.add.image(1030,480,'bonus-coste',0).setOrigin(.5,1).setScale(108/360).setFlipX(true).setDepth(520).setVisible(false);
    this.costeShadow=scene.add.ellipse(1030,480,42,10,0x071018,.4).setDepth(519).setVisible(false);
    const text=(x,y,value,size,color='#ffffff')=>scene.add.text(x,y,value,{fontFamily:FONT,fontSize:`${size}px`,fontStyle:'bold',color,
      stroke:'#071018',strokeThickness:4,align:'center'}).setOrigin(.5).setDepth(1004).setScrollFactor(0);
    this.title=text(480,107,'BONUS · DESTRUYE LA CHIVA',30,'#ffe14d');
    this.instructions=text(480,136,'30 SEGUNDOS · 5000 AL DESTRUIRLA · SI NO, 100 POR GOLPE',16);
    this.barBack=scene.add.rectangle(280,157,400,10,0x142127).setOrigin(0).setDepth(1004);
    this.bar=scene.add.rectangle(280,157,400,10,0xffd643).setOrigin(0).setDepth(1005);
    this.status=text(480,184,'',18,'#d6ed64');
    this.count=text(480,277,'3',72,'#ffe14d');
    this.line=text(800,353,'',20).setVisible(false);
    scene.timeLeft=CHIVA_BONUS.seconds*1000;
  }
  get locked(){return this.round.state!=='playing';}
  /** A solid vehicle, not a platform: ground position stays outside even during jumps and dashes. */
  resolveMovement(previous=this.scene.player){
    const s=this.scene,p=s.player,b=this.collisionBox;
    const halfWidth=p.config?.hurtbox?.halfWidth??ARCADE.body.halfWidth;
    const halfDepth=p.config?.hurtbox?.halfDepth??ARCADE.body.halfDepth;
    const left=b.left-halfWidth,right=b.right+halfWidth,top=b.top-halfDepth,bottom=b.bottom+halfDepth;
    const dx=p.x-previous.x,dy=p.y-previous.y;
    let x=previous.x,y=previous.y;
    // Recover a stale/spawned position inside the body using the nearest reachable edge.
    if(x>left && x<right && y>top && y<bottom){
      const exits=[{x:left,y,d:x-left},{x:right,y,d:right-x},{x,y:top,d:y-top},{x,y:bottom,d:bottom-y}]
        .filter(exit=>exit.x>=s.floor.left && exit.x<=s.floor.right && exit.y>=s.floor.top && exit.y<=s.floor.bottom);
      const nearest=exits.sort((a,b)=>a.d-b.d)[0];
      if(nearest){x=nearest.x;y=nearest.y;}
    }
    let nextX=x+dx,nextY=y+dy;
    // Resolve each axis separately so diagonal movement slides along the body without tunnelling.
    if(y>top && y<bottom){
      if(x<=left && nextX>left)nextX=left;
      else if(x>=right && nextX<right)nextX=right;
    }
    if(nextX>left && nextX<right){
      if(y<=top && nextY>top)nextY=top;
      else if(y>=bottom && nextY<bottom)nextY=bottom;
    }
    p.x=clamp(nextX,s.floor.left,s.floor.right);p.y=clamp(nextY,s.floor.top,s.floor.bottom);
  }
  contact(actor,attack,targets){
    if(this.locked || targets.has(this.target) || !this.scene.arcade.combat.touches(actor,this.target,attack))return;
    targets.add(this.target);this.hit(this.target);
  }
  hit(target){
    const s=this.scene;
    if(target!==this.target || s.paused || s.finished || s.health<=0 || !this.round.hit())return false;
    this.scaredAt??=this.age;
    target.hp=CHIVA_BONUS.hitsRequired-this.round.hits;target.sprite.setFrame(this.round.damageFrame);
    this.hitUntil=this.age+80;
    const x=clamp(s.player.x+s.facing*65,target.x-195,target.x+195);
    s.arcade.combat.impact(s.player,{...target,x},{type:'punch',finisher:target.hp===0,facing:s.facing});
    s.sfx?.play(target.hp?'bar':'metalCrack');return true;
  }
  /** Called before attacks each fixed step: a hit at or after the deadline cannot score. */
  tick(){
    const s=this.scene;if(s.paused || this.ready)return;
    this.resolveMovement();
    this.age+=ARCADE.clock.stepMs;this.round.step(ARCADE.clock.stepMs);s.timeLeft=this.round.remainingMs;
    if(this.round.resolved && !this.awarded){
      this.awarded=true;this.resultAt=this.age;s.addScore(this.round.points);
      s.arcade.clearInput();s.arcade.player.transition('walk');s.playerAttack=null;
      s.iphone?.clear();s.books?.clear();s.vuvuzela?.clearHeld();
      this.count.setVisible(false);this.instructions.setText(this.round.state==='won'?'¡DESTRUCCIÓN TOTAL! +5000 PUNTOS':`TIEMPO AGOTADO · ${this.round.hits} GOLPES × 100 = ${this.round.points} PUNTOS`);
      s.sfx?.play(this.round.state==='won'?'start':'whistle');
    }
    if(this.awarded && this.age-this.resultAt>=(this.round.state==='won'?7000:3000))this.finish();
  }
  update(frame){
    const s=this.scene,t=this.age/1000,g=this.lights.clear();
    for(let i=0;i<4;i++){
      const x=130+i*235,spot=x+Math.sin(t*.7+i*1.5)*160;
      g.fillStyle(COLORS[i],.07).fillTriangle(x-10,110,spot-145,500,spot+145,500);
      g.fillStyle(COLORS[i],.1).fillEllipse(spot,490,235,28);
      // Slow moving pools of colour, with no flashing full-screen overlay.
      g.fillStyle(COLORS[i],.7).fillCircle(x,111,5);
    }
    for(const p of this.crowd){
      // Small individual offsets keep the party lively; everyone reacts to the first connected hit.
      const fearAge=this.scaredAt===null?-1:this.age-this.scaredAt-p.index*35;
      const pose=fearAge>=0?4+Math.floor(fearAge/160)%4:Math.floor(this.age/(140+p.index%3*12)+p.index)%4;
      p.image.setFrame(pose).setPosition(p.x,p.y+4*p.scale);
    }
    this.target.sprite.setPosition(this.target.x+(this.age<this.hitUntil?Math.sin(frame*2)*2:0),VEHICLE.bottom);
    this.bar.width=400*this.target.hp/CHIVA_BONUS.hitsRequired;
    this.status.setText(`${this.round.hits} / ${CHIVA_BONUS.hitsRequired} GOLPES`);
    this.count.setText(this.round.state==='countdown'?String(Math.max(1,Math.ceil(this.round.countdownMs/1000))):'').setVisible(this.round.state==='countdown');
    if(this.round.state==='won' && this.awarded)this.updateCoste();
  }
  updateCoste(){
    const elapsed=this.age-this.resultAt;
    this.target.sprite.setFrame(elapsed<500?8:9);
    const x=Math.max(800,1030-Math.max(0,elapsed-700)*.16);
    this.coste.setVisible(elapsed>=700).setPosition(x,480);this.costeShadow.setVisible(elapsed>=700).setPosition(x,480);
    if(x>800)this.coste.setFrame(Math.floor(elapsed/120)%4);
    else {
      const cry=elapsed-2138,pose=cry<350?4:cry<700?5:cry<1000?6:cry<1350?7:[8,9,10,11][Math.floor((cry-1350)/220)%4];
      this.coste.setFrame(pose);this.line.setText('¡MI CHIVA!').setVisible(true);
    }
    const g=this.smoke.clear();
    for(let i=0;i<7;i++){
      const cycle=(elapsed/1600+i/7)%1;
      g.fillStyle(i%2?0x555869:0x252b38,(1-cycle)*.45).fillCircle(405+i*42+Math.sin(cycle*5+i)*12,440-cycle*130,12+cycle*18);
    }
  }
  finish(){
    if(this.ready)return;this.ready=true;
    const s=this.scene;s.finished=true;s.arcade.clearInput();s.music?.stop();
    s.game.events.emit('bonus-complete',{bonus:true,won:this.round.state==='won',points:this.round.points,hits:this.round.hits,
      score:s.run.score,character:s.character.name});
  }
  destroy(){
    for(const p of this.crowd){p.image.destroy();p.shadow.destroy();}
    for(const object of [this.dim,this.lights,this.smoke,this.target.sprite,this.coste,this.costeShadow,this.title,this.instructions,this.barBack,this.bar,this.status,this.count,this.line])object.destroy();
    this.cans=[];this.items=[];
  }
}
