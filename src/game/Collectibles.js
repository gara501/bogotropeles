export const MONSERRATE_CARD=Object.freeze({id:'el-perdido-de-la-pena-lisa',name:'El perdido de la Peña-Lisa',points:5000,code:'MON',number:'001',zone:'MONSERRATE',seal:'ASCENSO PERFECTO',requirement:'Completa Monserrate sin recibir golpes ni chocar.',art:'pena-lisa-pixellab'});
export const LEVEL_CARDS=Object.freeze([
  {id:'las-damas-de-la-montana',name:'Las damas de la montaña',combatIndex:0,zone:'NIVEL 1 · TRANSMILLENO EXTERIOR',code:'DAM'},
  {id:'boda-en-transmilleno',name:'Boda en transmilleno',mode:'cycling',zone:'CICLOVÍA',code:'BOD'},
  {id:'el-2x1',name:'El 2x1',combatIndex:7,zone:'PLAZA DE PALOMOJAO',code:'2X1'},
  {id:'toreto',name:'Toreto',combatIndex:1,zone:'PLAZA DE BOLÍVAR',code:'TOR'},
  {id:'tapabocas',name:'Tapabocas',combatIndex:3,zone:'TRANSMILLENO · INTERIOR',code:'TAP'},
  {id:'semaforo',name:'Semáforo',combatIndex:5,zone:'SAMBER · CALLES DEL CENTRO',code:'SEM'},
].map((card,index)=>Object.freeze({...card,number:String(index+2).padStart(3,'0'),points:0,seal:'SIN PERDER VIDAS',art:card.id,requirement:`Completa ${card.zone.toLowerCase()} sin perder ninguna vida.`})));
export const COLLECTIBLE_CARDS=Object.freeze([MONSERRATE_CARD,...LEVEL_CARDS]);
const CARD_IDS=new Set(COLLECTIBLE_CARDS.map(card=>card.id));
export const CARDS_KEY='street-bogota-cards-v1';

/** Damage is allowed for these six cards; even a recovered life cannot erase a death. */
export function cardForPerfectLevel(level,{won=false,deaths=0,eligible=true,bonus=false}={}){
  if(!won || !eligible || bonus || deaths!==0)return null;
  return LEVEL_CARDS.find(card=>card.mode?level.mode===card.mode:level.combatIndex===card.combatIndex)??null;
}

export function loadCards(storage,key=CARDS_KEY){
  try{
    const saved=JSON.parse((storage??globalThis.localStorage)?.getItem(key)??'[]');
    if(!Array.isArray(saved))return [];
    const seen=new Set();
    return saved.filter(card=>{
      if(!CARD_IDS.has(card?.id) || typeof card.unlockedAt!=='string' || seen.has(card.id))return false;
      seen.add(card.id);return true;
    }).map(({id,unlockedAt})=>({id,unlockedAt}));
  }catch{return [];}
}

/** A collection is permanent; score is awarded separately by the stage, once at finish. */
export function unlockCard(id,storage,key=CARDS_KEY,now=()=>new Date().toISOString()){
  const cards=loadCards(storage,key);
  if(!CARD_IDS.has(id) || cards.some(card=>card.id===id))return cards;
  cards.push({id,unlockedAt:now()});
  try{(storage??globalThis.localStorage)?.setItem(key,JSON.stringify(cards));}catch{}
  return cards;
}
