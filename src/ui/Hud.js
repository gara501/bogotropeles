import {ARCADE,fitArcadeText} from '../data/arcade.js';
import {canSpendSpecialEnergy,SPECIAL_ENERGY_COST} from '../combat/specialEnergy.js';
import {SUPER} from '../game/SuperPower.js';
import {VUVUZELA} from '../game/Vuvuzela.js';

// Final Fight style HUD: player portrait, NAME =lives, score and a long yellow life bar whose
// recent damage shows in red and drains; below it, the last enemy hit (or the boss) with its own
// portrait and bar; TIME countdown and the record on the right.
// Big labels: bundled Barlow Condensed (never Impact: too heavy once outlined). Small labels: bundled IBM Plex Mono.
const ARCADE_FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",SMALL_FONT="'IBM Plex Mono', monospace";
const YELLOW='#ffe14d',BLUE='#1b3fb8',PINK='#ff74c8',CREAM='#fff6c8',CYAN='#85faff';
// One look per state for every ability/item chip: lime = ready, gray = recharging, red = can't afford, yellow = held item, cyan = super.
const CHIP={ready:{line:0xd6ed64,key:0xd6ed64,keyText:'#14282c',text:CREAM},
  cooldown:{line:0x5d6b70,key:0x3a474c,keyText:'#c9d2c4',text:'#9aa79f'},
  blocked:{line:0xe8231d,key:0x7a1712,keyText:'#ffd9d4',text:'#ff8a7a'},
  item:{line:0xffe14d,key:0xffe14d,keyText:'#14282c',text:YELLOW},
  super:{line:0x3f8f9e,key:0x24505a,keyText:CYAN,text:CYAN},
  superReady:{line:0x85faff,key:0x85faff,keyText:'#06101c',text:CYAN}};
// On touch screens the chips name the on-screen buttons instead of keyboard keys.
const TOUCH={H:'PUÑO',J:'PATADA',K:'✦',Q:'★',SHIFT:'»'};
const CHIP_X=372,CHIP_ROWS=[44,66],CHIP_GAP=8;
// Thin outline (about 1/9 of the size) so the letters stay open and readable.
const text=(scene,x,y,value,size,color=YELLOW,stroke=BLUE,small=size<16)=>fitArcadeText(scene.add.text(x,y,value,{
  fontFamily:small?SMALL_FONT:ARCADE_FONT,fontSize:`${size}px`,fontStyle:small?'600':'bold',color,stroke,
  strokeThickness:small?2:Math.max(2,Math.round(size/9)),letterSpacing:small?0:1,
  shadow:small?undefined:{offsetX:1,offsetY:2,color:'#06101c',blur:0,fill:true,stroke:true}}).setDepth(1003).setScrollFactor(0));

/** Head crop of a fighter's pose, fitted into a size × size box at (x, y). */
export function portrait(scene,x,y,size,key,frame) {
  const texture=scene.textures.get(key),f=texture.get(frame),fw=f.width,fh=f.height;
  const body=texture.referenceHeight??fh*.8,side=Math.max(8,Math.round(body*.34));
  const cx=Math.round(fw/2-side/2),cy=Math.max(0,Math.round(fh-4-body-side*.04));
  const image=scene.add.image(0,0,key,frame).setOrigin(0).setScrollFactor(0).setDepth(1002).setCrop(cx,cy,side,side);
  const scale=size/side;image.setScale(scale).setPosition(x-cx*scale,y-cy*scale);
  return image;
}

