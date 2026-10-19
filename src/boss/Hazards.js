import { BOSS } from './balance.js';
import { clamp, inRect, sweptFootprint, workSites, picoPlan } from './rules.js';
import { playerAttackHits } from '../combat.js';
import { viewLeft } from '../stage/scroll.js';

export class Hazards {
  constructor(scene,status) {
    this.scene = scene; this.status = status;
    this.works = []; this.remains = []; this.vehicles = []; this.forms = [];
    this.vehiclePool = []; this.formPool = []; this.pico = null; this.plan = null;
    this.warning = scene.add.graphics().setDepth(900);
    this.labels = []; this.paperVolley = null;
  }
  get activeSystems() {
    return [...(this.works.some(w=>w.active) ? ['works'] : []), ...(this.pico?.active ? ['pico'] : []), ...(this.vehicles.length ? ['traffic'] : []), ...(this.forms.length || this.paperVolley ? ['paper'] : [])];
  }
  get blockers() { return [...this.works.filter(w=>w.active && w.kind!=='hole'), ...this.vehicles.filter(v=>v.barrier && v.parked)]; }
  art(frame,x,y,w,h) { return this.scene.add.image(x,y,'boss-effects',frame).setDisplaySize(w,h).setDepth(y); }
  prepare(key,speed) {
    this.clearWarning();
    const {floor,player} = this.scene;
    let windup = BOSS.attacks[key].windup;
    if (key === 'pico') {
      this.pico = {...picoPlan(floor,player,speed,this.blockers),active:false,hit:false,until:0};
      windup = this.pico.windup;
      for (const zone of this.pico.zones) this.labels.push(this.scene.add.text(zone.x,zone.y,String(zone.number),{fontFamily:"'IBM Plex Mono', monospace",fontSize:'18px',color:'#ffffff',stroke:'#142127',strokeThickness:4}).setOrigin(.5).setDepth(901));
    } else if (key === 'works') {
      this.plan = {key, sites:workSites(floor,player,this.works)};
    } else if (key === 'traffic') {
      // Only the lower lane is used; the entire upper corridor is an exit.
      const y = floor.bottom - 15;
      const escape = Math.max(0, player.y-(y-34)) / Math.max(1,speed*.65);
      windup = Math.max(windup, Math.ceil(escape*1000+BOSS.traffic.escapeMargin));
      const vx = viewLeft(this.scene);
      const direction = player.x < vx+480 ? -1 : 1;
      this.plan = {key,y,direction,barrier:Math.random()<.4};
      this.labels.push(this.scene.add.text(vx+480,y-7,'→ → →  ¡SAL DEL CARRIL!  → → →',{fontFamily:"'IBM Plex Mono', monospace",fontSize:'13px',color:'#ffdf84',stroke:'#142127',strokeThickness:4}).setOrigin(.5).setDepth(901));
    }
    return windup;
  }
  activate(key,boss) {
    const now = this.scene.combatTime;
    if (key === 'pico') { this.pico.active = true; this.pico.until = now + BOSS.attacks.pico.duration; }
    if (key === 'works') {
      for (const site of this.plan.sites) {
        while (this.works.filter(w=>w.active).length >= BOSS.works.limit) this.retireWork(this.works.find(w=>w.active));
        for(const old of [...this.works]) if(Math.abs(old.x-site.x)<62)this.retireWork(old);
        const kind=site.kind;
        const work = {...site,w:kind==='fence'?65:40,h:22,hp:kind==='fence'?BOSS.works.fenceHp:BOSS.works.coneHp,active:true,hitAt:-Infinity,inside:false};
        work.sprite = this.art(kind,site.x,site.y,work.w,kind==='hole'?20:kind==='fence'?48:38).setOrigin(.5,1);
        this.works.push(work);
      }
      this.plan = null; this.clearWarning();
    }
    if (key === 'traffic') {
      const frames=['taxi','bus','truck'], frame=frames[Math.floor(Math.random()*frames.length)];
      const dimensions=BOSS.traffic.vehicles[frame];
      const vx=viewLeft(this.scene);
      const vehicle = {...this.plan,x:this.plan.direction>0?vx-dimensions.width/2-20:vx+980+dimensions.width/2,w:dimensions.width,h:24,hit:false,parked:false,until:0};
      vehicle.stopX=vx+(vehicle.direction>0?340:620);
      vehicle.sprite=this.vehiclePool.pop() ?? this.art(frame,vehicle.x,vehicle.y,vehicle.w,dimensions.height);
      vehicle.sprite.setTexture('boss-effects',frame).setDisplaySize(vehicle.w,dimensions.height).setOrigin(.5,1).setFlipX(vehicle.direction<0).setVisible(true);
      this.vehicles.push(vehicle); this.plan=null; this.clearWarning();
    }
    if (key === 'paper') this.paperVolley = {x:boss.x,y:boss.y,facing:boss.facing,next:now,left:BOSS.paper.volleyCount};
  }
  clearWarning() { this.warning.clear(); this.labels.forEach(l=>l.destroy()); this.labels=[]; this.plan=null; }
  cancelPending() { if (this.pico && !this.pico.active) this.pico=null; this.clearWarning(); }
  retireWork(work) {
    if (!work?.active) return;
    work.active=false; work.sprite.destroy();
    this.remains.push(this.art('rubble',work.x,work.y,40,12).setAlpha(.4));
    if (this.remains.length>6) this.remains.shift().destroy();
    this.works=this.works.filter(w=>w.active);
  }
  hitObstacles(attack) {
    for (const work of [...this.works]) if (work.active && work.kind!=='hole' && playerAttackHits(this.scene.player,work,attack)) {
      this.hitObstacle(work,attack);
    }
  }
  hitObstacle(work,attack) {
    if(!work.active || work.kind==='hole')return;
    work.hp-=attack.damage;work.sprite.setTint(0xffd58a);
    if(work.hp<=0)this.retireWork(work);
  }
  resolveMovement(previous, player=this.scene.player) {
    for (const rect of this.blockers) {
      // Swept X and Y tests catch dash tunnelling without using the drawing's height.
      const left=rect.x-rect.w/2-16,right=rect.x+rect.w/2+16,top=rect.y-rect.h/2-7,bottom=rect.y+rect.h/2+7;
      if (Math.abs(previous.y-rect.y)<=rect.h/2+7) {
        if (previous.x<=left && player.x>left) player.x=left;
        else if (previous.x>=right && player.x<right) player.x=right;
      }
      if (player.x>left && player.x<right) {
        if (previous.y<=top && player.y>top) player.y=top;
        else if (previous.y>=bottom && player.y<bottom) player.y=bottom;
      }
      if (inRect(player,rect,7)) player.y=top; // A parked car never traps a player inside.
    }
    player.x=clamp(player.x,this.scene.floor.left,this.scene.floor.right);
    player.y=clamp(player.y,this.scene.floor.top,this.scene.floor.bottom);
  }
  spawnForm(volley,index) {
    const sprite=this.formPool.pop() ?? this.art('paper1',0,0,25,22);
    sprite.setTexture('boss-effects',`paper${index%3+1}`).setDisplaySize(25,22).setVisible(true).setAlpha(1).clearTint();
    this.forms.push({x:volley.x+volley.facing*35,y:clamp(volley.y+(index-1)*22,this.scene.floor.top,this.scene.floor.bottom),facing:volley.facing,sprite,until:this.scene.combatTime+BOSS.paper.projectileLifetime});
  }
  update(dt) {
    const {combatTime:now,player,jumpHeight,floor}=this.scene,vx=viewLeft(this.scene);
    this.warning.clear();
    if (this.pico) {
      for (const [i,zone] of this.pico.zones.entries()) {
        const danger=i===this.pico.restricted;
        this.warning.lineStyle(danger?3:1,danger?0xffbd67:0xd6ed64,1).strokeRect(zone.x-zone.w/2+2,zone.y-zone.h/2,zone.w-4,zone.h);
        if(danger) this.warning.fillStyle(this.pico.active?0xd64b3d:0xf0b36c,this.pico.active ? .36 : .12).fillRect(zone.x-zone.w/2+2,zone.y-zone.h/2,zone.w-4,zone.h);
      }
      if(this.pico.active) {
        if(!this.pico.hit && inRect(player,this.pico.zones[this.pico.restricted])) {
          this.pico.hit=true;
          if(this.scene.hitPlayer(BOSS.attacks.pico.damage)) this.scene.hurtUntil=Math.max(this.scene.hurtUntil,now+BOSS.pico.immobilize);
        }
        if(now>=this.pico.until) {this.pico=null;this.clearWarning();}
      }
    }
    if(this.plan?.key==='works') for(const site of this.plan.sites) {
      this.warning.lineStyle(3,0xffcf69).strokeRect(site.x-40,site.y-15,80,26);
      this.warning.lineBetween(site.x-12,site.y-10,site.x+12,site.y+10).lineBetween(site.x-12,site.y+10,site.x+12,site.y-10);
    }
    if(this.plan?.key==='traffic') this.warning.lineStyle(3,0xffcf69).strokeRect(floor.left,this.plan.y-27,floor.right-floor.left,42);
    for(const work of this.works) if(work.active && work.kind==='hole') {
      const inside=inRect(player,work) && jumpHeight<25;
      if(inside && !work.inside && now>=work.hitAt) {this.scene.hitPlayer(BOSS.attacks.works.damage);work.hitAt=now+BOSS.works.holeCooldown;}
      work.inside=inside;
    }
    this.vehicles=this.vehicles.filter(vehicle=>{
      const previous=vehicle.x;
      if(vehicle.parked && now>=vehicle.until) vehicle.parked=false;
      if(!vehicle.parked) {
        vehicle.x+=vehicle.direction*BOSS.traffic.speed*dt;
        if(vehicle.barrier && !vehicle.entered && (vehicle.x-vehicle.stopX)*vehicle.direction>=0) {
          vehicle.x=vehicle.stopX;vehicle.parked=true;vehicle.entered=true;vehicle.until=now+BOSS.traffic.barrierDuration;
        }
      }
      vehicle.sprite.setPosition(vehicle.x,vehicle.y).setDepth(vehicle.y+1);
      if(!vehicle.hit && !vehicle.parked && sweptFootprint(previous,vehicle.x,vehicle.y,player,vehicle.w,24)) {
        vehicle.hit=true;this.scene.hitPlayer(BOSS.attacks.traffic.damage);
      }
      if(vehicle.x+vehicle.w/2 < vx-40 || vehicle.x-vehicle.w/2 > vx+1000) {vehicle.sprite.setVisible(false);this.vehiclePool.push(vehicle.sprite);return false;}
      return true;
    });
    if(this.paperVolley && now>=this.paperVolley.next) {
      const volley=this.paperVolley;this.spawnForm(volley,BOSS.paper.volleyCount-volley.left);volley.left--;volley.next=now+BOSS.paper.shotInterval;
      if(!volley.left) this.paperVolley=null;
    }
    this.forms=this.forms.filter(form=>{
      const previous=form.x;form.x+=form.facing*BOSS.paper.speed*dt;
      form.sprite.setPosition(form.x,form.y-65).setDepth(form.y+1).setRotation(Math.sin(now/150)*.2);
      const hit=jumpHeight<35 && sweptFootprint(previous,form.x,form.y,player,20,16);
      if(hit && this.scene.hitPlayer(BOSS.attacks.paper.damage)) this.status.add();
      if(hit || now>=form.until || form.x < vx-40 || form.x > vx+1000) {form.sprite.setVisible(false);this.formPool.push(form.sprite);return false;}
      return true;
    });
  }
  clear() {
    this.pico=null;this.paperVolley=null;this.clearWarning();
    this.works.forEach(w=>w.sprite.destroy());this.works=[];
    this.remains.forEach(r=>r.destroy());this.remains=[];
    for(const vehicle of this.vehicles) {vehicle.sprite.setVisible(false);this.vehiclePool.push(vehicle.sprite);} this.vehicles=[];
    for(const form of this.forms) {form.sprite.setVisible(false);this.formPool.push(form.sprite);} this.forms=[];
  }
  destroy() {this.clear();this.warning.destroy();[...this.vehiclePool,...this.formPool].forEach(s=>s.destroy());this.vehiclePool=[];this.formPool=[];}
}
