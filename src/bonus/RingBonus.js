import {ARCADE} from '../data/arcade.js';
import {RING_ORDER,RING_BONUS,RingRound} from './ringRules.js';
const FONT="'Barlow Condensed', Arial, sans-serif";

export class RingBonus {
  constructor(scene){
    this.scene=scene;this.round=new RingRound();this.age=0;this.shots=[];this.ready=false;this.paid=false;this.nextAt=0;
    const text=(y,value,size,color='#ffe14d')=>scene.add.text(480,y,value,{fontFamily:FONT,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#09142b',strokeThickness:4,align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(1005);
    this.title=text(111,'BONUS · EL RING DE LOS TRAQUES',26);
    this.status=text(140,'4 RIVALES · 2 MINUTOS · +10.000 PUNTOS',17,'#ffffff');
    this.count=text(235,'3',70);this.fx=scene.add.graphics().setDepth(900);
    scene.player.x=270;scene.player.y=440;scene.timeLeft=this.round.remainingMs;
  }
  get locked(){return this.round.state!=='playing';}
  spawn(){
    const s=this.scene,key=RING_ORDER[this.round.defeated];
    this.current=s.spawnEnemy(key,this.round.defeated,0,1,0);this.current.x=720;this.current.y=430;this.current.facing=-1;
    this.current.invulnerableUntil=0;s.lastHit={enemy:this.current,at:s.combatTime};s.sfx?.play('ringBell');
    this.status.setText(`${this.round.defeated+1}/4 · ${this.current.config.name}`);
  }
  projectile(owner,kind){
    const s=this.scene,dir=owner.facing||1,speed=kind==='coin'?430:kind==='cap'?350:290;
    const sprite=s.add.image(owner.x+dir*40,owner.y-60,`ring-${kind}`).setDisplaySize(kind==='cap'?30:23,kind==='cap'?19:17).setDepth(owner.y+1);
    this.shots.push({x:owner.x+dir*40,y:owner.y,dir,age:0,speed,kind,owner,sprite});s.sfx?.play('wave');
  }
  updateShots(){
    const s=this.scene,p=s.player;
    this.shots=this.shots.filter(b=>{
      const from=b.x;b.x+=b.dir*b.speed/60;b.age++;b.sprite.setPosition(b.x,b.y-60+Math.sin(b.age*.14)*(b.kind==='bill'?12:3));b.sprite.rotation+=b.kind==='cap'?.12:b.kind==='coin'?.2:.035;
      if(p.x>=Math.min(from,b.x)-20 && p.x<=Math.max(from,b.x)+20 && Math.abs(p.y-b.y)<24 && (p.z??0)<42 && s.hitPlayer(b.kind==='cap'?10:7,null,b.owner)){b.sprite.destroy();return false;}
      if(b.age>210 || b.x<35 || b.x>925){b.sprite.destroy();return false;}return true;
    });
  }
  clearShots(){for(const b of this.shots)b.sprite.destroy();this.shots=[];}
  onDefeated(enemy){
    if(enemy!==this.current || !this.round.defeat(enemy.key))return false;
    this.current=null;this.nextAt=this.age+RING_BONUS.gapMs;this.clearShots();return true;
  }
  tick(){
    const s=this.scene;if(s.paused || this.ready)return;
    this.fx.clear();this.age+=ARCADE.clock.stepMs;this.round.step(ARCADE.clock.stepMs);s.timeLeft=this.round.remainingMs;
    this.count.setVisible(this.round.state==='countdown').setText(String(Math.max(1,Math.ceil(this.round.countdownMs/1000))));
    if(this.round.state==='playing'){
      if(this.current?.hp<=0)this.onDefeated(this.current);
      if(!this.current && !this.round.resolved && this.age>=this.nextAt)this.spawn();
    }
    if(this.round.resolved && !this.paid){
      this.paid=true;this.resultAt=this.age;s.addScore(this.round.points);this.clearShots();
      s.arcade.clearInput();s.arcade.player.transition('walk');s.playerAttack=null;s.iphone?.clear();s.books?.clear();
      if(this.current){this.current.tell.setVisible(false);this.current.invulnerableUntil=Infinity;}
      this.title.setText(this.round.state==='won'?'¡LOS CUATRO A LA LONA!':this.round.state==='timeout'?'TIEMPO AGOTADO':'PLAYER A LA LONA');
      this.status.setText(this.round.state==='won'?'+10.000 PUNTOS':`${this.round.defeated}/4 VENCIDOS · LA CAMPAÑA CONTINÚA`);s.sfx?.play('ringBell');
    }
    if(this.paid && this.age-this.resultAt>=2200)this.finish();
  }
  knockout(){if(this.round.finish(false))this.scene.health=1;}
  update(){if(!this.locked)this.updateShots();const t=this.age/1000;
    for(let i=0;i<4;i++)this.fx.fillStyle(i%2?0xff3668:0x4c9fff,.035).fillTriangle(150+i*220,160,80+i*210+Math.sin(t+i)*45,500,260+i*210,500);
  }
  finish(){if(this.ready)return;this.ready=true;const s=this.scene;s.finished=true;s.arcade.clearInput();s.music?.stop();
    s.game.events.emit('bonus-complete',{bonus:true,kind:'ring',won:this.round.state==='won',reason:this.round.state,points:this.round.points,defeated:this.round.defeated,score:s.run.score,character:s.character.name});}
  destroy(){this.clearShots();for(const v of [this.title,this.status,this.count,this.fx])v.destroy();}
}
