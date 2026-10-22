// Arcade rule: at most MAX_CONTINUES continues per game; after that, losing the last life is game over.
export const MAX_CONTINUES=3;
export class RunState {
  constructor(){this.reset();}
  reset(){this.level=0;this.lives=3;this.score=0;this.levelStartScore=0;this.continuesUsed=0;this.chivaBonusPlayed=false;}
  award(points){this.score+=points;return this.score;}
  loseLife(){this.lives=Math.max(0,this.lives-1);return this.lives;}
  get continuesLeft(){return Math.max(0,MAX_CONTINUES-this.continuesUsed);}
  get canContinue(){return this.continuesLeft>0;}
  continue(){if(!this.canContinue)return false;this.continuesUsed++;this.lives=3;return true;}
  advance(level){this.level=level;this.levelStartScore=this.score;}
}

export class ContinueCountdown {
  constructor(now=()=>performance.now()){this.now=now;this.deadline=now()+10000;this.closed=false;}
  get remaining(){return Math.max(0,Math.ceil((this.deadline-this.now())/1000));}
  accept(){if(this.closed || this.remaining===0)return false;this.closed=true;return true;}
}

export function saveRecord(score,character,storage,key='street-bogota-record-v1') {
  let record={score:0,character:''};
  try {
    storage??=globalThis.localStorage;
    const saved=JSON.parse(storage?.getItem(key)??'null');
    if(Number.isFinite(saved?.score) && saved.score>=0 && typeof saved.character==='string')record=saved;
  } catch {}
  if(score>record.score || !record.character) {
    record={score,character};
    try{storage?.setItem(key,JSON.stringify(record));}catch{}
  }
  return record;
}

// Local ranking (top RANKING_SIZE), saved in localStorage until there is an online leaderboard.
export const RANKING_SIZE=10;
export const RANKING_KEY='street-bogota-ranking-v1';
/** Up to 3 letters/digits, uppercase (arcade initials). */
export const cleanInitials=value=>String(value??'').toUpperCase().replace(/[^A-Z0-9Ñ]/g,'').slice(0,3);
export function loadRanking(storage,key=RANKING_KEY) {
  try {
    storage??=globalThis.localStorage;
    const saved=JSON.parse(storage?.getItem(key)??'[]');
    return Array.isArray(saved)?saved.filter(entry=>Number.isFinite(entry?.score) && typeof entry.initials==='string').slice(0,RANKING_SIZE):[];
  } catch {return [];}
}
/** Whether a score would enter the ranking. */
export const qualifiesForRanking=(score,ranking)=>score>0 && (ranking.length<RANKING_SIZE || score>ranking[ranking.length-1].score);
/** Inserts an entry (ties keep the older one first) and returns {ranking, position} (position -1 if it did not enter). */
export function addToRanking(entry,storage,key=RANKING_KEY) {
  const ranking=loadRanking(storage,key),item={...entry,initials:cleanInitials(entry.initials)||'???',date:entry.date??new Date().toLocaleDateString('sv')};
  let index=ranking.findIndex(other=>item.score>other.score);if(index<0)index=ranking.length;
  ranking.splice(index,0,item);const top=ranking.slice(0,RANKING_SIZE);
  try{(storage??globalThis.localStorage)?.setItem(key,JSON.stringify(top));}catch{}
  return {ranking:top,position:index<RANKING_SIZE?index:-1};
}
