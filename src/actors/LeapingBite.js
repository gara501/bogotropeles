const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Capture the landing lane at takeoff; movement and contact follow active animation frames. */
export class LeapingBite {
  constructor(model,frames){
    const a=model.actor,s=model.scene,c=a.config.leap;
    this.actor=a;this.config=c;this.frames=frames;this.frame=0;
    this.origin={x:a.x,y:a.y};
    const distance=clamp((s.player.x-a.x)*a.facing-c.landingGap,0,c.distance);
    this.target={x:clamp(a.x+a.facing*distance,s.floor.left,s.floor.right),y:clamp(s.player.y,s.floor.top,s.floor.bottom)};
  }
  step(){
    const a=this.actor,c=this.config,t=Math.min(1,++this.frame/this.frames);
    a.x=this.origin.x+(this.target.x-this.origin.x)*t;a.y=this.origin.y+(this.target.y-this.origin.y)*t;
    a.z=this.frame>=this.frames?0:Math.sin(t*Math.PI)*c.height;
    return this.frame>=c.contactFrames[0] && this.frame<=c.contactFrames[1];
  }
  cancel(){this.actor.z=0;}
}
