import penaLisa from '../data/collectibles/pena-lisa-pixellab.png?url';
import damas from '../data/collectibles/las-damas-de-la-montana.png?url';
import boda from '../data/collectibles/boda-en-transmilleno.png?url';
import dosPorUno from '../data/collectibles/el-2x1.png?url';
import toreto from '../data/collectibles/toreto.png?url';
import tapabocas from '../data/collectibles/tapabocas.png?url';
import semaforo from '../data/collectibles/semaforo.png?url';
import {COLLECTIBLE_CARDS,MONSERRATE_CARD,loadCards,unlockCard} from '../game/Collectibles.js';

const ARTWORK={'el-perdido-de-la-pena-lisa':penaLisa,'las-damas-de-la-montana':damas,
  'boda-en-transmilleno':boda,'el-2x1':dosPorUno,toreto,tapabocas,semaforo};

export class CollectibleCards{
  constructor({key,onOpen=()=>{}}={}){
    this.key=key;this.onOpen=onOpen;
    this.dialog=document.createElement('dialog');this.dialog.className='collectible-modal';
    this.dialog.setAttribute('aria-labelledby','collectible-heading');
    this.dialog.setAttribute('aria-describedby','collectible-description');
    this.dialog.innerHTML=`<div class="collectible-content">
      <p class="eyebrow">BOGOTROPELES · ARCHIVO DE LA CIUDAD</p>
      <h2 id="collectible-heading">TU COLECCIÓN</h2>
      <div class="collectible-progress" aria-live="polite"></div>
      <div class="collectible-grid" role="group" aria-label="Matriz de tarjetas coleccionables"></div>
      <section class="collectible-detail" hidden>
        <button type="button" class="collectible-back">← TODAS LAS TARJETAS</button>
        <article class="collectible-card">
          <img class="collectible-photo" alt="" />
          <div class="collectible-top"><span class="collectible-code"></span><span class="collectible-zone"></span></div>
          <span class="collectible-seal"></span>
          <div class="collectible-bottom"><h3></h3><div class="collectible-value"></div></div>
          <span class="collectible-lock" aria-hidden="true">?</span>
        </article>
      </section>
      <p id="collectible-description"></p>
      <button class="collectible-close" type="button"></button>
      <small class="collectible-save-note"></small>
    </div>`;
    this.grid=this.dialog.querySelector('.collectible-grid');this.detail=this.dialog.querySelector('.collectible-detail');
    this.button=this.dialog.querySelector('.collectible-close');this.button.addEventListener('click',()=>this.dialog.close());
    this.dialog.querySelector('.collectible-back').addEventListener('click',()=>{
      const id=this.selectedId;this.showCollection();this.grid.querySelector(`[data-card="${id}"]`)?.focus();
    });
    this.dialog.addEventListener('keydown',event=>event.stopPropagation());
    this.dialog.addEventListener('keyup',event=>event.stopPropagation());
    this.dialog.addEventListener('close',()=>{
      const callback=this.afterClose;this.afterClose=null;
      if(callback)callback();else this.returnFocus?.focus({preventScroll:true});
    });
    document.body.append(this.dialog);
  }
  get isOpen(){return this.dialog.open;}
  open({reward=false,cardId=MONSERRATE_CARD.id,onClose}={}){
    if(this.isOpen)return;
    this.cards=reward?unlockCard(cardId,undefined,this.key):loadCards(undefined,this.key);
    this.reward=reward;this.returnFocus=document.activeElement;this.afterClose=onClose;
    this.dialog.querySelector('.collectible-progress').textContent=`${this.cards.length} / ${COLLECTIBLE_CARDS.length} TARJETAS DESBLOQUEADAS`;
    this.dialog.querySelector('.collectible-save-note').textContent=this.saveNote?.()??'Colección guardada en este navegador.';
    this.button.textContent=reward?'CONTINUAR':'VOLVER';
    if(reward)this.showCard(cardId);else this.showCollection();
    this.onOpen();this.dialog.showModal();(reward?this.button:this.grid.querySelector('button'))?.focus();
  }
  showCollection(){
    this.dialog.dataset.view='collection';this.dialog.removeAttribute('data-locked');
    this.detail.hidden=true;this.grid.hidden=false;
    this.dialog.querySelector('h2').textContent='TU COLECCIÓN';
    this.dialog.querySelector('#collectible-description').textContent='Recuerdos de Bogotá. Completa cada reto para revelar su tarjeta. Las seis nuevas permiten recibir daño: el reto es no perder vidas.';
    this.grid.replaceChildren(...COLLECTIBLE_CARDS.map(card=>{
      const unlocked=this.cards.some(saved=>saved.id===card.id);
      const tile=document.createElement('button');tile.type='button';tile.className='collection-tile';
      tile.dataset.card=card.id;tile.dataset.locked=String(!unlocked);
      tile.setAttribute('aria-label',`${card.name}. ${unlocked?'Desbloqueada':`Bloqueada. ${card.requirement}`}`);
      tile.innerHTML=`<span class="collection-tile-art"></span><span class="collection-tile-number">${card.number} / ${card.code}</span>
        <span class="collection-tile-state">${unlocked?'CONSEGUIDA':'BLOQUEADA'}</span>
        <strong>${card.name}</strong><span class="collection-tile-rule">${card.requirement}</span>`;
      const art=tile.querySelector('.collection-tile-art');
      if(unlocked){const img=document.createElement('img');img.src=ARTWORK[card.id];img.alt='';img.loading='lazy';art.append(img);}else art.textContent='?';
      tile.addEventListener('click',()=>{this.showCard(card.id);this.dialog.querySelector('.collectible-back').focus();});
      return tile;
    }));
  }
  showCard(id){
    const card=COLLECTIBLE_CARDS.find(item=>item.id===id);if(!card)return;
    const unlocked=this.cards.some(saved=>saved.id===id);this.selectedId=id;
    this.dialog.dataset.view='detail';this.dialog.dataset.locked=String(!unlocked);
    this.grid.hidden=true;this.detail.hidden=false;
    this.dialog.querySelector('h2').textContent=this.reward?'¡TARJETA DESBLOQUEADA!':card.name;
    this.dialog.querySelector('.collectible-back').hidden=this.reward;
    this.dialog.querySelector('article').setAttribute('aria-label',`Tarjeta ${card.name}`);
    const img=this.dialog.querySelector('.collectible-photo');img.hidden=!unlocked;
    if(unlocked){img.src=ARTWORK[id];img.alt=`Ilustración pixel art de ${card.name}`;}else{img.removeAttribute('src');img.alt='';}
    this.dialog.querySelector('.collectible-code').textContent=`${card.code} / ${card.number}`;
    this.dialog.querySelector('.collectible-zone').textContent=card.zone;
    this.dialog.querySelector('.collectible-seal').textContent=unlocked?card.seal:'POR DESBLOQUEAR';
    this.dialog.querySelector('h3').textContent=card.name;
    const value=this.dialog.querySelector('.collectible-value');value.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=card.points?`+${card.points}`:unlocked?'✓':'?';value.append(strong);
    const label=document.createElement('span');label.textContent=card.points?'PUNTOS DE REGALO':unlocked?'CONSEGUIDA':'BLOQUEADA';value.append(label);
    this.dialog.querySelector('.collectible-lock').hidden=unlocked;
    this.dialog.querySelector('#collectible-description').textContent=this.reward
      ?id===MONSERRATE_CARD.id?'Completaste Monserrate sin recibir golpes. ¡Sumaste 5000 puntos extra!':`¡Reto completado! ${card.requirement} La tarjeta ya forma parte de tu colección.`
      :`${unlocked?'Conseguida. ':''}${card.requirement}`;
  }
}
