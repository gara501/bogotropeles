import {ARCADE} from '../data/arcade.js';
export class InputBuffer {
  constructor(frames=ARCADE.input.bufferFrames){this.frames=frames;this.entries=[];}
  push(action,frame){this.entries.push({action,expires:frame+this.frames});}
  expire(frame){this.entries=this.entries.filter(entry=>frame<entry.expires);}
  consume(action,frame){this.expire(frame);const i=this.entries.findIndex(entry=>entry.action===action);if(i<0)return false;this.entries.splice(i,1);return true;}
  clear(){this.entries=[];}
}
