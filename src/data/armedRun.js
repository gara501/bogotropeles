// Armed locomotion cycles: equal cells, one per pose, played in `order`.
// (sequential: the last pose lands into the first). Pure data, no asset imports, so game logic and tests can load it.
// Both objects use full locomotion loops at the native unarmed body scale.
export const ARMED_RUN=Object.fromEntries(['office','student','teleperforman','gymbro','magolita'].map(character=>{
  const poses=character==='office'?10:8;
  return [character,{poses,order:Array.from({length:poses},(_,i)=>i),scale:1,cellWidth:256,cellHeight:256,anchor:128}];
}));
export const PANELA_RUN=ARMED_RUN;
export const armedRunTexture=(character,item='vuvuzela')=>`${character}-${item}-run`;
// Match weapon-sheet bodies to each character's guard/run reference.
// Gymbro's armed body is bulkier; Teleperforman's guard is 178px, not 195px.
export const ARMED_BODY_SCALE={gymbro:.91,teleperforman:178/195};
