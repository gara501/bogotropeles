import {ARCADE} from '../data/arcade.js';
import {viewLeft} from './scroll.js';
import {taxiRushPlan,taxiTouches} from './taxiRushRules.js';

/** One screen of lane dodging between combat arenas, with a finite vehicle plan. */
export class TaxiRush {
  constructor(scene,config,random=Math.random){this.scene=scene;this.config=config;this.random=random;this.active=false;this.done=false;this.elapsed=0;this.cars=[];}
  get progress(){return Math.min(1,this.elapsed/this.duration);}
  start(arena){
    if(this.active || this.done)return false;
    const s=this.scene,c=this.config;this.active=true;this.elapsed=0;this.arena=arena;
    this.from=s.stage.arenaScroll(arena-1);this.to=s.stage.arenaScroll(arena);
    this.plan=taxiRushPlan(c,this.random).map(item=>({...item,state:'queued'}));
    this.duration=this.plan.at(-1).launchAt+(ARCADE.screen.width+c.width+100)/c.speed*1000+c.tail;
    this.lanes=[s.floor.top+15,(s.floor.top+s.floor.bottom)/2,s.floor.bottom-12];
    this.label=s.add.text(480,105,'¡TAXIS! · CAMBIA DE CARRIL',{fontFamily:"'IBM Plex Mono',monospace",fontSize:'16px',color:'#ffcf69',stroke:'#142127',strokeThickness:4})
      .setOrigin(.5).setScrollFactor(0).setDepth(1001);
    return true;
  }
  warn(item){
    const s=this.scene,y=this.lanes[item.lane],left=item.direction>0;
    item.state='warning';item.mark=s.add.rectangle(480,y,960,this.config.hitDepth*2,0xffbb22,.28).setScrollFactor(0).setDepth(y-.1);
    item.arrow=s.add.text(left?85:875,y-25,left?'→ ¡TAXI!':'¡TAXI! ←',{fontFamily:"'IBM Plex Mono',monospace",fontSize:'19px',color:'#fff47a',stroke:'#7b2409',strokeThickness:5})
      .setOrigin(.5).setScrollFactor(0).setDepth(998);
  }
  launch(item){
    item.mark?.destroy();item.arrow?.destroy();item.mark=null;item.arrow=null;item.state='driving';
    const c=this.config,y=this.lanes[item.lane],x=item.direction>0?-c.width/2-40:960+c.width/2+40;
    const sprite=this.scene.add.image(x,y,'taxi-rush',item.direction>0?'right':'left').setOrigin(.5,1)
      .setDisplaySize(c.width,c.height).setScrollFactor(0).setDepth(y+2);
    this.cars.push({item,sprite,x,y,hit:false});this.scene.sfx?.play('carPass');
  }
  update(dt){
    if(!this.active || this.scene.health<=0 || this.scene.paused || this.scene.finished || this.scene.cinematic)return;
    const s=this.scene,c=this.config;this.elapsed+=dt*1000;
    for(const item of this.plan){
      if(item.state==='queued' && this.elapsed>=item.warnAt)this.warn(item);
      if(item.state==='warning'){
        item.mark.setAlpha?.(Math.floor(this.elapsed/120)%2?.38:.16);
        if(this.elapsed>=item.launchAt)this.launch(item);
      }
    }
    this.cars=this.cars.filter(car=>{
      const previous=car.x;car.x+=car.item.direction*c.speed*dt;car.sprite.x=car.x;
      if(!car.hit && taxiTouches(previous,car.x,car.y,s.player,viewLeft(s),c)){
        car.hit=true;s.hitPlayer(c.damage);
      }
      if(car.x<-c.width || car.x>960+c.width){car.sprite.destroy();car.item.state='done';return false;}return true;
    });
    if(this.elapsed>=this.duration && !this.cars.length && this.plan.every(item=>item.state==='done')){
      this.active=false;this.done=true;this.justFinished=true;this.label?.destroy();this.label=null;
    }
  }
  skip(){this.destroy();this.done=true;}
  destroy(){
    this.active=false;this.justFinished=false;this.label?.destroy();this.label=null;
    for(const item of this.plan??[]){item.mark?.destroy();item.arrow?.destroy();item.mark=null;item.arrow=null;}
    for(const car of this.cars)car.sprite.destroy();this.cars=[];
  }
}
