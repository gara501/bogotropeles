// Render at the original world resolution to preserve sprite and HUD detail.
export const ARCADE={
  screen:{width:960,height:540,worldWidth:960,worldHeight:540,zoom:1,minFontSize:5},
  clock:{fps:60,stepMs:1000/60,maxCatchUp:6},
  movement:{depthRatio:.6,deadZone:.16},
  // comboLinkFrames: after a combo strike ends, the next input of the chain still links within this window.
  input:{bufferFrames:8,comboCancelFrames:6,comboLinkFrames:20},
  body:{halfWidth:18,halfDepth:8,lane:24,backReach:10,airborneAvoidHeight:25,projectileAvoidHeight:35},
  hazards:{motoHalfWidth:28,motoSpeed:450},
  jump:{frames:39,height:72},dash:{frames:11,cooldown:51,speed:650,invulnerable:17},
  player:{speeds:{office:205,student:290,teleperforman:220,gymbro:180,magolita:205},specialLifeCost:10,hurtFrames:12,knockdownFrames:45,wakeInvulnerable:30,hitInvulnerable:24,respawnInvulnerable:180},
  attack:{knockback:8,finisherKnockback:24,stun:20},
  feedback:{hitstop:3,finisherHitstop:5,flash:3,impact:3,impactRadius:12,shakeMs:45,shakeStrength:.0015},
  ai:{tokens:2,comboStages:3,depthRatio:.55,windup:29,active:3,recovery:29,cooldown:126,rangedCooldown:168,
    circleX:45,circleY:22,alignY:10,circleSpeed:.7,initialCooldown:60,spawnSlots:3,spawnStagger:18,hurtCooldown:30,chargeHalfWidth:40},
  animation:{walkFramesPerPose:6},
  // Side-scrolling: waves are grouped in arenas `advance` px apart; the camera locks in each one.
  // maxScrollStep/ease: the camera catches up smoothly instead of snapping when an arena unlocks.
  stage:{advance:720,wavesPerArena:2,lead:.45,margin:65,backDepth:-100,frontDepth:800,maxScrollStep:8,ease:.2},
  enemies:{
    brawler:{speed:140,attackFrames:{startup:22,recovery:22,cooldown:78}},
    fan:{speed:150,attackFrames:{startup:20,recovery:20,cooldown:66}},
  },
  // Final Fight style HUD; timeLimit: seconds per arena/boss (0 hides TIME and disables the countdown).
  hud:{enabled:true,timeLimit:99},
  flow:{victoryFrames:60,resultDelayFrames:66,blinkPeriod:6,blinkVisible:3,blinkAlpha:.25},
  lanes:[{top:400,bottom:500},{top:410,bottom:500},{top:415,bottom:500},
    {top:355,bottom:500},{top:375,bottom:500},{top:410,bottom:500}],
};
export const toFrames=ms=>Math.max(1,Math.round(ms/ARCADE.clock.stepMs));
export function fitArcadeCamera(scene){
  scene.cameras.main.setZoom(ARCADE.screen.zoom).centerOn(ARCADE.screen.worldWidth/2,ARCADE.screen.worldHeight/2);
  scene.cameras.main.roundPixels=true;
}
export function fitArcadeText(text){
  if(text.arcadeFitted || !text.style || ARCADE.screen.zoom===1)return text;
  text.arcadeFitted=true;
  text.setFontSize(Math.max(ARCADE.screen.minFontSize,Math.round(parseInt(text.style.fontSize)*ARCADE.screen.zoom)));
  text.setResolution(1).setScale(1/ARCADE.screen.zoom);
  if(text.style.strokeThickness)text.setStroke(text.style.stroke,1);
  return text;
}
