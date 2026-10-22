import jersey from './NPC/chiva/jersey.png?url';
import mint from './NPC/chiva/mint.png?url';
import black from './NPC/chiva/black.png?url';
import blonde from './NPC/chiva/blonde.png?url';
import red from './NPC/chiva/red.png?url';
import charcoal from './NPC/chiva/charcoal.png?url';
import glasses from './NPC/chiva/glasses.png?url';
import green from './NPC/chiva/green.png?url';

// Each spectator has four dancing frames followed by four frightened frames.
export const CHIVA_CROWD=Object.entries({jersey,mint,black,blonde,red,charcoal,glasses,green})
  .map(([id,url])=>({id,key:`bonus-crowd-${id}`,url}));
export const CROWD_HEIGHT=128;
