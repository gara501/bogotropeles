import {knifeHits} from '../combat.js';
import {viewLeft} from '../stage/scroll.js';

// Blasts stay in the projectile list so pause and scene cleanup also cover them.
export function updateTaximeter(scene,p,dt){
  const c=p.taximeter;
  if(p.blasting){
    p.blastAge+=dt;
    const frame=8+Math.floor(p.blastAge*c.blastFps);
    if(frame>=16){p.sprite.destroy();return false;}
    p.sprite.setFrame(String(frame));return true;
  }
  p.age=(p.age??0)+dt;
  const previous=p.x;
  p.x+=p.facing*p.speed*dt;p.sprite.x=p.x;
  p.sprite.setFrame(String(Math.floor(p.age*c.flightFps)%8));
  const hit=scene.playerAttack?.type!=='lowKick' && knifeHits(previous,p.x,p.y,scene.player,scene.jumpHeight);
  const left=viewLeft(scene);
  if(hit || Math.abs(p.x-p.startX)>=c.distance || p.x<left-40 || p.x>left+1000){
    if(hit){
      p.x=Math.max(Math.min(previous,p.x),Math.min(Math.max(previous,p.x),scene.player.x));
      scene.hitPlayer(p.damage,null,p.owner);
    }
    p.blasting=true;p.blastAge=0;
    p.sprite.setPosition(p.x,p.y-p.lift).setFrame('8').setDisplaySize(c.blastSize,c.blastSize);
  }
  return true;
}
