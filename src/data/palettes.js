// Alternate fighter palettes: a multiply tint over the sprite (Phaser setTint). 'noche' is free (and ready for a
// second player in co-op); the others unlock by playing. State is kept in localStorage, failing safe without it.
export const PALETTES=[
  {id:'original',name:'ORIGINAL',tint:null},
  {id:'noche',name:'NOCHE',tint:0xa8b6ff},
  {id:'neon',name:'NEÓN',tint:0xff9ff0,unlock:'centro'},
  {id:'dorado',name:'DORADO',tint:0xffd27a,unlock:'campaign'},
];
export const UNLOCKS={centro:'Vence a Brayatan en Calles del centro',campaign:'Termina la campaña'};
// Level name whose victory unlocks each palette ('campaign' is the final victory).
export const UNLOCK_LEVELS={'Calles del centro':'centro'};
export const PALETTE_KEY='street-bogota-palettes-v1';
export function loadPaletteState(storage){
  try{const saved=JSON.parse(storage?.getItem(PALETTE_KEY)??'null');
    return {selected:saved?.selected && typeof saved.selected==='object'?saved.selected:{},unlocked:Array.isArray(saved?.unlocked)?saved.unlocked.filter(id=>UNLOCKS[id]):[]};}
  catch{return {selected:{},unlocked:[]};}
}
export function savePaletteState(state,storage){try{storage?.setItem(PALETTE_KEY,JSON.stringify(state));}catch{/* storage blocked */}}
export const paletteAvailable=(palette,state)=>!palette.unlock || state.unlocked.includes(palette.unlock);
/** Returns true when it is new. */
export function unlockPalette(state,unlock){if(!UNLOCKS[unlock] || state.unlocked.includes(unlock))return false;state.unlocked.push(unlock);return true;}
export function paletteFor(character,state){
  const palette=PALETTES.find(p=>p.id===state?.selected?.[character]);
  return palette && paletteAvailable(palette,state)?palette:PALETTES[0];
}
export function cyclePalette(character,state,direction=1){
  const available=PALETTES.filter(p=>paletteAvailable(p,state)),index=available.indexOf(paletteFor(character,state));
  const next=available[(index+direction+available.length)%available.length];state.selected[character]=next.id;return next;
}
/** Tints a sprite and keeps the tint through hit flashes: its clearTint() puts the palette back. */
export function applyPalette(sprite,palette){
  if(!sprite?.setTint)return;
  sprite.paletteTint=palette?.tint??null;
  if(!sprite.clearTintBase){
    sprite.clearTintBase=sprite.clearTint.bind(sprite);
    sprite.clearTint=function(){this.clearTintBase();if(this.paletteTint!=null)this.setTint(this.paletteTint);return this;};
  }
  sprite.clearTint();
}