class LifeBar {
  constructor(scene,x,y,width,height) {
    this.width=width;this.shown=1;this.ghost=1;this.holdUntil=0;
    this.frame=scene.add.rectangle(x-2,y-2,width+4,height+4,0x0b1430).setOrigin(0).setStrokeStyle(2,0xffffff).setScrollFactor(0).setDepth(1001);
    this.red=scene.add.rectangle(x,y,width,height,0xe8231d).setOrigin(0).setScrollFactor(0).setDepth(1002);
    this.yellow=scene.add.rectangle(x,y,width,height,0xf6dd18).setOrigin(0).setScrollFactor(0).setDepth(1002);
    this.x=x;this.cost=scene.add.rectangle(x,y,0,height,0xfff6c8).setOrigin(0).setScrollFactor(0).setDepth(1003).setAlpha(.6);
  }
  /** Pale tail of the life bar: the life a special would spend (0 hides it). */
  setCost(costRatio){const w=Math.min(this.yellow.width,this.width*costRatio);this.cost.setPosition(this.x+this.yellow.width-w,this.cost.y).width=w;}
  set(ratio,now,instant=false) {
    ratio=Math.max(0,Math.min(1,ratio));
    if(instant || ratio>this.shown){this.ghost=Math.max(this.ghost,ratio);if(instant)this.ghost=ratio;}
    if(ratio<this.shown)this.holdUntil=now+450; // keep the red damage visible for a moment, then drain it
    this.shown=ratio;if(now>=this.holdUntil)this.ghost=Math.max(ratio,this.ghost-.02);
    this.yellow.width=this.width*ratio;this.red.width=this.width*this.ghost;
  }
  setVisible(v){for(const item of [this.frame,this.red,this.yellow,this.cost])item.setVisible(v);return this;}
  destroy(){for(const item of [this.frame,this.red,this.yellow,this.cost])item.destroy();}
}

/** [key] LABEL chip: the single pattern for dash, special, super and held items. */
class Chip {
  constructor(scene) {
    const style={fontFamily:SMALL_FONT,fontSize:'12px',fontStyle:'600'};
    this.bg=scene.add.rectangle(0,0,10,18,0x0b1430).setOrigin(0).setStrokeStyle(1,0xd6ed64).setScrollFactor(0).setDepth(1001).setAlpha(.9);
    this.keyBg=scene.add.rectangle(0,0,10,14,0xd6ed64).setOrigin(0).setScrollFactor(0).setDepth(1002);
    this.key=fitArcadeText(scene.add.text(0,0,'',{...style,color:'#14282c'}).setScrollFactor(0).setDepth(1003));
    this.label=fitArcadeText(scene.add.text(0,0,'',{...style,color:CREAM}).setScrollFactor(0).setDepth(1003));
    this.sig='';this.width=0;
  }
  set(key,label,state) {
    const sig=`${key}|${label}|${state}`;
    if(sig!==this.sig){ // setText/setColor repaint the text canvas: only on change
      this.sig=sig;const c=CHIP[state];
      this.key.setText(key).setColor(c.keyText);this.label.setText(label).setColor(c.text);
      this.bg.setStrokeStyle(1,c.line);this.keyBg.setFillStyle?.(c.key);
      this.keyWidth=(this.key.displayWidth??this.key.width)+8;this.width=this.keyWidth+(this.label.displayWidth??this.label.width)+12;
    }
    return this;
  }
  place(x,y) {
    // setSize recomputes the stroke path too (assigning width only resizes the fill).
    this.bg.setPosition(x,y);if(this.bg.setSize)this.bg.setSize(this.width,18);else this.bg.width=this.width;
    this.keyBg.setPosition(x+2,y+2);if(this.keyBg.setSize)this.keyBg.setSize(this.keyWidth-2,14);else this.keyBg.width=this.keyWidth-2;
    this.key.setPosition(x+6,y+2);this.label.setPosition(x+this.keyWidth+6,y+2);return this;
  }
  setVisible(v){for(const item of [this.bg,this.keyBg,this.key,this.label])item.setVisible(v);return this;}
  destroy(){for(const item of [this.bg,this.keyBg,this.key,this.label])item.destroy();}
}

