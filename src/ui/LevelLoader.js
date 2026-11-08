// Level loader: a TransMilenio bus drives along the route while the level downloads, then "parks" while the
// scene builds its sprite sheets. It only appears when loading takes longer than a blink (cached restarts stay instant).
export const LOADER_TIPS=[
  'Dash + patada (SHIFT y J) tumba a cualquiera que se te atraviese.',
  'Con la vuvuzela en la mano, J la suelta.',
  'En Monserrate el dash da el doble de puntos… si no te estrellas.',
  'El Gordo del Aura no perdona: mira bien la secuencia antes de tu turno.',
  'Las palomas de la Plaza de Bolívar pican. No te acerques mucho.',
  'Se dice que quien llega al final sin pedir continuación encuentra un ring secreto.',
  'En El Dorado los taxis no frenan. Tú sí.',
  'K gasta 10 de vida en el especial: úsalo cuando haya varios cerca.',
  '20 golpes sin recibir daño cargan el súper (Q).',
  'Al final de la partida escribe tu usuario y sube en el ranking de Bogotá.',
];
const STEPS=[[.3,'PAGANDO EL PASAJE'],[.6,'ESPERANDO EL BUS'],[.95,'BUSCANDO PUESTO'],[1.01,'LLEGANDO A LA ESTACIÓN']];
export const loaderStep=progress=>STEPS.find(([limit])=>progress<limit)?.[1]??STEPS.at(-1)[1];

export class LevelLoader{
  constructor(root,{delay=250,minVisible=500,now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),random=Math.random}={}){
    this.root=root;this.delay=delay;this.minVisible=minVisible;this.now=now;this.schedule=schedule;this.cancel=cancel;this.random=random;
    this.timer=null;this.shownAt=null;this.active=false;this.tip=-1;
    const q=sel=>root.querySelector(sel);
    this.el={eyebrow:q('#loader-eyebrow'),title:q('#loader-title'),road:q('.loader-road'),fill:q('.loader-fill'),bus:q('.loader-bus'),
      percent:q('#loader-percent'),step:q('#loader-step'),tip:q('#loader-tip'),portrait:q('.loader-portrait'),error:q('#loader-error')};
  }
  start({level=0,name='',bonus=false,portrait=null}={}){
    this.active=true;this.failed=[];
    this.el.eyebrow.textContent=bonus?'BONUS':`NIVEL ${String(level+1).padStart(2,'0')}`;
    this.el.title.textContent=String(name).toUpperCase();
    if(this.el.portrait){this.el.portrait.hidden=!portrait;if(portrait)this.el.portrait.src=portrait;}
    this.el.error.hidden=true;this.el.error.textContent='';
    this.tip=(this.tip+1+Math.floor(this.random()*(LOADER_TIPS.length-1)))%LOADER_TIPS.length;
    this.el.tip.textContent=LOADER_TIPS[this.tip];
    this.progress(0);
    this.cancel(this.timer);this.timer=this.schedule(()=>{if(this.active){this.root.hidden=false;this.shownAt=this.now();}},this.delay);
  }
  progress(value){
    const p=Math.max(0,Math.min(1,Number(value)||0)),pct=Math.round(p*100);
    this.el.fill.style.width=`${pct}%`;this.el.bus.style.left=`${pct}%`;
    this.el.road.setAttribute('aria-valuenow',String(pct));
    this.el.percent.textContent=`${pct}%`;this.el.step.textContent=loaderStep(p);
    this.root.classList.toggle('is-parked',p>=1);
  }
  fail(file){
    this.failed.push(file?.key??'archivo');
    this.el.error.hidden=false;
    this.el.error.textContent=`No cargó: ${this.failed.slice(-3).join(', ')}. Revisa tu conexión; si el nivel no arranca, recarga la página.`;
  }
  finish(){
    if(!this.active)return;
    this.active=false;this.cancel(this.timer);this.timer=null;
    if(this.root.hidden)return;
    const wait=Math.max(0,this.minVisible-(this.now()-(this.shownAt??0)));
    this.schedule(()=>{if(!this.active)this.root.hidden=true;},wait);
  }
}
