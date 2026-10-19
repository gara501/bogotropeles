// Pure scrolling rules (no Phaser) so they can be tested with node --test.
import {ARCADE} from '../data/arcade.js';
import {waveSize} from '../data/campaign.js';

/** Left edge of the visible world. Mock scenes without a camera stay at 0. */
export const viewLeft=scene=>scene?.cameras?.main?.scrollX??0;

/** Wave sizes in spawn order, following the same rule as WaveDirector. */
export function waveSizes(total) {
  const sizes=[];
  for(let wave=0,left=total;left>0;wave++){const n=waveSize(wave,left);sizes.push(n);left-=n;}
  return sizes;
}

/**
 * Splits a level into "arenas": the camera locks in each arena until its waves are
 * cleared, then GO → lets the player walk `advance` pixels to the next one.
 */
export function stageLayout(level,config=ARCADE.stage) {
  const perArena=level.wavesPerArena??config.wavesPerArena;
  const advance=level.advance??config.advance;
  const arenas=Math.max(1,Math.ceil(waveSizes(level.total).length/perArena));
  return {perArena,advance,arenas,width:(arenas-1)*advance+ARCADE.screen.width};
}

export const arenaScroll=(layout,index)=>Math.max(0,Math.min(index,layout.arenas-1))*layout.advance;

/**
 * Final Fight camera: follows the player forward, never scrolls back and never
 * passes `limit` (right edge of the area currently unlocked).
 */
export function nextScroll({scrollX,playerX,limit,view=ARCADE.screen.width,lead=ARCADE.stage.lead}) {
  const max=Math.max(0,limit-view);
  return Math.min(max,Math.max(scrollX,Math.round(playerX-view*lead)));
}

/**
 * Moves the camera one frame towards `target`. Without this, unlocking an arena while the
 * player stands at the right edge made the camera jump ~370 px in a single frame.
 * Eases in (20% of the gap per frame) and never exceeds maxStep px per frame.
 */
export function stepScroll(current,target,{maxStep=ARCADE.stage.maxScrollStep,ease=ARCADE.stage.ease}={}) {
  if(target<=current)return target;
  return current+Math.min(target-current,maxStep,Math.max(1,Math.ceil((target-current)*ease)));
}

/** Walkable floor for a given scroll position. */
export const floorSpan=(scrollX,margin=ARCADE.stage.margin)=>({left:scrollX+margin,right:scrollX+ARCADE.screen.width-margin});
