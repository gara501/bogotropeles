// Gamepad support (standard mapping: Xbox / PlayStation / Switch Pro via the browser Gamepad API).
// In play, the pad presses the same actions as the touch buttons (it feeds game.touchControls.input), so combat,
// cycling, Monserrate and the aura duel all work without changes. In menus, intros and modals it sends the
// keyboard events those screens already handle (arrows, Enter, Escape) and clicks the focused button.
export const PAD={deadZone:.28,repeatDelay:380,repeatEvery:150,
  // button index → actions in play. A jumps and also confirms (ENTER after a win).
  game:{0:['SPACE','ENTER'],1:['K'],2:['H'],3:['J'],4:['U'],5:['SHIFT'],6:['L'],7:['Q'],9:['P']},
  dpad:{12:'up',13:'down',14:'left',15:'right'},
  menu:{0:'Enter',9:'Enter',1:'Escape',3:'d'}};
const KEYS={d:68,Enter:13,Escape:27,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40};
/** Stick plus d-pad as a direction; the d-pad wins. */
export function padDirection(pad,dead=PAD.deadZone){
  const pressed=i=>Boolean(pad.buttons?.[i]?.pressed);
  let x=Math.abs(pad.axes?.[0]??0)>dead?pad.axes[0]:0,y=Math.abs(pad.axes?.[1]??0)>dead?pad.axes[1]:0;
  if(pressed(14))x=-1;if(pressed(15))x=1;if(pressed(12))y=-1;if(pressed(13))y=1;
  return {x,y};
}
/** Dominant direction as an arrow key name, or null. */
export function arrowFor({x,y}){if(!x && !y)return null;return Math.abs(x)>=Math.abs(y)?(x>0?'ArrowRight':'ArrowLeft'):(y>0?'ArrowDown':'ArrowUp');}
export function sendKey(key,target=document.activeElement||document.body){
  for(const type of ['keydown','keyup']){
    const event=new KeyboardEvent(type,{key,code:key,bubbles:true,cancelable:true});
    Object.defineProperty(event,'keyCode',{get:()=>KEYS[key]??0});Object.defineProperty(event,'which',{get:()=>KEYS[key]??0});
    target.dispatchEvent(event);
  }
}
export class GamepadBridge {
  constructor(game,{menuActive=()=>false}={}){
    this.game=game;this.menuActive=menuActive;this.prev=new Map();this.driving=false;this.arrow=null;this.arrowAt=0;this.held=new Set();
    if(typeof navigator==='undefined' || !navigator.getGamepads || typeof requestAnimationFrame==='undefined')return;
    const loop=()=>{this.poll(performance.now());this.raf=requestAnimationFrame(loop);};this.raf=requestAnimationFrame(loop);
  }
  get input(){return this.game.touchControls?.input;}
  pad(){return [...(navigator.getGamepads?.()??[])].find(pad=>pad?.connected)??null;}
  poll(now){
    const pad=this.pad();if(!pad){if(this.held.size || this.driving)this.release();return;}
    const menu=this.menuActive();
    if(menu && (this.held.size || this.driving))this.release();
    pad.buttons.forEach((button,i)=>{
      const down=Boolean(button?.pressed),was=this.prev.get(i)??false;if(down===was)return;this.prev.set(i,down);
      if(menu){if(down)this.menuButton(i);}else this.gameButton(i,down);
    });
    const direction=padDirection(pad);
    if(menu)this.menuDirection(direction,now);
    else if(this.input){
      if(direction.x || direction.y){this.input.x=direction.x;this.input.y=direction.y;this.driving=true;}
      else if(this.driving){this.input.x=0;this.input.y=0;this.driving=false;}
    }
  }
  gameButton(i,down){
    const input=this.input;if(!input)return;
    for(const action of PAD.game[i]??[]){
      const pointer=`pad-${i}-${action}`;
      if(down){input.down(action,pointer);this.held.add(pointer);}else{input.up(pointer);this.held.delete(pointer);}
    }
  }
  menuButton(i){
    const key=PAD.menu[i];if(!key)return;
    const active=document.activeElement;
    if(key==='Enter' && active?.tagName==='BUTTON' && !active.disabled && !active.closest?.('#selection')){active.click();return;}
    sendKey(key);
  }
  menuDirection(direction,now){
    const arrow=arrowFor(direction);
    if(arrow!==this.arrow){this.arrow=arrow;this.arrowAt=now+PAD.repeatDelay;if(arrow)this.menuArrow(arrow);return;}
    if(arrow && now>=this.arrowAt){this.arrowAt=now+PAD.repeatEvery;this.menuArrow(arrow);}
  }
  /** Inside a dialog the arrows move the focus between its buttons; elsewhere they are sent as keys. */
  menuArrow(arrow){
    const dialog=document.activeElement?.closest?.('[role=dialog], #result-modal, .modal');
    if(dialog){
      const buttons=[...dialog.querySelectorAll('button')].filter(b=>!b.hidden && !b.disabled && b.offsetParent!==null);
      const index=buttons.indexOf(document.activeElement),step=arrow==='ArrowRight' || arrow==='ArrowDown'?1:-1;
      if(buttons.length){buttons[(index+step+buttons.length)%buttons.length].focus();return;}
    }
    sendKey(arrow);
  }
  release(){
    for(const pointer of this.held)this.input?.up(pointer,true);this.held.clear();
    if(this.driving && this.input){this.input.x=0;this.input.y=0;}this.driving=false;
  }
  destroy(){if(this.raf)cancelAnimationFrame(this.raf);this.release();}
}
