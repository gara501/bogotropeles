// Return the first footprint reached along a swept segment, independently of
// collection order. Ground lanes are separate from the drawing's flight height.
export function firstPhoneTarget(previousX, currentX, groundY, facing, targets, lane) {
  const length=Math.abs(currentX-previousX);
  let closest=null;
  for(const target of targets) {
    if(Math.abs(groundY-target.y)>(target.lane??lane))continue;
    const distance=(target.x-previousX)*facing;
    const radius=target.radius??18;
    if(distance+radius<0 || distance-radius>length)continue;
    const contact=Math.max(0,distance-radius);
    if(!closest || contact<closest.contact)closest={...target,contact};
  }
  return closest;
}
