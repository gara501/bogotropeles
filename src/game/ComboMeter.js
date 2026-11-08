// Style meter: consecutive hits without taking damage. A gap longer than `window` ms ends the chain cleanly
// (chains of `bonusFrom`+ hits pay `bonusPerHit` points per hit); taking damage cuts it with no bonus.
// While a chain is alive, regular enemies defeated pay their points × the current tier multiplier.
// A successful parry adds `parryHits` to the chain.
export const COMBO={window:2200,parryHits:2,bonusFrom:10,bonusPerHit:10,showFrom:2,
  tiers:[{hits:5,mult:1.5,label:'¡BIEN!',color:'#d6ed64'},{hits:10,mult:2,label:'¡BACANO!',color:'#7fe0ff'},
    {hits:20,mult:3,label:'¡BERRACO!',color:'#ffb347'},{hits:35,mult:4,label:'¡ÉPICO, PARCERO!',color:'#ff6fae'}]};
export function comboTier(hits){let tier=null;for(const t of COMBO.tiers)if(hits>=t.hits)tier=t;return tier;}
export const comboBonus=hits=>hits>=COMBO.bonusFrom?hits*COMBO.bonusPerHit:0;
const FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

export class ComboMeter {
  constructor(scene){this.scene=scene;this.hits=0;this.best=0;this.lastAt=-Infinity;this.items=[];if(scene.add?.text)this.build();}
  get multiplier(){return comboTier(this.hits)?.mult??1;}
  get remaining(){return this.hits?Math.max(0,1-((this.scene.combatTime??0)-this.lastAt)/COMBO.window):0;}
  /** Points for a defeated enemy: bosses and bonus fighters keep their own value. */
  points(base,config){return config?.boss || config?.ringFighter?base:Math.round(base*this.multiplier);}
  onHit(){this.add(1);}
  onParry(){this.add(COMBO.parryHits);}
  add(n){
    const before=comboTier(this.hits);this.hits+=n;this.best=Math.max(this.best,this.hits);this.lastAt=this.scene.combatTime??0;
    const tier=comboTier(this.hits);if(tier && tier!==before)this.announce(tier);
    this.render(true);
  }
  /** reason 'timeout' pays the chain bonus; 'hit' (the player took damage) just cuts it. */
  end(reason='timeout'){
    if(!this.hits)return 0;
    const s=this.scene,bonus=reason==='timeout'?comboBonus(this.hits):0;
    if(bonus){s.addScore?.(bonus);s.scorePopup?.(s.player.x,s.player.y-(s.character?.height??110)-48,bonus,true);}
    else if(reason==='hit' && this.hits>=COMBO.tiers[0].hits)this.flash('¡SE CORTÓ EL COMBO!','#ff8a80');
    this.hits=0;this.render();return bonus;
  }
  update(){
    if(!this.hits)return;
    if((this.scene.combatTime??0)-this.lastAt>COMBO.window){this.end('timeout');return;}
    this.bar?.setSize?.(120*this.remaining,4);
  }
  /** Level restart / change of scene: the chain disappears without paying. */
  reset(){this.hits=0;this.lastAt=-Infinity;this.render();}
  build(){
    const s=this.scene,add=item=>{this.items.push(item);return item.setScrollFactor?.(0).setDepth?.(1003)??item;};
    this.count=add(s.add.text(936,88,'',{fontFamily:FONT,fontSize:'26px',fontStyle:'bold',color:'#fff6c8',stroke:'#14282c',strokeThickness:4}).setOrigin(1,0));
    this.tier=add(s.add.text(936,116,'',{fontFamily:FONT,fontSize:'15px',fontStyle:'bold',color:'#d6ed64',stroke:'#14282c',strokeThickness:3}).setOrigin(1,0));
    this.barBack=add(s.add.rectangle(816,138,120,4,0x14282c).setOrigin(0));
    this.bar=add(s.add.rectangle(816,138,120,4,0xfff6c8).setOrigin(0));
    this.render();
  }
  render(pop=false){
    if(!this.count)return;
    const show=this.hits>=COMBO.showFrom,tier=comboTier(this.hits);
    for(const item of this.items)item.setVisible?.(show);
    if(!show)return;
    this.count.setText(`${this.hits} GOLPES`);
    this.tier.setText(tier?`×${tier.mult} ${tier.label}`:'');if(tier)this.tier.setColor?.(tier.color);
    this.bar.setSize?.(120*this.remaining,4);
    if(pop){this.scene.tweens?.killTweensOf?.(this.count);this.count.setScale?.(1.25);this.scene.tweens?.add?.({targets:this.count,scale:1,duration:140,ease:'Quad.Out'});}
  }
  announce(tier){this.flash(tier.label,tier.color,30);this.scene.cameras?.main?.shake?.(60,.002);}
  flash(message,color,size=20){
    const s=this.scene;if(!s.add?.text)return;
    const label=s.add.text(480,140,message,{fontFamily:FONT,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#14282c',strokeThickness:5})
      .setOrigin(.5).setScrollFactor(0).setDepth(1004);
    s.tweens?.add?.({targets:label,scale:{from:1.6,to:1},duration:180,ease:'Back.Out',onComplete:()=>
      s.tweens?.add?.({targets:label,y:label.y-24,alpha:0,duration:500,delay:380,onComplete:()=>label.destroy()})});
  }
  destroy(){for(const item of this.items)item.destroy?.();this.items=[];this.count=null;}
}
