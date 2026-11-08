import background from '../scenes/aura/background.png?url';
import crowd from '../scenes/aura/game/cast-v2/crowd.png?url';
import idle from '../scenes/aura/game/cast-v2/gordo-idle-taunt.png?url';
import hype from '../scenes/aura/game/cast-v2/gordo-crowd-hype.png?url';
import defeat from '../scenes/aura/game/cast-v2/gordo-defeat.png?url';
import {AURA_PLAYER_ASSETS} from './auraPlayerAssets.js';
import {AURA_PLAYER_ART,AURA_WALK_ART,AURA_RIVAL_ART,AURA_CROWD_ART} from '../aura/spriteLayout.js';

export {AURA_LEVEL} from './campaign.js';
export const AURA_MOVES=[
  {id:'six-seven',label:'SIX SEVEN',key:'ONE',alias:'H'},
  {id:'boat-paddle-dance',label:'BOAT PADDLE',key:'TWO',alias:'J'},
  {id:'mewing',label:'MEWING',key:'THREE',alias:'K'},
  {id:'chen-chupas',label:'CHEN CHUPAS',key:'FOUR',alias:'L'},
  {id:'sigma-finish',label:'SIGMA FINISH',key:'FIVE',alias:'SPACE'},
];
export const AURA_NPCS=[
  {name:'Presentador',frame:0,x:480,y:375,height:113},
  {name:'Parcero grabando',frame:1,x:66,y:422,height:124},
  {name:'Fan de tenis rojos',frame:2,x:174,y:399,height:116},
  {name:'Rival del público',frame:3,x:786,y:399,height:116},
  {name:'La que anima',frame:4,x:285,y:370,height:106},
  {name:'Creador de contenido',frame:5,x:895,y:422,height:124},
  {name:'La de las reacciones',frame:6,x:675,y:371,height:105},
  {name:'El del ruido',frame:7,x:580,y:371,height:106},
];
export const AURA_ASSETS={'aura-background':background,'aura-crowd':crowd,'aura-gordo-idle':idle,'aura-gordo-hype':hype,'aura-gordo-defeat':defeat,...AURA_PLAYER_ASSETS};
export function preloadAura(scene,character=scene.characterKey){
  for(const [key,url] of Object.entries(AURA_ASSETS)){
    if(key.startsWith('aura-') && !key.startsWith('aura-gordo-') && !['aura-background','aura-crowd'].includes(key) && !key.startsWith(`aura-${character}-`))continue;
    if(scene.textures.exists(key))continue;
    if(key==='aura-background')scene.load.image(key,url);
    else {
      const layout=key==='aura-crowd'?AURA_CROWD_ART:key.startsWith('aura-gordo-')?AURA_RIVAL_ART:key.endsWith('-walk')?AURA_WALK_ART:AURA_PLAYER_ART;
      scene.load.spritesheet(key,url,{frameWidth:layout.frameWidth,frameHeight:layout.frameHeight});
    }
  }
}
