import Phaser from 'phaser';
import {ARCADE} from '../data/arcade.js';

// The game draws at 960×540 and the canvas is stretched to fit the window. Text rendered at that size gets
// blocky/blurry once stretched (and on HiDPI screens), so every text is rasterised at the real display
// resolution instead, with smooth (linear) filtering even though the sprites use pixelArt (nearest).
export function textResolution(game) {
  const shown=game?.canvas?.getBoundingClientRect?.().width||ARCADE.screen.width;
  return Math.max(2,Math.min(4,Math.ceil((globalThis.devicePixelRatio||1)*shown/ARCADE.screen.width)));
}
const crisp=text=>{text.texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);return text;};
function eachText(list,fn){for(const object of list??[]){if(object.type==='Text')fn(object);if(object.list)eachText(object.list,fn);}}
function refreshTexts(game,resolution=textResolution(game)) {
  for(const scene of game.scene.getScenes(false))eachText(scene.children?.list,text=>{
    if(text.style.resolution!==resolution)text.setResolution(resolution);else text.updateText();
    crisp(text);
  });
}
export function installCrispText(game) {
  const factory=Phaser.GameObjects.GameObjectFactory.prototype;
  if(!factory.text.crisp){
    const base=factory.text;
    factory.text=function(x,y,value,style={}){return crisp(base.call(this,x,y,value,{resolution:textResolution(this.scene.game),...style}));};
    factory.text.crisp=true;
  }
  // Window resized / moved to another screen: re-rasterise at the new size.
  game.scale.on('resize',()=>refreshTexts(game));
  // Web fonts download lazily (only once something uses them), so request every face the game draws with
  // right away; texts created before they arrived are then redrawn with them.
  const fonts=globalThis.document?.fonts;
  if(fonts?.load)Promise.all(["400 16px 'IBM Plex Mono'","600 16px 'IBM Plex Mono'","700 16px 'Barlow Condensed'",
    "800 16px 'Barlow Condensed'","900 16px 'Barlow Condensed'"].map(face=>fonts.load(face).catch(()=>null))).then(()=>refreshTexts(game));
}
