import asset0 from '../scenes/monserrate/game/background-v4.png?url';
import vendors from '../scenes/monserrate/game/vendors.png?url';
import roughStone from '../scenes/monserrate/game/rough-stone.png?url';
import fence from '../scenes/monserrate/game/fence.png?url';
import kneeler0 from '../scenes/monserrate/game/kneeler-0.png?url';
import kneeler1 from '../scenes/monserrate/game/kneeler-1.png?url';
import kneeler2 from '../scenes/monserrate/game/kneeler-2.png?url';
import kneeler3 from '../scenes/monserrate/game/kneeler-3.png?url';
export const KNEELER_ASSETS=[kneeler0,kneeler1,kneeler2,kneeler3];
import asset1 from '../scenes/monserrate/game/stone.png?url';
import asset2 from '../scenes/monserrate/game/office.png?url';
import asset3 from '../scenes/monserrate/game/student.png?url';
import asset4 from '../scenes/monserrate/game/teleperforman.png?url';
import asset5 from '../scenes/monserrate/game/gymbro.png?url';
import asset6 from '../scenes/monserrate/game/magolita.png?url';
import asset7 from '../scenes/monserrate/game/hiker-0.png?url';
import asset8 from '../scenes/monserrate/game/hiker-1.png?url';
import asset9 from '../scenes/monserrate/game/hiker-2.png?url';
import asset10 from '../scenes/monserrate/game/hiker-3.png?url';
import asset11 from '../scenes/monserrate/game/hiker-4.png?url';
import asset12 from '../scenes/monserrate/game/hiker-5.png?url';
import asset13 from '../scenes/monserrate/game/hiker-6.png?url';
import asset14 from '../scenes/monserrate/game/hiker-7.png?url';
export const MONSERRATE_ASSETS={'monserrate-background':asset0,'monserrate-stone':asset1,'monserrate-office':asset2,'monserrate-student':asset3,'monserrate-teleperforman':asset4,'monserrate-gymbro':asset5,'monserrate-magolita':asset6,'monserrate-hiker-0':asset7,'monserrate-hiker-1':asset8,'monserrate-hiker-2':asset9,'monserrate-hiker-3':asset10,'monserrate-hiker-4':asset11,'monserrate-hiker-5':asset12,'monserrate-hiker-6':asset13,'monserrate-hiker-7':asset14};
export function preloadMonserrate(scene){
  KNEELER_ASSETS.forEach((url,i)=>{
    const key=`monserrate-kneeler-${i}`;
    if(!scene.textures.exists(key))scene.load.spritesheet(key,url,{frameWidth:192,frameHeight:256});
  });
  if(!scene.textures.exists('monserrate-fence-source'))scene.load.image('monserrate-fence-source',fence);
  if(!scene.textures.exists('monserrate-vendors'))scene.load.spritesheet('monserrate-vendors',vendors,{frameWidth:192,frameHeight:256});
  if(!scene.textures.exists('monserrate-rough-stone'))scene.load.image('monserrate-rough-stone',roughStone);
  for(const [key,url] of Object.entries(MONSERRATE_ASSETS))if(!scene.textures.exists(key)){
    if(key==='monserrate-background' || key==='monserrate-stone')scene.load.image(key,url);
    else scene.load.spritesheet(key,url,{frameWidth:192,frameHeight:256});
  }
}
