export const MUSIC_TRACKS=Array.from({length:7},(_,i)=>({key:`music-${i+1}`,url:`${import.meta.env?.BASE_URL??'./'}assets/music${i+1}.ogg`}));
export const LEVEL1_MUSIC={key:'level1-music',url:`${import.meta.env?.BASE_URL??'./'}assets/level1.mp3`};
export function chooseMusic(previous,random=Math.random) {
  const choices=MUSIC_TRACKS.filter(track=>track.key!==previous);
  return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
}
