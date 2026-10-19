/** Balance and source coordinates for Gomelo's ranged special. */
export const IPHONE = {
  texture: 'iphone',
  sourceRect: { x:690, y:602, width:47, height:34 },
  releaseFrame:18,
  width:24, height:17, handOffset:62, flightHeight:86,
  speed:600, spin:12, lifetime:1600, arenaWidth:960, lane:26,
  // Impact burst where the phone lands: flash, spark star and an expanding ring.
  impact:{ms:420,ring:58,star:34,color:0xfff2a8,ringColor:0x6fe3ff},
  attack: {
    damage:90, range:960*.7, duration:700, hitAt:280,
    knockback:34, stun:420, cooldown:2000, projectile:'iphone', cooldownOnRelease:true,
  },
};
