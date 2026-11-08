// Night variants. A level with `night` keeps its art: the panorama layer gets a vertical colour grade (dark sky,
// lighter street) and additive glows are pinned to its windows, lamps, sign and neon (src/stage/NightMode.js).
// Light x/y are pixels of the layer's source image; radius is on screen.
const warm=0xffb45c,lamp=0xffe6ad,glass=0x9fd4ff;
const row=(xs,y,props)=>xs.map(x=>({x,y,...props}));
export const ZONA_ROSA_NIGHT={
  layer:'panorama',
  // Phaser multi-corner tint: top-left, top-right, bottom-left, bottom-right.
  tint:[0x23285a,0x2a2560,0x7d7fb8,0x7d7fb8],
  floorTint:0x8a8cc0,
  ambient:0xd9dcff,
  lights:[
    {x:1150,y:178,color:0xe8f0ff,radius:40,intensity:.7},{x:1150,y:178,color:0x9fb8ff,radius:120,intensity:.14}, // moon, below the HUD band
    {x:1938,y:136,color:0xffd78a,radius:22,intensity:.7},                              // Monserrate, far away
    {x:514,y:322,color:0xfff2c8,radius:72,intensity:.5},                               // ANDINO sign
    ...row([54,1005,1330,1781,2123],372,{color:lamp,radius:34,intensity:.85}),       // lamp globes
    ...row([54,1005,1330,1781,2123],470,{color:lamp,radius:95,intensity:.22}),       // their pools on the sidewalk
    ...row([250,358,695,826,923,1086,1216,1303,1412,1520,1607,1716,1933,2063],448,{color:warm,radius:40,intensity:.42}), // shop windows
    ...row([152,272,358,673,826,923,1249,1510,1922,2085],304,{color:glass,radius:30,intensity:.3}),                     // upper glass
    {x:760,y:356,color:0xff4fb8,radius:62,intensity:.55,flicker:.35},                  // Zona Rosa neon
    {x:1585,y:318,color:0x4fe6ff,radius:56,intensity:.5,flicker:.25},
    {x:1150,y:420,color:0xff7a3d,radius:48,intensity:.4,flicker:.2},
  ],
};