export class Hud {
  constructor(scene) {
    this.scene=scene;this.items=[];
    const s=scene,add=item=>{this.items.push(item);return item;};
    // player row
    add(s.add.rectangle(14,8,40,40,0x0b1430).setOrigin(0).setStrokeStyle(2,0xffffff).setScrollFactor(0).setDepth(1001));
    this.playerFace=null;this.setPlayer();
    this.name=add(text(s,62,4,'',20));
    this.score=add(text(s,362,4,'',20,'#fff6c8').setOrigin(1,0));
    this.lifeBar=new LifeBar(s,62,30,300,13);
    // enemy row
    this.enemyBox=add(s.add.rectangle(22,52,26,26,0x0b1430).setOrigin(0).setStrokeStyle(2,0xffffff).setScrollFactor(0).setDepth(1001));
    this.enemyFace=null;this.enemyKey=null;
    this.enemyName=add(text(s,62,47,'',17));
    this.enemyBar=new LifeBar(s,62,67,220,8);
    // right side: record, level, TIME
    this.record=add(text(s,800,6,'',13,'#fff6c8','#14282c').setOrigin(1,0));
    this.level=add(text(s,800,27,'',11,'#d6ed64','#14282c').setOrigin(1,0));
    this.timeLabel=add(text(s,885,2,'TIME',18,'#ffffff').setOrigin(.5,0));
    this.time=add(text(s,885,20,'99',38,PINK).setOrigin(.5,0));
    let record=0;
    try{
      const storage=globalThis.localStorage;
      record=JSON.parse(storage?.getItem(s.game.recordKey??'street-bogota-record-v1')??'null')?.score??0;
      const top=JSON.parse(storage?.getItem(s.game.rankingKey??'street-bogota-ranking-v1')??'[]')?.[0]?.score;
      if(Number.isFinite(top))record=Math.max(record,top);
    }catch{}
    this.bestRecord=record;
    if(!ARCADE.hud.timeLimit)for(const item of [this.timeLabel,this.time])item.setVisible(false);
    // ability/item chips (replace the loose status lines of the older HUD)
    this.chips={dash:new Chip(s),special:new Chip(s),super:new Chip(s),item:new Chip(s)};
    this.showEnemy(null);this.update(true);
  }
  /** [key, label, state] for each chip, or null when it does not apply. */
  chipStates() {
    const s=this.scene,c=s.character,now=s.combatTime??0,model=s.arcade?.player;
    const dashLeft=model && Number.isFinite(model.dashReady) && Number.isFinite(s.arcade.frame)
      ?Math.max(0,(model.dashReady-s.arcade.frame)*1000/ARCADE.clock.fps):Math.max(0,(s.dashReadyAt??0)-now);
    const dash=['SHIFT',dashLeft?`DASH ${(dashLeft/1000).toFixed(1)} s`:'DASH',dashLeft?'cooldown':'ready'];
    let special=null;
    if(c.special){
      const name=c.specialLabel??String(c.special).toUpperCase(),left=Math.max(0,(s.specialReadyAt??0)-now);
      const own=(s.iphone??s.books)?.label?.text??'',busy=own.replace(/^K \/ \S+ ?/,'');
      if(!canSpendSpecialEnergy(s))special=['K',`${name} · SIN VIDA`,'blocked'];
      else if(busy && !/LIST|SIN/.test(busy))special=['K',`${name} ${busy}`,'cooldown']; // iPhone/books: wait, recharge, explosion
      else if(left)special=['K',`${name} ${(left/1000).toFixed(1)} s`,'cooldown'];
      else special=['K',`${name} −${SPECIAL_ENERGY_COST} VIDA`,'ready'];
    }
    const p=s.superPower,superChip=p?(p.ready?['Q','SÚPER LISTO','superReady']:['Q',`SÚPER ${p.charge}/${SUPER.hits}`,'super']):null;
    const item=s.vuvuzela?.remaining?['H',`VUVUZELA ${s.vuvuzela.remaining}/${VUVUZELA.uses} · J SOLTAR`,'item']
      :s.panela?.remaining?['H','LANZAR PANELA · DAÑO ×2','item']:null;
    return {dash,special,super:superChip,item};
  }
  updateChips() {
    const s=this.scene,states=this.chipStates(),touch=Boolean(s.game?.touchControls?.mobile?.());
    // The older HUD lines keep their logic (and tests) but are no longer drawn.
    for(const old of [s.dashStatus,s.iphone?.label,s.books?.label,s.superPower?.label,s.superPower?.bar,s.vuvuzela?.label,s.panela?.label])old?.setAlpha?.(0);
    const rows=[['dash','special','super'],['item']];let end=CHIP_X;
    rows.forEach((names,row)=>{
      let x=CHIP_X;
      for(const name of names){
        const chip=this.chips[name],state=states[name];chip.setVisible(Boolean(state));if(!state)continue;
        const [key,label,look]=state;
        chip.set(touch?TOUCH[key]??key:key,touch?label.replace('J SOLTAR','PATADA SOLTAR'):label,look).place(x,CHIP_ROWS[row]);
        x+=chip.width+CHIP_GAP;
      }
      if(row===1)end=x;
    });
    s.boss?.status?.label?.setPosition?.(end,CHIP_ROWS[1]); // boss status effects join the second row
    this.lifeBar.setCost(states.special?.[2]==='ready'?SPECIAL_ENERGY_COST/100:0);
  }
  setPlayer() {
    const s=this.scene;this.playerFace?.destroy();
    this.playerFace=portrait(s,16,10,36,s.characterKey,s.character.idle??0);
  }
  /** Last enemy hit (2.5 s) or, failing that, the boss currently fighting. */
  target() {
    const s=this.scene,now=s.combatTime,hit=s.lastHit;
    if(hit){
      const age=now-hit.at;
      if(hit.enemy.hp>0 && age>=0 && age<=2500 && s.enemies.includes(hit.enemy))return hit.enemy;
      s.lastHit=null;
    }
    if(s.miniBoss?.enemy?.hp>0)return s.miniBoss.enemy;
    if(s.boss && !s.boss.dead)return s.boss.actor;
    return null;
  }
  showEnemy(enemy) {
    const s=this.scene,visible=Boolean(enemy);
    for(const item of [this.enemyBox,this.enemyName])item.setVisible(visible);this.enemyBar.setVisible(visible);
    if(!visible){
      this.enemyFace?.destroy();this.enemyFace=null;this.enemyKey=null;
      this.enemyName.setText('');this.enemyBar.set(0,s.combatTime,true);return;
    }
    const key=`${enemy.key}:${enemy.config.frameOffset??0}`;
    if(key!==this.enemyKey){
      this.enemyKey=key;this.enemyFace?.destroy();
      this.enemyFace=portrait(s,24,54,22,enemy.key,(enemy.config.idle??0)+(enemy.config.frameOffset??0));
      this.enemyBar.set(this.ratio(enemy),s.combatTime,true);
    }
    this.enemyFace.setVisible(true);
  }
  ratio(enemy) {
    const boss=this.scene.boss;
    if(boss && enemy===boss.actor)return Math.max(0,boss.hp)/(boss.maxHp??boss.hp??1);
    return Math.max(0,enemy.hp)/enemy.config.hp;
  }
  update(instant=false) {
    const s=this.scene,now=s.combatTime??0;
    this.name.setText(`${s.character.name} ×${s.run.lives}`);
    this.score.setText(String(s.run.score));
    this.lifeBar.set(s.health/100,now,instant);
    this.record.setText(`TOP ${Math.max(this.bestRecord,s.run.score)}`);
    this.level.setText(s.counter?.text??'');
    const seconds=Math.max(0,Math.ceil((s.timeLeft??0)/1000));this.time.setText(String(seconds).padStart(2,'0'));
    const timeColor=seconds<=10 && Math.floor(now/250)%2?'#ffffff':PINK;
    if(timeColor!==this.timeColor){this.timeColor=timeColor;this.time.setColor(timeColor);} // setColor repaints the text: only on change
    const enemy=this.target();this.showEnemy(enemy);
    if(enemy){
      const boss=s.boss && enemy===s.boss.actor;
      const name=boss?`DORMILÓN · FASE ${s.boss.phase}`:enemy===s.miniBoss?.enemy?s.miniBoss.def.name:enemy.config.name??'';
      this.enemyName.setText(name);
      this.enemyBar.set(this.ratio(enemy),now);
    }
    this.updateChips();
  }
  destroy(){for(const chip of Object.values(this.chips??{}))chip.destroy();for(const item of this.items)item.destroy();this.lifeBar.destroy();this.enemyBar.destroy();this.playerFace?.destroy();this.enemyFace?.destroy();}
}
