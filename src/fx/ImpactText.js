// Comic hit feedback: small damage numbers on every hit, a comic word (¡PUM!) on strong hits, and the boss finale
// (slow motion + slight zoom + ¡K.O.!) when a boss takes its last hit. Pure rule (impactWord) is testable in node.
export const IMPACT={
  numbers:true,minDamage:28,gapMs:140,
  words:{punch:['¡PUM!','¡PAF!','¡TOME!'],kick:['¡ZAS!','¡PAF!','¡CATAPLÚN!'],heavy:['¡BOOM!','¡CRAC!','¡TOING!'],ko:['¡K.O.!','¡A DORMIR!','¡FUERA!']},
  colors:['#ffe14d','#ff8a3d','#7fe0ff','#ff6fae'],
  // Boss finale: game time runs at `slow` for `finaleMs` real ms while the camera zooms to `zoom`.
  finale:{slow:.25,finaleMs:1100,zoom:1.16,zoomInMs:160,zoomOutMs:260},
};
const FONT="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
/** The comic word for a hit, or null for ordinary hits. `n` rotates through the list. */
export function impactWord(attack,dealt,killed,n=0){
  if(!attack || attack.type==='hole' || dealt<=0)return null;
  if(!(killed || attack.finisher || attack.knockdown || attack.super || dealt>=IMPACT.minDamage))return null;
  const type=attack.type??'',w=IMPACT.words;
  const list=killed?w.ko:attack.super || /stomp|piledriver|headset|taxi|iphone|super/i.test(type)?w.heavy:/kick|slide|airDash|shoulder/i.test(type)?w.kick:w.punch;
  return list[n%list.length];
}
export class ImpactText {
  constructor(scene){this.scene=scene;this.count=0;this.lastAt=-1e9;this.finaleActive=false;}
  show(enemy,attack,dealt){
    const s=this.scene;if(!s.add?.text || dealt<=0)return;
    const top=enemy.y-(enemy.config?.height??110),killed=enemy.hp<=0;
    if(IMPACT.numbers && attack?.type!=='hole'){
      const x=enemy.x+((this.count*37)%30-15),number=s.add.text(x,top+8,String(Math.round(dealt)),{fontFamily:FONT,fontSize:dealt>=IMPACT.minDamage?'20px':'15px',fontStyle:'bold',color:'#ffffff',stroke:'#14141a',strokeThickness:3}).setOrigin(.5).setDepth(954);
      s.tweens?.add?.({targets:number,y:number.y-26,alpha:{from:1,to:0},duration:560,ease:'Quad.easeOut',onComplete:()=>number.destroy()});
    }
    const word=impactWord(attack,dealt,killed,this.count);this.count++;
    if(!word || (!killed && (s.combatTime??0)-this.lastAt<IMPACT.gapMs))return;
    this.lastAt=s.combatTime??0;
    const facing=attack.facing||1,x=enemy.x+facing*18,y=top-14,angle=(this.count%2?-1:1)*(8+this.count%3*3);
    const color=IMPACT.colors[this.count%IMPACT.colors.length],size=killed?40:30;
    const burst=s.add.graphics?.();
    if(burst){
      const points=[];for(let i=0;i<16;i++){const r=i%2?size*.55:size*1.05,a=i/16*Math.PI*2;points.push({x:Math.cos(a)*r*1.5,y:Math.sin(a)*r});}
      burst.fillStyle(0x14141a,1).fillPoints(points.map(p=>({x:p.x*1.12,y:p.y*1.12})),true);
      burst.fillStyle(0xffffff,1).fillPoints(points,true);
      burst.setPosition(x,y).setDepth(955).setAngle(angle).setScale(.3);
    }
    const text=s.add.text(x,y,word,{fontFamily:FONT,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#14141a',strokeThickness:6}).setOrigin(.5).setDepth(956).setAngle(angle).setScale(.3);
    const parts=[text,burst].filter(Boolean);
    s.tweens?.add?.({targets:parts,scale:1.12,duration:110,ease:'Back.easeOut',onComplete:()=>
      s.tweens?.add?.({targets:parts,scale:1,alpha:0,y:y-14,duration:320,delay:240,onComplete:()=>parts.forEach(p=>p.destroy())})});
  }
  /** Last hit on a boss: brief slow motion, a slight zoom and a ¡K.O.! across the screen. */
  finale(){
    const s=this.scene,f=IMPACT.finale,camera=s.cameras?.main;if(this.finaleActive || !camera)return;
    this.finaleActive=true;s.timeScale=f.slow;if(s.tweens)s.tweens.timeScale=f.slow;
    camera.zoomTo?.(f.zoom,f.zoomInMs);camera.flash?.(140,255,255,255);camera.shake?.(220,.006);
    const label=s.add?.text?.(480,200,'¡K.O.!',{fontFamily:FONT,fontSize:'96px',fontStyle:'bold',color:'#ffe14d',stroke:'#7b2409',strokeThickness:12})
      ?.setOrigin(.5).setScrollFactor(0).setDepth(1006).setScale(2.2).setAlpha(0);
    if(label){label.setAlpha(1);label.setScale(1);}
    const end=()=>{
      if(!this.finaleActive)return;this.finaleActive=false;s.timeScale=1;if(s.tweens)s.tweens.timeScale=1;
      camera.zoomTo?.(1,f.zoomOutMs);label?.destroy();
    };
    if(s.time?.delayedCall)s.time.delayedCall(f.finaleMs,end);else end();
    s.events?.once?.('shutdown',end);
  }
}
