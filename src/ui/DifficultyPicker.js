import {DIFFICULTIES,difficultyFor,saveDifficulty} from '../data/difficulty.js';

/** DIFICULTAD row on the character selection: FÁCIL / NORMAL / HORA PICO. D (or Y on a gamepad) cycles it. */
export class DifficultyPicker {
  constructor({run,storage,anchor,onChange=()=>{}}){
    this.run=run;this.storage=storage;this.onChange=onChange;
    this.root=document.createElement('div');this.root.className='palette-picker difficulty-picker';this.root.setAttribute('role','group');this.root.setAttribute('aria-label','Dificultad');
    const label=document.createElement('span');label.className='palette-label';label.textContent='DIFICULTAD · D';this.root.append(label);
    this.buttons=DIFFICULTIES.map(d=>{
      const button=document.createElement('button');button.type='button';button.dataset.difficulty=d.id;button.textContent=d.name;button.title=d.note;
      button.addEventListener('click',()=>this.select(d.id));this.root.append(button);return button;
    });
    this.note=document.createElement('small');this.note.className='difficulty-note';this.root.append(this.note);
    anchor?.after(this.root);this.refresh();
  }
  select(id){this.run.setDifficulty(id);saveDifficulty(this.run.difficulty,this.storage);this.refresh();this.onChange(this.run.difficulty);}
  cycle(direction=1){const i=DIFFICULTIES.findIndex(d=>d.id===this.run.difficulty);this.select(DIFFICULTIES[(i+direction+DIFFICULTIES.length)%DIFFICULTIES.length].id);}
  refresh(){
    const current=difficultyFor(this.run.difficulty);
    for(const button of this.buttons)button.setAttribute('aria-pressed',String(button.dataset.difficulty===current.id));
    this.note.textContent=current.note;
  }
  /** Only before a run starts: changing mid-run would rewrite the ladder under the player's feet. */
  setLocked(locked){this.root.hidden=locked;}
}
