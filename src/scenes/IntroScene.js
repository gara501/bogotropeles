import Phaser from 'phaser';
import introJuegoUrl from './intro_juego.png?url';
import introBossUrl from './intro_boss.png?url';
import storyUrl from './intro_1.png?url';
import { levels } from '../data/levels.js';
import {fitArcadeCamera,fitArcadeText} from '../data/arcade.js';

export class IntroScene extends Phaser.Scene {
  constructor(){super('Intro');}
  init(data={}){this.kind=data.kind??'game';this.nextData={...data,kind:this.kind};this.done=false;}
  preload() {
    if(!this.textures.exists('intro-game'))this.load.image('intro-game',introJuegoUrl);
    if(!this.textures.exists('intro-boss'))this.load.image('intro-boss',introBossUrl);
    if(!this.textures.exists('intro-story'))this.load.image('intro-story',storyUrl);
    if(this.kind==='level') {
      const level=levels[this.nextData.level];
      if(!this.textures.exists(level.key))this.load.image(level.key,level.url);
    }
  }
  create() {
    fitArcadeCamera(this);
    const level=levels[this.nextData.level??0],isLevel=this.kind==='level';
    const texture=isLevel?level.key:this.kind==='boss'?'intro-boss':this.kind==='story'?'intro-story':'intro-game';
    this.cameras.main.setBackgroundColor('#05080a');
    const bg=this.add.image(480,270,texture),scale=Math.max(960/bg.width,540/bg.height);
    bg.setScale(scale).setAlpha(0);
    this.tweens.add({targets:bg,alpha:1,duration:450});
    const style={fontFamily:'monospace',color:'#e8edce',align:'center',stroke:'#05080a',strokeThickness:5};
    if(isLevel) {
      this.add.rectangle(480,270,960,540,0x05080a,.6);
      this.add.text(480,210,`NIVEL ${this.nextData.level+1} / 6`,{...style,fontSize:'20px',color:'#d6ed64'}).setOrigin(.5);
      this.add.text(480,260,level.name.toUpperCase(),{...style,fontSize:'32px',fontStyle:'bold'}).setOrigin(.5);
    }
    if(this.kind==='story') {
      this.add.rectangle(480,432,960,216,0x05080a,.75);
      ['Debes sobrevivir en las tumultuosas calles de Bogotá.',
        'Serás objetivo de la fauna más variopinta',
        'que habita en esta caótica urbe.',
        '¿Tienes lo que se necesita para salir con vida?'].forEach((line,i)=>{
          this.add.text(480,342+i*36,line,{...style,fontSize:'20px',color:i===3?'#d6ed64':'#e8edce'}).setOrigin(.5);
        });
    } else this.add.rectangle(480,490,960,100,0x05080a,.8);
    const caption=isLevel?(level.mode==='crossing'?'DERROTA A LOS PEATONES · ESQUIVA LAS MOTOS':`${level.total} ENEMIGOS · OLEADAS DE DOS Y TRES`)
      :this.kind==='boss'?'DORMILÓN · EL ÚLTIMO TRÁMITE DE LA NOCHE':'SEIS CUADRAS. CINCO FORMAS DE DAR PELEA.';
    if(this.kind!=='story')this.add.text(480,467,caption,{...style,fontSize:'16px'}).setOrigin(.5);
    const prompt=this.add.text(480,510,'',{...style,fontSize:'12px',color:'#d6ed64'}).setOrigin(.5);
    if(this.children)for(const object of this.children.list)if(object.type==='Text')fitArcadeText(object);
    this.skip=(event)=>{
      if(this.done)return;this.done=true;
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      const data=this.nextData;
      // Finish the current input dispatch before enabling the selection screen.
      // The same Enter press must not also select a character or restart Intro.
      // A queued ScenePlugin stop would close the next Intro instance.
      queueMicrotask(()=>{this.game.scene.stop('Intro');this.game.events.emit('intro-complete',data);});
    };
    this.time.delayedCall(isLevel?900:1500,()=>{
      prompt.setText(this.game.touchControls?.mobile?.()?'TOCA LA PANTALLA PARA CONTINUAR →':'PRESIONA UNA TECLA O CLIC PARA CONTINUAR →');
      this.input.keyboard.on('keydown',this.skip);this.input.on('pointerdown',this.skip);
    });
    this.events.once('shutdown',()=>{
      this.input.keyboard.off('keydown',this.skip);this.input.off('pointerdown',this.skip);
    });
  }
}
