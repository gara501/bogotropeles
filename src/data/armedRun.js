// Armed locomotion cycles: equal cells, one per pose, played in `order`.
// (sequential: the last pose lands into the first). Pure data, no asset imports, so game logic and tests can load it.
// Characters without an entry keep the four walking poses of their 3x3 vuvuzela sheet.
export const ARMED_RUN={office:{poses:10,order:[0,1,2,3,4,5,6,7,8,9],scale:1.45},
  teleperforman:{poses:8,order:[0,1,2,3,4,5,6,7],scale:178/195,cellWidth:256,cellHeight:256,anchor:127},
  magolita:{poses:8,order:[0,1,2,3,4,5,6,7],scale:1,cellWidth:256,cellHeight:256,anchor:145}};
export const PANELA_RUN={office:ARMED_RUN.office};
export const armedRunTexture=(character,item='vuvuzela')=>`${character}-${item}-run`;
// Match weapon-sheet bodies to each character's guard/run reference.
// Gymbro's armed body is bulkier; Teleperforman's guard is 178px, not 195px.
export const ARMED_BODY_SCALE={gymbro:.91,teleperforman:178/195};
