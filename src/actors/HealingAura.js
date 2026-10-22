/** Combat-clock effect: follows the mime, freezes with gameplay and disappears on interruption. */
export class HealingAura{
  constructor(model){this.model=model;this.graphic=model.scene.add?.graphics?.();this.update();}
  update(){
    const g=this.graphic;if(!g)return;
    const a=this.model.actor,t=this.model.age/60,pulse=(Math.sin(t*9)+1)/2;
    g.clear().setDepth(a.y+3);
    g.fillStyle(0x76ffad,.1+pulse*.08).fillEllipse(a.x,a.y-a.config.height*.45,75,125);
    g.lineStyle(2,0x94ffc0,.55+pulse*.3).strokeEllipse(a.x,a.y-2,70+pulse*18,20+pulse*6);
    for(let i=0;i<5;i++){
      const rise=(t*.7+i/5)%1,x=a.x+Math.sin(i*2.4+t*2)*38,y=a.y-15-rise*105;
      g.fillStyle(i%2?0xffffff:0x8affb7,Math.sin(rise*Math.PI)*.9);
      g.fillRect(x-2,y-6,4,12).fillRect(x-6,y-2,12,4);
    }
  }
  destroy(){this.graphic?.destroy();this.graphic=null;}
}
