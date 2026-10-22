import {ARCADE,fitArcadeText} from '../data/arcade.js';

// Final Fight style HUD: player portrait, NAME =lives, score and a long yellow life bar whose
// recent damage shows in red and drains; below it, the last enemy hit (or the boss) with its own
// portrait and bar; TIME countdown and the record on the right.
// Big labels: bundled Barlow Condensed (never Impact: too heavy once outlined). Small labels: bundled IBM Plex Mono.
const ARCADE_FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",SMALL_FONT="'IBM Plex Mono', monospace";
const YELLOW='#ffe14d',BLUE='#1b3fb8',PINK='#ff74c8';
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
  }
  set(ratio,now,instant=false) {
    ratio=Math.max(0,Math.min(1,ratio));
    if(instant || ratio>this.shown){this.ghost=Math.max(this.ghost,ratio);if(instant)this.ghost=ratio;}
    if(ratio<this.shown)this.holdUntil=now+450; // keep the red damage visible for a moment, then drain it
    this.shown=ratio;if(now>=this.holdUntil)this.ghost=Math.max(ratio,this.ghost-.02);
    this.yellow.width=this.width*ratio;this.red.width=this.width*this.ghost;
  }
  setVisible(v){for(const item of [this.frame,this.red,this.yellow])item.setVisible(v);return this;}
  destroy(){for(const item of [this.frame,this.red,this.yellow])item.destroy();}
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
    this.showEnemy(null);this.update(true);
  }
  setPlayer() {
    const s=this.scene;this.playerFace?.destroy();
    this.playerFace=portrait(s,16,10,36,s.characterKey,s.character.idle??0);
  }
  /** Last enemy hit (2.5 s) or, failing that, the boss currently fighting. */
  target() {
    const s=this.scene,now=s.combatTime,hit=s.lastHit;
    if(hit && now-hit.at<=2500 && (hit.enemy.hp>0 || now-hit.at<=900))return hit.enemy;
    if(s.miniBoss?.enemy?.hp>0)return s.miniBoss.enemy;
    if(s.boss && !s.boss.dead)return s.boss.actor;
    return null;
  }
  showEnemy(enemy) {
    const s=this.scene,visible=Boolean(enemy);
    for(const item of [this.enemyBox,this.enemyName])item.setVisible(visible);this.enemyBar.setVisible(visible);
    if(!visible){this.enemyFace?.setVisible(false);return;}
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
    this.name.setText(`${s.character.name} =${s.run.lives}`);
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
  }
  destroy(){for(const item of this.items)item.destroy();this.lifeBar.destroy();this.enemyBar.destroy();this.playerFace?.destroy();this.enemyFace?.destroy();}
}
