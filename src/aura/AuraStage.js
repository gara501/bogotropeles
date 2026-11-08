import Phaser from 'phaser';
import {AURA_MOVES,AURA_NPCS,preloadAura} from '../data/aura.js';
import {AuraDuel,AURA_INPUTS,AURA_RULES} from './AuraDuel.js';
import {fitArcadeCamera,applyPixelFilter} from '../data/arcade.js';
import {characters} from '../data/characters.js';
import {levels} from '../data/levels.js';
import {LevelMusic} from '../audio/LevelMusic.js';
import {SoundEffects} from '../audio/SoundEffects.js';
import {AURA_PLAYER_ART,AURA_WALK_ART,AURA_SETTLE_MS,AURA_RIVAL_ART,AURA_CROWD_ART} from './spriteLayout.js';

// Gran Estación aura battle: walk through the noisy crowd to the circle, the rival shows a sequence of emotes,
// the player repeats it. Campaign level: an empty aura bar costs a life, a full one clears the level.
// The exhibition (selection screen toggle) never touches lives or score.
const FLOOR_Y=460,START_X=95,PLAYER_X=300,RIVAL_X=660,CIRCLE_TRIGGER=PLAYER_X,FIGHTER_HEIGHT=184,WALK_SPEED=150;
const MOVE_LABEL=Object.fromEntries(AURA_MOVES.map(m=>[m.id,m.label]));
const INPUT_ORDER=['UP','DOWN','LEFT','RIGHT','PUNCH','KICK'];
// keydown events (not JustDown polling): a quick tap shorter than one frame still counts
const CODE_FOR={ArrowUp:'UP',KeyW:'UP',ArrowDown:'DOWN',KeyS:'DOWN',ArrowLeft:'LEFT',KeyA:'LEFT',ArrowRight:'RIGHT',KeyD:'RIGHT',KeyH:'PUNCH',KeyJ:'KICK'};
const SHOUTS=['¡UUUH!','¡AURA!','¡SIX SEVEN!','¡DALE!','¡QUÉ AURA!','¡PELEA, PELEA!','¡MEWING!','¡JAJAJA!'];
const CHEER_PLAYER=['¡ESOOO!','¡QUÉ AURA!','¡LO MATÓ!','¡+AURA!'];
const CHEER_RIVAL=['¡GORDOOO!','¡ASÍ ES!','¡JAJAJA!','¡SIN AURA!'];
const COLORS={pending:0x273744,shown:0xffe189,done:0xd6ed64,wrong:0xe8231d,next:0x3b4f5e};

