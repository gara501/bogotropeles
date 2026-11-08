// Main menu (Streets of Rage 4 style): a dark column of options over the cover art. Keyboard and gamepad:
// ↑ ↓ move, ← → change a value, ENTER/A choose, ESC/B back (closes a submenu). Built from `items` supplied by main.js:
// {id, label, action?, value?:()=>string, change?:(dir)=>void, hint?:()=>string, disabled?:()=>bool, big?:bool}.
export class MainMenu {
  constructor({root,art,items,onBack=()=>{}}){
    this.root=root;this.items=items;this.onBack=onBack;this.index=0;this.sub=null;
    root.classList.add('main-menu');root.style.setProperty('--menu-art',`url(${art})`);
    root.innerHTML=`<div class="menu-column"><ul class="menu-list" role="menu"></ul>
      <p class="menu-hint" aria-live="polite"></p><footer class="menu-foot"><span><kbd>Ⓐ</kbd> ENTER · ELEGIR</span><span><kbd>Ⓑ</kbd> ESC · VOLVER</span></footer></div>`;
    this.list=root.querySelector('.menu-list');this.hint=root.querySelector('.menu-hint');
    root.addEventListener('click',event=>{
      const li=event.target.closest('[data-index]');if(!li)return;
      const arrow=event.target.closest('[data-dir]');this.index=Number(li.dataset.index);
      if(arrow)this.change(Number(arrow.dataset.dir));else this.choose();
    });
    root.addEventListener('mousemove',event=>{const li=event.target.closest('[data-index]');if(li && Number(li.dataset.index)!==this.index){this.index=Number(li.dataset.index);this.render();}});
  }
  get entries(){return this.sub?this.sub.items:this.items.filter(item=>!item.hidden?.());}
  open(){this.sub=null;this.index=Math.min(this.index,this.entries.length-1);this.root.hidden=false;this.render();this.root.querySelector('.menu-list').focus?.();}
  close(){this.root.hidden=true;}
  get isOpen(){return !this.root.hidden;}
  /** A list inside the menu (stage select). */
  openSub(title,items){this.sub={title,items,parentIndex:this.index};this.index=0;this.render();}
  closeSub(){if(!this.sub)return false;this.index=this.sub.parentIndex;this.sub=null;this.render();return true;}
  render(){
    const entries=this.entries;
    this.list.replaceChildren(...(this.sub?[Object.assign(document.createElement('li'),{className:'menu-subtitle',textContent:this.sub.title})]:[]),
      ...entries.map((item,i)=>{
        const li=document.createElement('li');li.dataset.index=i;li.setAttribute('role','menuitem');
        li.className=`menu-item${i===this.index?' active':''}${item.big?' big':''}${item.disabled?.()?' disabled':''}`;
        li.append(Object.assign(document.createElement('span'),{className:'menu-label',textContent:item.label}));
        if(item.value){
          const value=document.createElement('span');value.className='menu-value';
          value.append(Object.assign(document.createElement('b'),{textContent:'◀'}),item.value(),Object.assign(document.createElement('b'),{textContent:'▶'}));
          value.children[0].dataset.dir='-1';value.lastChild.dataset.dir='1';li.append(value);
        }
        return li;
      }));
    const item=entries[this.index];this.hint.textContent=item?.hint?.()??'';
  }
  move(step){const n=this.entries.length;if(!n)return;this.index=(this.index+step+n)%n;this.render();}
  change(dir){const item=this.entries[this.index];if(item?.change && !item.disabled?.()){item.change(dir);this.render();}}
  choose(){const item=this.entries[this.index];if(!item || item.disabled?.())return;if(item.action)item.action();else if(item.change)this.change(1);}
  /** Returns true when the key was handled. */
  handleKey(event){
    if(!this.isOpen)return false;
    const key=event.key;
    if(key==='ArrowDown'||key==='ArrowUp'){event.preventDefault();this.move(key==='ArrowDown'?1:-1);return 'move';}
    if(key==='ArrowLeft'||key==='ArrowRight'){event.preventDefault();this.change(key==='ArrowRight'?1:-1);return 'change';}
    if(key==='Enter'||key===' '){event.preventDefault();if(!event.repeat)this.choose();return 'choose';}
    if(key==='Escape'||key==='Backspace'){event.preventDefault();if(!this.closeSub())this.onBack();return 'back';}
    return false;
  }
}
