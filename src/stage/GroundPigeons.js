import {ARCADE} from '../data/arcade.js';
import {PIGEON_FLIGHT} from '../boss/PigeonFlock.js';
import {viewLeft} from './scroll.js';

export const GROUND_PIGEON={key:'ground-pigeon',frameWidth:128,frameHeight:128,frames:4};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Ground flocks are stage hazards, independent of enemy waves and the boss's own birds. */
export class GroundPigeons {
  constructor(scene,config,width){
    this.scene=scene;this.config=config;this.triggerX=width*config.at;
    this.started=false;this.stopped=false;this.nextSpawn=0;this.groups=[];this.serial=0;
  }
  update(){
    const s=this.scene,c=this.config,now=s.combatTime;
    if(this.stopped)return;
    if(s.bossIntroShown || s.boss || s.miniBoss || s.waves?.cleared || s.finished){this.clear();return;}
    if(s.paused || s.cinematic || s.health<=0)return;
    if(!this.started){if(s.player.x<this.triggerX)return;this.started=true;}
    const left=viewLeft(s);
    this.groups=this.groups.filter(group=>{
      if(group.x<left-90 || (group.state==='flight' && now-group.since>=c.flight)){
        this.destroyGroup(group);return false;
      }
      this.stepGroup(group,now);return true;
    });
    if(now>=this.nextSpawn && this.groups.length<c.groups){
      for(const fraction of [.18,.5,.82,.65,.35,.9]){
        if(this.groups.length>=c.groups)break;
        const x=left+fraction*ARCADE.screen.width;
        if(x<this.triggerX-360 || Math.abs(x-s.player.x)<c.radius+40 || this.groups.some(g=>Math.abs(g.x-x)<150))continue;
        const lane=(this.serial++%3+.5)/3;
        this.spawn(x,s.floor.top+15+lane*(s.floor.bottom-s.floor.top-30));
      }
      this.nextSpawn=now+c.respawn;
    }
  }
  spawn(x,y){
    const s=this.scene,c=this.config;
    const group={x,y,state:'ground',since:s.combatTime,hit:false,birds:[]};
    for(let i=0;i<c.birds;i++){
      const bx=x+(i-(c.birds-1)/2)*25,by=y+(i%2?5:-3);
      const sprite=s.add.sprite(bx,by,GROUND_PIGEON.key,0).setOrigin(.5,110/128).setScale(.4).setDepth(by);
      const shadow=s.add.ellipse(bx,by+1,24,7,0x142127,.25).setDepth(by-1);
      group.birds.push({sprite,shadow,x:bx,y:by,flip:i%2===0});
    }
    this.groups.push(group);return group;
  }
  stepGroup(group,now){
    const s=this.scene,c=this.config,p=s.player;
    if(group.state==='ground'){
      group.birds.forEach((b,i)=>b.sprite.setFrame(Math.floor(now/240+i)%GROUND_PIGEON.frames).setFlipX(b.flip));
      if(Math.abs(p.x-group.x)<=c.radius && Math.abs(p.y-group.y)<=c.depth){
        group.state='alert';group.since=now;group.target={x:p.x,y:p.y};
        for(const b of group.birds)b.sprite.setTexture(PIGEON_FLIGHT.key,0).setOrigin(.5,.5);
      }
      return;
    }
    if(group.state==='alert'){
      for(const b of group.birds)b.sprite.setPosition(b.x,b.y-12-Math.sin((now-group.since)/60)*3)
        .setFrame(Math.floor((now-group.since)/70)%PIGEON_FLIGHT.frames).setFlipX(group.target.x<b.x);
      if(now-group.since<c.tell)return;
      group.state='flight';group.since=now;
      s.sfx?.play('pigeonFlight');
    }
    const t=clamp((now-group.since)/c.flight,0,1);
    group.birds.forEach((b,i)=>{
      const strike=.42,dir=Math.sign(group.target.x-b.x)||1;
      const targetX=group.target.x+(i-(c.birds-1)/2)*9;
      let x,y,groundY;
      if(t<=strike){const u=t/strike;x=b.x+(targetX-b.x)*u;groundY=b.y+(group.target.y-b.y)*u;
        y=groundY-22-Math.sin(u*Math.PI)*36;
      }else{const u=(t-strike)/(1-strike);x=targetX+dir*u*(ARCADE.screen.width+180);groundY=group.target.y;
        y=groundY-22-u*240;
      }
      b.sprite.setPosition(x,y).setDepth(groundY+4).setFlipX(dir<0).setFrame(Math.floor((now-group.since)/65+i)%PIGEON_FLIGHT.frames);
      b.shadow.setPosition(x,groundY+1).setAlpha(.25*(1-t));
      if(!group.hit && t>.25 && t<.58 && Math.abs(p.x-x)<27 && Math.abs(p.y-groundY)<c.hitDepth && (s.jumpHeight??p.z??0)<42){
        group.hit=true;s.hitPlayer(Math.max(1,Math.round(c.damage*(s.level.damage??1))),null,{x,y:groundY});
      }
    });
  }
  destroyGroup(group){for(const b of group.birds){b.sprite.destroy();b.shadow.destroy();}}
  clear(){this.stopped=true;for(const g of this.groups)this.destroyGroup(g);this.groups=[];}
  destroy(){this.clear();}
}