export class AuraStage{
  constructor(scene){
    this.scene=scene;this.duel=new AuraDuel();this.phase='walk';this.clock=0;this.lastMoveAt=-Infinity;this.lastMove=null;
    this.nextShout=600;this.bubbles=[];this.typed=[];this.stick={x:0,y:0};this.resultAt=null;
  }
  get exhibition(){return Boolean(this.scene.isAuraExhibition);}
  create(){
    const s=this.scene;fitArcadeCamera(s);applyPixelFilter(s);
    s.arcade=null;s.hud=null;s.enemies=[];s.playerAttack=null;s.health=100;s.finished=false;
    s.add.image(0,0,'aura-background').setOrigin(0).setDisplaySize(960,540).setDepth(-10);
    // the circle the crowd leaves open for the battle
    s.add.ellipse(480,FLOOR_Y+2,470,72).setStrokeStyle(3,0xffe189,.55).setDepth(439);
    this.crowd=AURA_NPCS.map(n=>({...n,sprite:s.add.image(n.x,n.y,'aura-crowd',n.frame).setOrigin(.5,AURA_CROWD_ART.baseline/AURA_CROWD_ART.frameHeight).setScale(n.height/AURA_CROWD_ART.referenceHeight).setDepth(n.y)}));
    this.playerShadow=s.add.ellipse(START_X,FLOOR_Y-1,100,13,0x342e40,.2).setDepth(440);
    s.add.ellipse(RIVAL_X,FLOOR_Y-1,108,14,0x342e40,.2).setDepth(440);
    // Entrance and emotes are one authored family. Switching pose never swaps body identity.
    const walk=s.textures.exists(`aura-${s.characterKey}-walk`);
    this.walker=walk?s.add.sprite(START_X,FLOOR_Y,`aura-${s.characterKey}-idle`,0).setOrigin(.5,AURA_PLAYER_ART.baseline/AURA_PLAYER_ART.frameHeight).setScale(FIGHTER_HEIGHT/AURA_PLAYER_ART.referenceHeight).setDepth(460):null;
    s.player={x:walk?START_X:PLAYER_X,y:FLOOR_Y,key:s.characterKey,config:s.character,
      sprite:s.add.image(PLAYER_X,FLOOR_Y,`aura-${s.characterKey}-idle`,0).setOrigin(.5,AURA_PLAYER_ART.baseline/AURA_PLAYER_ART.frameHeight).setScale(FIGHTER_HEIGHT/AURA_PLAYER_ART.referenceHeight).setDepth(460).setVisible(!walk)};
    this.rival=s.add.image(RIVAL_X,FLOOR_Y,'aura-gordo-idle',0).setOrigin(.5,AURA_RIVAL_ART.baseline/AURA_RIVAL_ART.frameHeight).setScale(190/AURA_RIVAL_ART.referenceHeight).setFlipX(true).setDepth(461);
    const text=(x,y,value,size=14,color='#fff3d8')=>s.add.text(x,y,value,{fontFamily:"'IBM Plex Mono',monospace",fontSize:`${size}px`,color,stroke:'#14101c',strokeThickness:3}).setDepth(1002);
    // top bar: title, fighters, lives · aura bar and round
    s.add.rectangle(0,0,960,64,0x14101c,.93).setOrigin(0).setDepth(1000);
    text(22,8,'GRAN ESTACIÓN / BATALLA DE AURA',18,'#ffe189');
    this.names=text(22,36,'',12);
    text(600,10,'AURA',14,'#d6ed64');
    s.add.rectangle(654,12,280,16,0x0b1430).setOrigin(0).setStrokeStyle(2,0xffffff).setDepth(1001);
    this.meterFill=s.add.rectangle(656,14,0,12,0xd6ed64).setOrigin(0).setDepth(1002);
    this.meterGhost=s.add.rectangle(656,14,0,12,0xe8231d).setOrigin(0).setDepth(1001);
    this.roundLabel=text(934,36,'',12).setOrigin(1,0);
    this.exit=text(600,36,this.exhibition?'SALIR / ESC':'',11).setInteractive({useHandCursor:true});
    this.exit.on('pointerdown',()=>{if(this.exhibition)s.game.events.emit('aura-exit');});
    // sequence row, input timer and messages
    this.message=text(480,84,'',18,'#ffe189').setOrigin(.5);
    this.keyBoxes=[];this.keyTexts=[];this.moveTexts=[];
    for(let i=0;i<8;i++){
      this.keyBoxes.push(s.add.rectangle(0,128,38,38,COLORS.pending).setStrokeStyle(2,0x14101c).setDepth(1001).setVisible(false));
      this.keyTexts.push(text(0,128,'',20).setOrigin(.5).setVisible(false));
    }
    for(let i=0;i<4;i++)this.moveTexts.push(text(0,154,'',10,'#c9d2c4').setOrigin(.5).setVisible(false));
    this.timerBack=s.add.rectangle(480,174,320,6,0x14101c,.85).setDepth(1001).setVisible(false);
    this.timerFill=s.add.rectangle(320,174,320,6,0xffe189).setOrigin(0,.5).setDepth(1002).setVisible(false);
    this.rivalCue=text(RIVAL_X,FLOOR_Y-262,'',30,'#ffe189').setOrigin(.5).setVisible(false);
    // bottom bar: clickable inputs (touch and mouse), same order as the keyboard legend
    s.add.rectangle(0,494,960,46,0x14101c,.96).setOrigin(0).setDepth(1000);
    this.buttons=INPUT_ORDER.map((input,i)=>{
      const x=24+i*154,box=s.add.rectangle(x,500,146,34,0x273744).setOrigin(0).setDepth(1001).setInteractive({useHandCursor:true});
      box.on('pointerdown',()=>this.input(input));
      const label=input==='PUNCH'?'H · PUÑO':input==='KICK'?'J · PATADA':AURA_INPUTS[input];
      text(x+73,517,label,input.length>2 && !['PUNCH','KICK'].includes(input)?16:12).setOrigin(.5);
      return box;
    });
    // same shape as StreetScene's overlay: showOverlay(), endRun() and main.js result screens use it
    s.overlay=s.add.container(480,270,[
      s.add.rectangle(0,0,560,140,0x142127,.95),
      s.add.text(0,-16,'',{fontFamily:"'IBM Plex Mono',monospace",fontSize:'26px',color:'#d6ed64',align:'center'}).setOrigin(.5),
      s.add.text(0,30,'',{fontFamily:"'IBM Plex Mono',monospace",fontSize:'12px',color:'#e0e7d2',align:'center'}).setOrigin(.5),
    ]).setDepth(2000).setVisible(false);
    this.pause=text(480,270,'PAUSA · P PARA CONTINUAR',24,'#ffe189').setOrigin(.5).setVisible(false);
    this.retry=text(480,206,'',14,'#fff3d8').setOrigin(.5).setInteractive({useHandCursor:true});
    this.retry.on('pointerdown',()=>{if(this.exhibition && (this.duel.won || this.phase==='over'))s.restartLevel();});
    s.keys=s.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,H,J,P,R,ENTER,ESC');
    s.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT']);
    this.typed=[];s.input.keyboard.on('keydown',event=>{const name=CODE_FOR[event.code];if(name && !event.repeat)this.typed.push(name);});
    s.music=new LevelMusic(s,s.level.music.key);s.sfx=new SoundEffects(s.sound,s.cache.audio);
    s.game.touchControls?.setCycling(false);
    s.game.events.emit('level-start',s.levelIndex);
    s.events.once('shutdown',()=>{
      s.music?.destroy();s.music=null;s.sfx?.destroy();s.sfx=null;s.aura=null;
      s.game.events.emit('combat-paused',false);
    });
    if(!this.walker)this.beginDuel();
    this.render();
  }
  ensureCharacter(key,done){
    const s=this.scene;
    if(s.textures.exists(`aura-${key}-six-seven`))return done();
    preloadAura(s,key);s.load.once('complete',done);s.load.start();
  }
  setCharacter(key){
    const s=this.scene;s.characterKey=key;s.character=characters[key];s.player.key=key;s.player.config=s.character;
    // the new character's walking sheet may not be loaded: go straight to the circle
    if(this.walker){this.walker.destroy();this.walker=null;}
    if(this.phase==='walk')this.beginDuel();
    this.render();return true;
  }
  beginDuel(){
    const s=this.scene;if(this.phase!=='walk')return;
    this.phase='duel';s.player.x=PLAYER_X;this.walker?.setVisible(false);s.player.sprite.setVisible(true);
    this.settleUntil=this.clock+AURA_SETTLE_MS;
    this.duel.start();s.sfx?.play('whistle');this.shout(this.crowd[0],'¡ARRANCA LA BATALLA!');
  }
  /** Campaign continue after the last life (main.js calls StreetScene.continueRun). */
  continueRun(){
    const s=this.scene;if(!s.waitingContinue || s.gameOver || !s.run.continue())return false;
    s.waitingContinue=false;this.phase='duel';this.duel.refill();return true;
  }
  /** After winning, ENTER (or the result screen) moves on to the next campaign level. */
  confirm(){const s=this.scene;if(this.exhibition || !s.finished)return false;s.nextLevel();return true;}
  input(name){
    const s=this.scene;if(s.paused || this.phase!=='duel')return;
    const result=this.duel.press(name);if(!result)return;
    if(result==='move' || result==='clean'){this.lastMove=this.duel.moves[this.duel.moveOf(this.duel.progress-1)];this.lastMoveAt=this.clock;}
    s.sfx?.play(result==='fail'?'wave':result==='clean'?'item':'button');
  }
  pollInputs(){
    const s=this.scene,touch=s.game.touchControls?.input,typed=this.typed.splice(0);
    for(const name of typed)this.input(name);
    if(touch?.justDown('H'))this.input('PUNCH');
    if(touch?.justDown('J'))this.input('KICK');
    // joystick flicks count as arrows (edge-triggered)
    const x=touch?.x??0,y=touch?.y??0,was=this.stick;
    if(Math.abs(x)>.6 && Math.abs(was.x)<=.6)this.input(x>0?'RIGHT':'LEFT');
    if(Math.abs(y)>.6 && Math.abs(was.y)<=.6)this.input(y>0?'DOWN':'UP');
    this.stick={x,y};
  }
  walk(ms){
    const s=this.scene,k=s.keys,touch=s.game.touchControls?.input;
    const dx=Number(k.RIGHT.isDown||k.D.isDown)-Number(k.LEFT.isDown||k.A.isDown)||Math.sign(touch?.x??0);
    s.player.x=Phaser.Math.Clamp(s.player.x+dx*WALK_SPEED*ms/1000,20,PLAYER_X);
    if(dx){
      this.walker.setTexture(`aura-${s.characterKey}-walk`,Math.floor(this.clock/AURA_WALK_ART.stepMs)%AURA_WALK_ART.frames)
        .setOrigin(.5,AURA_WALK_ART.baseline/AURA_WALK_ART.frameHeight).setScale(FIGHTER_HEIGHT/AURA_WALK_ART.referenceHeight).setFlipX(dx<0);
    }else this.walker.setTexture(`aura-${s.characterKey}-idle`,0).setOrigin(.5,AURA_PLAYER_ART.baseline/AURA_PLAYER_ART.frameHeight).setScale(FIGHTER_HEIGHT/AURA_PLAYER_ART.referenceHeight);
    this.walker.x=s.player.x;
    if(s.player.x>=CIRCLE_TRIGGER)this.beginDuel();
  }
  handleEvents(){
    const s=this.scene;
    for(const event of this.duel.takeEvents()){
      if(event.type==='success'){this.cheer('player');if(!this.exhibition)s.run.award(200);}
      else if(event.type==='fail')this.rivalTurnStarted=this.clock;
      else if(event.type==='perform')this.cheer('player');
      else if(event.type==='won')this.win();
      else if(event.type==='emptied'){this.cheer('rival');s.sfx?.play('lose');}
      else if(event.type==='emptied-ready')this.emptied();
    }
  }
  emptied(){
    const s=this.scene;
    if(this.exhibition){this.duel.refill();return;}
    s.run.loseLife();
    if(s.run.lives>0){this.duel.refill();return;}
    this.phase='over';
    if(s.run.canContinue){s.waitingContinue=true;s.game.events.emit('continue-needed');}
    else s.endRun();
  }
  win(){
    const s=this.scene;this.cheer('player');s.sfx?.play('item');
    if(this.exhibition)return;
    s.run.award(1000);s.finished=true;s.game.events.emit('level-clear',s.levelIndex);s.game.events.emit('level-victory');
    this.resultAt=this.clock+AURA_RULES.wonMs;
  }
  cheer(side){
    const lines=side==='player'?CHEER_PLAYER:CHEER_RIVAL;this.cheerSide=side;this.cheerUntil=this.clock+1600;
    const near=[...this.crowd].sort((a,b)=>Math.abs(a.x-(side==='player'?PLAYER_X:RIVAL_X))-Math.abs(b.x-(side==='player'?PLAYER_X:RIVAL_X)));
    near.slice(0,2).forEach((npc,i)=>this.shout(npc,lines[(this.duel.round+i)%lines.length]));
  }
  shout(npc,line){
    const s=this.scene;if(!npc)return;
    const bubble=s.add.text(npc.x,npc.y-npc.height-12,line,{fontFamily:"'IBM Plex Mono',monospace",fontSize:'11px',color:'#14101c',backgroundColor:'#fff3d8',padding:{x:4,y:2}}).setOrigin(.5,1).setDepth(900);
    this.bubbles=this.bubbles.filter(b=>{if(b.npc===npc){b.text.destroy();return false;}return true;}); // one bubble per spectator
    this.bubbles.push({text:bubble,npc,until:this.clock+1100});
  }
  update(ms){
    const s=this.scene,k=s.keys,touch=s.game.touchControls?.input;
    const pressed=key=>Phaser.Input.Keyboard.JustDown(k[key]);
    if(pressed('ESC') && this.exhibition){s.game.events.emit('aura-exit');return;}
    if(pressed('P') || touch?.justDown('P')){
      s.paused=!s.paused;this.pause.setVisible(s.paused);s.music?.setPaused(s.paused);s.sfx?.setPaused(s.paused);s.game.events.emit('combat-paused',s.paused);
    }
    if(pressed('R') && (this.exhibition || this.phase!=='over')){s.restartLevel();return;}
    if(s.paused || s.waitingContinue || s.gameOver){touch?.discardPresses();this.typed.length=0;return;}
    if(this.duel.won && (pressed('ENTER') || touch?.justDown('ENTER')))this.confirm();
    const dt=Math.min(ms,100);this.clock+=dt;
    if(this.phase==='walk'){this.walk(dt);this.typed.length=0;}
    else if(this.phase==='duel'){this.duel.step(dt);this.pollInputs();this.handleEvents();}
    if(this.resultAt!==null && this.clock>=this.resultAt){
      this.resultAt=null;
      s.game.events.emit('level-result',{won:true,aura:true,last:s.levelIndex===levels.length-1,bossCheckpoint:false,score:s.run.score,character:s.character.name});
    }
    if(this.phase==='walk' && this.clock>=this.nextShout){ // the crowd makes noise while you approach
      this.nextShout=this.clock+700+Math.floor(Math.random()*700);
      this.shout(this.crowd[Math.floor(Math.random()*this.crowd.length)],SHOUTS[Math.floor(Math.random()*SHOUTS.length)]);
    }
    touch?.discardPresses();this.render();
  }
  render(){
    const s=this.scene,d=this.duel,t=this.clock,p=d.phase;
    // fighters
    this.playerShadow.x=s.player.x;
    let move='six-seven',frame=1;
    if(p==='input' && this.lastMove && t-this.lastMoveAt<700){move=this.lastMove;frame=Math.min(2,Math.floor((t-this.lastMoveAt)/170));}
    else if(p==='perform'){const i=Math.min(d.moves.length-1,Math.floor(d.time/AURA_RULES.performStep));move=d.moves[i];frame=Math.min(2,Math.floor((d.time%AURA_RULES.performStep)/(AURA_RULES.performStep/3)));}
    else if(p==='won'){move='sigma-finish';frame=2;}
    else if(p==='replay' || p==='emptied'){move='sigma-finish';frame=1;} // the player looks away while the rival shows off
    if(s.player.sprite.visible){
      const resting=p==='intro' || this.clock<(this.settleUntil??0);
      s.player.sprite.setTexture(`aura-${s.characterKey}-${resting?'idle':move}`,resting?0:frame);
    }
    this.rival.setTexture(...this.rivalPose());
    // crowd bounce toward whoever earned the cheer
    const cheering=t<(this.cheerUntil??0) || p==='won',side=this.cheerSide==='rival'?RIVAL_X:PLAYER_X;
    for(const [i,npc] of this.crowd.entries()){
      const close=Math.abs(npc.x-side)<330 || p==='won';
      npc.sprite.y=npc.y-(cheering && close?Math.round(Math.max(0,Math.sin(t/120+i))*5):Math.round(Math.max(0,Math.sin(t/260+i*1.7))*1.5));
    }
    this.bubbles=this.bubbles.filter(b=>{if(t<b.until)return true;b.text.destroy();return false;});
    // top bar
    this.names.setText(`${s.character.name}  vs  EL GORDO DEL AURA${this.exhibition?'':`   ·   VIDAS ×${s.run.lives}`}`);
    this.meterFill.width=276*d.meter/AURA_RULES.goal;
    this.meterGhost.width=Math.max(this.meterFill.width,(this.meterGhost.width||0)-2);
    this.roundLabel.setText(d.round>=0?`RONDA ${d.round+1}`:'');
    // sequence row
    this.renderSequence();
    const limit=d.inputLimit,left=d.inputLeft;
    for(const item of [this.timerBack,this.timerFill])item.setVisible(p==='input');
    this.timerFill.width=320*(limit?left/limit:0);this.timerFill.setFillStyle(left<limit*.3?0xe8231d:0xffe189);
    this.message.setText(this.messageText());
    this.retry.setText(this.exhibition && p==='won'?'R / TOCA AQUÍ PARA REPETIR':'');
  }
  rivalPose(){
    const d=this.duel,t=this.clock,p=d.phase,i=d.showing,s=this.scene;
    const cycle=Math.floor(t/700)%3;
    if((p==='demo' || p==='replay') && i>=0){
      const move=d.moves[d.moveOf(i)],own=`aura-gordo-${move}`;
      this.rivalCue.setText(AURA_INPUTS[d.sequence[i]]).setVisible(true).setY(FLOOR_Y-262-(t%300<120?6:0));
      if(s.textures.exists(own))return [own,Math.min(2,i%2?2:0)]; // dedicated emote art when it exists
      return ['aura-gordo-idle',i%3];
    }
    this.rivalCue.setVisible(false);
    if(p==='replay' || p==='emptied')return ['aura-gordo-hype',cycle];
    if(p==='perform')return ['aura-gordo-defeat',0];
    if(p==='won')return ['aura-gordo-defeat',Math.min(2,Math.floor(d.time/600))];
    return ['aura-gordo-idle',cycle];
  }
  renderSequence(){
    const d=this.duel,p=d.phase,n=d.sequence.length,visible=['demo','input','perform','replay'].includes(p);
    const width=n*44+Math.max(0,d.moves.length-1)*14,start=480-width/2+19;
    for(let i=0;i<this.keyBoxes.length;i++){
      const on=visible && i<n,box=this.keyBoxes[i],label=this.keyTexts[i];
      box.setVisible(on);label.setVisible(on);if(!on)continue;
      const x=start+i*44+d.moveOf(i)*14;box.x=x;label.x=x;
      let color=COLORS.pending,glyph=AURA_INPUTS[d.sequence[i]];
      if(p==='demo'){color=i===d.showing?COLORS.shown:i<d.showing || d.showing<0?COLORS.next:COLORS.pending;if(i>d.showing && d.showing>=0)glyph='?';}
      else if(p==='input')color=i<d.progress?COLORS.done:i===d.progress?COLORS.shown:COLORS.next;
      else if(p==='perform')color=COLORS.done;
      else if(p==='replay')color=d.failure && i===d.failure.at?COLORS.wrong:i===d.showing?COLORS.shown:i<d.failure?.at?COLORS.done:COLORS.next;
      box.setFillStyle(color);label.setText(glyph).setColor(color===COLORS.shown || color===COLORS.done?'#14101c':'#fff3d8');
    }
    for(let m=0;m<this.moveTexts.length;m++){
      const on=visible && m<d.moves.length,item=this.moveTexts[m];item.setVisible(on);if(!on)continue;
      item.x=start+(m*2+.5)*44+m*14;item.setText(MOVE_LABEL[d.moves[m]]??'');
    }
  }
  messageText(){
    const d=this.duel,p=d.phase;
    if(this.phase==='walk')return '→ CAMINA HACIA EL CÍRCULO';
    if(this.phase==='over')return 'TE QUEDASTE SIN AURA';
    if(p==='intro')return '¡EL GORDO DEL AURA TE RETA!';
    if(p==='demo')return 'MIRA AL GORDO…';
    if(p==='input')return '¡TU TURNO! REPITE LA SECUENCIA';
    if(p==='perform')return `¡+${AURA_RULES.gain} DE AURA!`;
    if(p==='replay')return d.failure?.reason==='time'?'SE TE FUE EL TIEMPO… ASÍ SE HACE':'¡FALLASTE! EL GORDO TE MUESTRA CÓMO ES';
    if(p==='emptied')return this.exhibition?'SIN AURA · OTRA VEZ':'¡TE QUEDASTE SIN AURA! −1 VIDA';
    if(p==='won')return '¡EL PÚBLICO ESTÁ CONTIGO!';
    return '';
  }
}
