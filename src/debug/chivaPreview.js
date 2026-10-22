/** Opt-in QA controls; never imported by the production build. */
export function installChivaPreview(game){
  const panel=document.createElement('div');panel.id='chiva-preview';
  panel.style.cssText='position:fixed;right:12px;top:75px;z-index:10;display:flex;flex-wrap:wrap;gap:6px;max-width:290px;padding:8px;background:#142127ee';
  const add=(label,action)=>{
    const button=document.createElement('button');button.textContent=label;
    button.onclick=()=>{const s=game.scene.getScene('Street');if(s.chivaBonus)action(s);};panel.append(button);
  };
  add('Golpear chiva (QA)',s=>s.chivaBonus.hit(s.chivaBonus.target));
  add('Destruir chiva (QA)',s=>{for(let i=0;i<50;i++)s.chivaBonus.hit(s.chivaBonus.target);});
  add('Agotar tiempo (QA)',s=>s.chivaBonus.round.step(30000));
  add('Pausar / continuar (QA)',s=>s.arcade.capture({dx:0,dy:0,actions:[],pause:true}));
  add('Ocultar pruebas',()=>panel.remove());
  document.body.append(panel);
}
