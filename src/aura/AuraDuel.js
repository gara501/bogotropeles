// Aura battle rules ("Simón dice"). Each round the rival shows a sequence of emotes, two inputs per emote;
// the player repeats it before the timer runs out. A clean sequence fills the aura bar and the player performs
// the emotes; a wrong key or a timeout drains it and the rival replays the sequence correctly for the crowd.
// Full bar: level won. Empty bar: the stage takes a life and calls refill().
// Time belongs to the simulation (step), so pause freezes every phase.
export const AURA_INPUTS={UP:'↑',DOWN:'↓',LEFT:'←',RIGHT:'→',PUNCH:'H',KICK:'J'};
export const AURA_SEQUENCES={
  'six-seven':['UP','DOWN'],
  'boat-paddle-dance':['LEFT','RIGHT'],
  'mewing':['DOWN','PUNCH'],
  'chen-chupas':['RIGHT','KICK'],
  'sigma-finish':['PUNCH','KICK'],
};
export const AURA_MOVE_IDS=Object.keys(AURA_SEQUENCES);
export const AURA_RULES={
  start:40,goal:100,gain:20,loss:25,
  moves:[2,2,3,3,4],          // emotes per round (the last value repeats)
  intro:1800,                 // "el gordo te reta" before the first demo
  demoStep:560,demoTail:450,  // rival shows one input every demoStep
  inputBase:1400,inputPerKey:850,
  performStep:700,            // player performs each emote after a clean sequence
  replayStep:430,replayTail:500,
  emptiedMs:1800,wonMs:2600,
};

export class AuraDuel{
  constructor({random=Math.random,rules=AURA_RULES}={}){
    this.random=random;this.rules=rules;this.meter=rules.start;this.round=-1;this.phase='waiting';
    this.time=0;this.moves=[];this.sequence=[];this.progress=0;this.events=[];this.failure=null;
  }
  get started(){return this.phase!=='waiting';}
  get won(){return this.phase==='won';}
  get inputLimit(){return this.rules.inputBase+this.sequence.length*this.rules.inputPerKey;}
  get inputLeft(){return this.phase==='input'?Math.max(0,this.inputLimit-this.time):0;}
  /** Index of the input the rival is showing (demo/replay) or -1. */
  get showing(){
    const r=this.rules;
    if(this.phase==='demo')return this.time<r.demoStep*this.sequence.length?Math.floor(this.time/r.demoStep):-1;
    if(this.phase==='replay')return this.time<r.replayStep*this.sequence.length?Math.floor(this.time/r.replayStep):-1;
    return -1;
  }
  /** Emote (index in this.moves) that the input `i` belongs to. */
  moveOf(i){return Math.floor(i/2);}
  phaseLength(){
    const r=this.rules,n=this.sequence.length;
    return {intro:r.intro,demo:n*r.demoStep+r.demoTail,input:this.inputLimit,perform:this.moves.length*r.performStep,
      replay:n*r.replayStep+r.replayTail,emptied:r.emptiedMs}[this.phase]??Infinity;
  }
  start(){if(this.phase!=='waiting')return false;this.go('intro');return true;}
  go(phase){this.phase=phase;this.time=0;this.events.push({type:phase,round:this.round});}
  nextRound(){
    const r=this.rules;this.round++;
    const count=r.moves[Math.min(this.round,r.moves.length-1)];
    this.moves=[];
    const n=AURA_MOVE_IDS.length;
    while(this.moves.length<count){
      let index=Math.min(n-1,Math.floor(this.random()*n));
      if(AURA_MOVE_IDS[index]===this.moves.at(-1))index=(index+1)%n; // never the same emote twice in a row
      this.moves.push(AURA_MOVE_IDS[index]);
    }
    this.sequence=this.moves.flatMap(move=>AURA_SEQUENCES[move]);this.progress=0;this.failure=null;
    this.go('demo');
  }
  /** One player input. Returns 'ok', 'move' (an emote completed), 'clean' (whole sequence), 'fail' or null (ignored). */
  press(input){
    if(this.phase!=='input' || !(input in AURA_INPUTS))return null;
    if(input!==this.sequence[this.progress]){this.fail('wrong',input);return 'fail';}
    this.progress++;
    if(this.progress===this.sequence.length){this.succeed();return 'clean';}
    return this.progress%2===0?'move':'ok';
  }
  succeed(){
    this.meter=Math.min(this.rules.goal,this.meter+this.rules.gain);
    this.events.push({type:'success',round:this.round,meter:this.meter});this.go('perform');
  }
  fail(reason,input=null){
    this.failure={reason,at:this.progress,input};
    this.meter=Math.max(0,this.meter-this.rules.loss);
    this.events.push({type:'fail',reason,round:this.round,meter:this.meter});this.go('replay');
  }
  /** After the stage took a life (or in the exhibition): back to the starting aura with a fresh round. */
  refill(){if(this.phase!=='emptied')return false;this.meter=this.rules.start;this.nextRound();return true;}
  /** Advances at most one phase per call (the stage steps every frame). */
  step(ms){
    if(this.phase==='waiting' || this.phase==='won')return;
    const before=this.time;this.time+=Math.max(0,ms);
    if(this.phase==='emptied'){ // the stage decides what follows (life, continue, game over)
      if(before<this.rules.emptiedMs && this.time>=this.rules.emptiedMs)this.events.push({type:'emptied-ready',round:this.round});
      return;
    }
    if(this.time<this.phaseLength())return;
    if(this.phase==='intro')this.nextRound();
    else if(this.phase==='demo')this.go('input');
    else if(this.phase==='input')this.fail('time');
    else if(this.phase==='perform'){if(this.meter>=this.rules.goal)this.go('won');else this.nextRound();}
    else if(this.phase==='replay'){if(this.meter<=0)this.go('emptied');else this.nextRound();}
  }
  takeEvents(){const events=this.events;this.events=[];return events;}
}
