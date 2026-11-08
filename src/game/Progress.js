// Everything the player unlocks, as named "slots": each one knows how to read itself from localStorage,
// write itself back and merge two copies without ever losing an unlock. CloudSave syncs the slots with
// Supabase; a future unlock only needs one more slot here (registerSlot) to be saved online too.
import {loadCards,CARDS_KEY} from './Collectibles.js';
import {PALETTE_KEY,UNLOCKS} from '../data/palettes.js';
import {SURVIVAL} from './Survival.js';

export const PROGRESS_KEY='street-bogota-progress-v1';
const read=(storage,key,fallback)=>{try{const raw=storage?.getItem(key);return raw==null?fallback:JSON.parse(raw);}catch{return fallback;}};
const write=(storage,key,value)=>{try{storage?.setItem(key,typeof value==='string'?value:JSON.stringify(value));}catch{/* storage blocked */}};

/** Highest story level unlocked: 0 = only the first. A level unlocks only after the previous one is beaten. */
export const unlockedLevel=storage=>{const n=Number(read(storage,PROGRESS_KEY,0));return Number.isFinite(n)?Math.max(0,Math.floor(n)):0;};
/** Beating level `index` unlocks `index+1`. Returns true when it is a new unlock. */
export function markLevelCleared(index,storage){
  if(!Number.isInteger(index) || index<0 || index+1<=unlockedLevel(storage))return false;
  write(storage,PROGRESS_KEY,String(index+1));return true;
}

const surviveBest=(a,b)=>{
  const ok=r=>r && Number.isFinite(r.wave);
  if(!ok(a))return ok(b)?b:null;if(!ok(b))return a;
  return b.wave>a.wave || (b.wave===a.wave && b.score>a.score)?b:a;
};

/** Slot definitions. `local` wins for choices (selected colour); unlocks are always the union / maximum. */
export function createProgressSlots({cardsKey=CARDS_KEY}={}){
  return {
    levels:{
      read:s=>unlockedLevel(s),
      write:(s,v)=>{const n=Math.max(0,Math.floor(Number(v)||0));if(n>unlockedLevel(s))write(s,PROGRESS_KEY,String(n));},
      merge:(a,b)=>Math.max(Math.floor(Number(a)||0),Math.floor(Number(b)||0)),
    },
    cards:{
      read:s=>loadCards(s,cardsKey),
      write:(s,v)=>{write(s,cardsKey,v);},
      merge:(a,b)=>{
        const byId=new Map();
        for(const card of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])]){
          if(typeof card?.id!=='string' || typeof card.unlockedAt!=='string')continue;
          const seen=byId.get(card.id);if(!seen || card.unlockedAt<seen.unlockedAt)byId.set(card.id,{id:card.id,unlockedAt:card.unlockedAt});
        }
        return [...byId.values()].sort((x,y)=>x.unlockedAt.localeCompare(y.unlockedAt));
      },
    },
    palettes:{
      read:s=>{const v=read(s,PALETTE_KEY,null);return {selected:v?.selected && typeof v.selected==='object'?v.selected:{},unlocked:Array.isArray(v?.unlocked)?v.unlocked:[]};},
      write:(s,v)=>write(s,PALETTE_KEY,v),
      merge:(a,b)=>({selected:{...(b?.selected??{}),...(a?.selected??{})},
        unlocked:[...new Set([...(a?.unlocked??[]),...(b?.unlocked??[])])].filter(id=>UNLOCKS[id])}),
    },
    survival:{
      read:s=>read(s,SURVIVAL.recordKey,null),
      write:(s,v)=>{if(v)write(s,SURVIVAL.recordKey,v);},
      merge:surviveBest,
    },
  };
}

/** Adds a slot for something new (e.g. trophies, skins): {read(storage), write(storage,value), merge(local,remote)}. */
export function registerSlot(slots,name,slot){
  if(!slot?.read || !slot?.write || !slot?.merge)throw new Error(`slot ${name}: read, write y merge son obligatorios`);
  slots[name]=slot;return slots;
}

export function collectProgress(slots,storage){
  const data={};for(const [name,slot] of Object.entries(slots))data[name]=slot.read(storage);
  return data;
}
/** Local first: a remote document can only add unlocks. */
export function mergeProgress(slots,local,remote){
  const data={...(remote&&typeof remote==='object'?remote:{})}; // keeps slots a newer version of the game added
  for(const [name,slot] of Object.entries(slots))data[name]=slot.merge(local?.[name],remote?.[name]);
  return data;
}
/** Writes every known slot locally; returns the names that changed. */
export function applyProgress(slots,storage,data){
  const changed=[];
  for(const [name,slot] of Object.entries(slots)){
    if(!(name in (data??{})))continue;
    const before=JSON.stringify(slot.read(storage));slot.write(storage,data[name]);
    if(JSON.stringify(slot.read(storage))!==before)changed.push(name);
  }
  return changed;
}
