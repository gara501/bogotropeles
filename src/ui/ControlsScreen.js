// "¿Cómo se juega?" screen between the character selection and the first level (desktop only).
// It lists the keys for the chosen fighter and waits for ENTER; ESC goes back to the selection.
import {characters} from '../data/characters.js';
import {COMBO_ROUTES} from '../data/comboRoutes.js';

const MOVE=[['W','A','S','D'],['↑','←','↓','→']];
export function controlsFor(key){
  const c=characters[key]??{},special=c.specialLabel??'ESPECIAL';
  const actions=[
    {keys:['H'],label:'PUÑO · ×3 COMBO'},
    {keys:['J'],label:'PATADA · ×3 COMBO'},
    {keys:['K'],label:`${special}`,note:'−10 VIDA'},
    {keys:['SPACE'],label:'SALTO'},
    {keys:['SHIFT'],label:key==='gymbro'?'DASH / HOMBRAZO':'DASH'},
    {keys:['Q'],label:'SÚPER',note:'20 GOLPES SIN DAÑO'},
    {keys:['U'],label:'PARRY',note:'JUSTO CUANDO TE VAN A PEGAR · CONTRAATACA'},
  ];
  if(key==='student')actions.splice(3,0,{keys:['L'],label:'PATADA BAJA'});
  const combos=[
    {keys:['H','J'],label:'5 COMBOS DE PUÑO Y PATADA',sequence:true,note:'MÍRALOS EN «COMBOS», EN EL MENÚ PRINCIPAL'},
    {keys:['SHIFT','J'],label:key==='gymbro'?'HOMBRAZO EN CARRERA':'BARRIDA EN CARRERA'},
    {keys:['SPACE','K'],label:'PATADA AÉREA'},
    {keys:['J'],label:'SOLTAR LA VUVUZELA (CUANDO LA TIENES)'},
  ];
  if(key==='student')combos.push({keys:['SPACE','SHIFT','J'],label:'PATADA CON DASH AÉREO',note:'AL ACERTAR REBOTAS; SHIFT + J PARA ENCADENAR'});
  if(key==='gymbro')combos.push({keys:['SPACE','H'],label:'SPINNING PILEDRIVER',note:'AGARRA AL RIVAL, SALTA Y LUEGO PULSA PUÑO · MÁS DAÑO Y ATURDIMIENTO'});
  return {name:c.name??key,actions,combos,system:[{keys:['P'],label:'PAUSA'},{keys:['R'],label:'REINICIAR NIVEL'},
    {keys:['A','X','Y','B'],label:'GAMEPAD',note:'SALTO · PUÑO · PATADA · ESPECIAL'},{keys:['LB','RB','LT','RT'],label:'GAMEPAD',note:'PARRY · DASH · PATADA BAJA · SÚPER · START PAUSA'}]};
}

const kbd=(k)=>{const el=document.createElement('kbd');el.textContent=k;if(k.length>1 && !/^[↑↓←→]$/.test(k))el.className='wide';return el;};
function row({keys,label,note,sequence=false},joiner='+'){
  const li=document.createElement('li'),keysEl=document.createElement('span');keysEl.className='keys';
  keys.forEach((k,i)=>{if(i)keysEl.append(Object.assign(document.createElement('i'),{textContent:sequence?'→':joiner}));keysEl.append(kbd(k));});
  const text=document.createElement('span');text.className='what';text.textContent=label;
  if(note)text.append(Object.assign(document.createElement('small'),{textContent:note}));
  li.append(keysEl,text);return li;
}

export class ControlsScreen{
  constructor(root){
    this.root=root;this.onDone=null;this.onBack=null;
    root.querySelector('#controls-start').addEventListener('click',()=>this.confirm());
    root.querySelector('#controls-back').addEventListener('click',()=>this.back());
  }
  get open(){return !this.root.hidden;}
  show(key,{portrait=null,onDone,onBack}={}){
    const data=controlsFor(key),q=s=>this.root.querySelector(s);
    q('#controls-name').textContent=data.name;
    const img=q('.controls-portrait');img.hidden=!portrait;if(portrait)img.src=portrait;
    const pad=q('.controls-move');pad.replaceChildren(...MOVE.map(set=>{
      const grid=document.createElement('div');grid.className='dpad';
      set.forEach((k,i)=>{const el=kbd(k);el.style.gridArea=['up','left','down','right'][i];grid.append(el);});return grid;}));
    q('#controls-actions').replaceChildren(...data.actions.map(a=>row(a)));
    q('#controls-combos').replaceChildren(...data.combos.map(a=>row(a)));
    q('#controls-system').replaceChildren(...data.system.map(a=>row(a)));
    this.onDone=onDone;this.onBack=onBack;this.root.hidden=false;
    q('.controls-panel').scrollTop=0;
    setTimeout(()=>q('#controls-start').focus({preventScroll:true}),0);
  }
  hide(){this.root.hidden=true;}
  confirm(){if(!this.open)return;const done=this.onDone;this.hide();this.onDone=this.onBack=null;done?.();}
  back(){if(!this.open)return;const back=this.onBack;this.hide();this.onDone=this.onBack=null;back?.();}
  /** Returns true when the key was handled (main.js keydown). */
  handleKey(event){
    if(!this.open)return false;
    if(event.key==='Enter'){event.preventDefault();if(!event.repeat)this.confirm();return true;}
    if(event.key==='Escape'){event.preventDefault();this.back();return true;}
    return true; // the screen owns the keyboard while open
  }
}
