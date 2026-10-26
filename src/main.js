import Phaser from 'phaser';
import './style.css';
import selectionBackground from './data/players/fondo_players.png?url';
document.documentElement.style.setProperty('--selection-art',`url(${selectionBackground})`);
// Bundled web fonts, Latin subset only (covers Spanish): the cyrillic/vietnamese/latin-ext files were dead weight in the build.
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/barlow-condensed/latin-900.css';
import { installCrispText } from './ui/crispText.js';
import { StreetScene } from './scenes/StreetScene.js';
import { levels } from './data/levels.js';
import { IntroScene } from './scenes/IntroScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterIntroScene } from './scenes/CharacterIntroScene.js';
import { characters } from './data/characters.js';
import { enemies } from './data/enemies.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { AudioActivation } from './audio/AudioActivation.js';
import { TouchControls } from './input/TouchControls.js';
import { RunState, ContinueCountdown, saveRecord, MAX_CONTINUES, RANKING_KEY, loadRanking, addToRanking, qualifiesForRanking, cleanInitials } from './game/RunState.js';
import {ARCADE} from './data/arcade.js';
import {campaignIndexForCombat} from './data/campaign.js';
import {RING_BONUS,shouldStartRingBonus} from './bonus/ringRules.js';
import {CHIVA_BONUS,shouldStartChivaBonus} from './bonus/chivaRules.js';

let selected = 'office';
let screen = 'intro';
let returnToStreet=false,lastResult=null,countdown=null,countdownTimer=null;
// Development shortcuts must never overwrite a real player's record.
const recordKey=import.meta.env.DEV && ['bossTest','bossIntroTest','enemyTest','playerPreview','campaignPreview','bonusTest','cyclingTest','gameOverTest'].some(key=>new URLSearchParams(location.search).has(key))?'street-bogota-record-qa':'street-bogota-record-v1';
const selection = document.querySelector('#selection');
const resultModal=document.querySelector('#result-modal');

const levelLabel = document.querySelector('#level');
const combatControlsDescription=document.querySelector('#game').getAttribute('aria-label');
document.querySelectorAll('[data-character], #restart').forEach((button) => { button.disabled = true; });

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: ARCADE.screen.width,
  height: ARCADE.screen.height,
  backgroundColor: '#293e46',
  pixelArt: true,
  roundPixels:true,
  fps:{target:ARCADE.clock.fps,forceSetTimeOut:true,smoothStep:false},
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, IntroScene, CharacterIntroScene, StreetScene],
});

const focusGame = () => document.querySelector('#game').focus({ preventScroll: true });
const audioActivation=new AudioActivation(game,{button:document.querySelector('#audio-toggle')});
game.events.once('destroy',()=>audioActivation.destroy());
game.run=new RunState();
game.touchControls=new TouchControls(game);
installCrispText(game);
game.recordKey=recordKey;
const rankingKey=recordKey.endsWith('-qa')?'street-bogota-ranking-qa':RANKING_KEY;game.rankingKey=rankingKey;
const flushCombatInput=()=>{const s=game.scene.getScene('Street');s?.arcade?.clearInput();s?.input?.keyboard?.resetKeys();};
window.addEventListener('blur',flushCombatInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCombatInput();});
game.events.once('destroy',()=>game.touchControls.destroy());
game.events.on('combat-paused',paused=>game.touchControls.setPaused(paused));
let uiSounds;
function playUiSound(name) {
  uiSounds??=new SoundEffects(game.sound,game.cache.audio);
  uiSounds.play(name,{waitForUnlock:true});
}
game.events.once('destroy',()=>uiSounds?.destroy());
// Capture before a button replaces its screen; keyboard activation also emits click.
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button && !button.disabled && !button.hasAttribute('data-touch-action'))playUiSound(button.matches('[data-pick]')?'start':'button');
},true);
function showScreen(next) {
  screen = next;
  document.documentElement.dataset.screen=next;
  game.touchControls.setEnabled(next==='game');
  selection.hidden = next !== 'selection';
  resultModal.hidden=true;
  document.querySelector('#game').inert = false;
  document.querySelector('.toolbar').inert = next !== 'game';
}
function pick(key) {
  selected = key;
  document.querySelectorAll('[data-pick]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pick === key)));
}
// TEST LEVEL SELECTOR: lets you start any level from the character screen.
// Set LEVEL_SELECT to false to remove it (the game then always continues from the campaign's current level).
const LEVEL_SELECT = false;
const levelPicker=import.meta.env.DEV && LEVEL_SELECT?createLevelPicker():null;
function createLevelPicker(){
  const label=document.createElement('label');label.className='level-picker';
  label.style.cssText='display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:1px;color:#d6ed64';
  const select=document.createElement('select');select.setAttribute('aria-label','Nivel de prueba');
  select.style.cssText='background:#213138;color:#e7e8df;border:1px solid #d6ed64;padding:6px 8px;font:inherit;font-size:11px';
  levels.forEach((level,index)=>select.append(new Option(`${String(index+1).padStart(2,'0')} · ${level.name.toUpperCase()}${level.boss?' · JEFE':''}`,index)));
  select.append(new Option('BONUS · DESTRUYE LA CHIVA','bonus:chiva'),new Option('BONUS · EL RING DE LOS TRAQUES','bonus:ring'));
  label.append('NIVEL (PRUEBAS)',select);
  const heading=document.querySelector('.selection-heading');
  heading?.insertBefore(label,document.querySelector('#back'));
  return label;
}
function openSelection() {
  returnToStreet=game.scene.isActive('Street') || game.scene.isPaused('Street');
  if(returnToStreet) {
    const scene=game.scene.getScene('Street');
    scene.music?.setPaused(true);scene.sfx?.setPaused(true);scene.boss?.setPaused(true);
    game.scene.pause('Street');
  }
  showScreen('selection');
  if(levelPicker){levelPicker.hidden=returnToStreet;levelPicker.querySelector('select').value=String(game.run.level);}
  pick(selected);
  document.querySelector(`[data-pick="${selected}"]`).focus();
}
function startIntro(data={kind:'game'}) {
  if(['boss','ending','credits'].includes(data.kind))game.scene.pause('Street');
  else game.scene.stop('Street');
  game.scene.stop('Menu');game.scene.stop('CharacterIntro');
  showScreen('intro');
  document.querySelector('#next-level').disabled=true;
  if(data.kind==='level')levelLabel.textContent=`${String(data.level+1).padStart(2,'0')} / ${levels[data.level].name.toUpperCase()}`;
  const sceneKey=data.kind==='character' || data.kind==='ending'?'CharacterIntro':'Intro';
  if(sceneKey!=='Intro')game.scene.stop('Intro');
  game.scene.start(sceneKey,data);
  game.scene.bringToTop(sceneKey);
  focusGame();
}
function play() {
  if(returnToStreet) {
    const scene=game.scene.getScene('Street');scene.ensureCharacter(selected,()=>{scene.switchCharacter(selected);resumeStreet();});return;
  }
  if(levelPicker && !levelPicker.hidden){
    const choice=levelPicker.querySelector('select').value;
    if(choice==='bonus:chiva' || choice==='bonus:ring'){
      const ring=choice==='bonus:ring',bonus=ring?RING_BONUS:CHIVA_BONUS;
      game.run.advance(bonus.afterLevel);
      (ring?startRingBonus:startChivaBonus)({character:selected,level:bonus.afterLevel+1});
      return;
    }
    const level=Number(choice);if(level!==game.run.level)game.run.advance(level);
  }
  // Character story screen first; confirming it continues to the level intro.
  startIntro({kind:'character',character:selected,level:game.run.level});
}
function resumeStreet() {
  const scene=game.scene.getScene('Street');game.scene.resume('Street');showScreen('game');
  scene.music?.setPaused(scene.paused);scene.sfx?.setPaused(scene.paused);scene.boss?.setPaused(scene.paused);
  game.touchControls.setCharacter(scene.characterKey);game.touchControls.setPaused(scene.paused);focusGame();
  if(scene.finished && !scene.pendingResult && lastResult)showResult(lastResult);
}
function clearCountdown(){clearInterval(countdownTimer);countdownTimer=null;countdown=null;}
function acceptContinue(change=false) {
  if(!countdown?.accept())return false;
  clearCountdown();game.scene.getScene('Street').continueRun();
  if(change)openSelection();return true;
}
function newGame() {
  clearCountdown();game.scene.stop('Street');game.scene.stop('Intro');
  game.run.reset();returnToStreet=false;lastResult=null;openSelection();
  levelLabel.textContent=`01 / ${levels[0].name.toUpperCase()}`;
}
function selectionBack(){if(returnToStreet)resumeStreet();else startIntro();}
const rankingForm=document.querySelector('#ranking-entry'),initialsInput=document.querySelector('#initials'),rankingList=document.querySelector('#ranking-list');
let pendingRanking=null;
// Phaser captures W/A/S/D/H/J/K/L/P/R…; release them while the player types initials.
function setTyping(typing){const keyboard=game.scene.getScene('Street')?.input?.keyboard;if(typing)keyboard?.disableGlobalCapture?.();else keyboard?.enableGlobalCapture?.();}
function renderRanking(ranking,mine=-1) {
  rankingList.replaceChildren(...(ranking.length?ranking.map((entry,index)=>{
    const row=document.createElement('li');if(index===mine)row.className='mine';
    for(const [cls,text] of [['initials',entry.initials],['who',`${entry.character??''}${entry.level?` · NIVEL ${entry.level}`:''}`],['points',entry.score]]){
      const cell=document.createElement('span');cell.className=cls;cell.textContent=text;row.append(cell);
    }
    return row;
  }):[Object.assign(document.createElement('li'),{className:'empty',textContent:'AÚN NO HAY PUNTAJES'})]));
  rankingList.hidden=false;
}
/** Game over / final victory: ask for initials when the score enters the top 10, otherwise just show the ranking. */
function offerRanking(score,character,level,focusAfter) {
  const ranking=loadRanking(undefined,rankingKey);
  if(qualifiesForRanking(score,ranking)){
    pendingRanking={score,character,level,focusAfter};rankingForm.hidden=false;initialsInput.value='';
    renderRanking(ranking);setTyping(true);setTimeout(()=>initialsInput.focus(),0);
  } else {pendingRanking=null;renderRanking(ranking);focusAfter?.focus();}
}
function submitRanking() {
  if(!pendingRanking)return;
  const {score,character,level,focusAfter}=pendingRanking;pendingRanking=null;
  const {ranking,position}=addToRanking({initials:initialsInput.value,score,character,level},undefined,rankingKey);
  rankingForm.hidden=true;setTyping(false);renderRanking(ranking,position);focusAfter?.focus();
}
rankingForm.addEventListener('submit',event=>{event.preventDefault();submitRanking();});
initialsInput.addEventListener('input',()=>{const clean=cleanInitials(initialsInput.value);if(clean!==initialsInput.value)initialsInput.value=clean;});
function resetResultButtons() {
  for(const id of ['next-level','retry','result-choose','continue-run','new-game'])document.getElementById(id).hidden=true;
  document.querySelector('#continue-count').hidden=true;
  rankingForm.hidden=true;rankingList.hidden=true;if(pendingRanking){pendingRanking=null;setTyping(false);}
  document.querySelector('#result-choose').textContent='CAMBIAR PERSONAJE';
}
function openResult(mode='result') {
  resultModal.dataset.mode=mode;
  resultModal.setAttribute('aria-describedby',mode==='gameover'?'gameover-taunt result-description result-score':'result-description');
  game.touchControls.setEnabled(false);resultModal.hidden=false;
  document.querySelector('.toolbar').inert=true;
  game.scene.getScene('Street').overlay.setVisible(false);
}
function showResult(result) {
  if(result.bonus)return showBonusResult(result);
  const {won,last,score,character}=result;lastResult=result;resetResultButtons();
  const scene=game.scene.getScene('Street');scene.input.keyboard.resetKeys();
  document.querySelector('#result-title').textContent=result.cycling?'¡CICLOVÍA COMPLETADA!':last?'BOGOTÁ DESPEJADA':'CUADRA DESPEJADA';
  document.querySelector('#result-description').textContent=result.cycling?'Llegaste a la meta. Sigue Plaza de Bolívar.':last?'Sobreviviste a la pelea por Bogotá.':'La siguiente cuadra te espera.';
  let text=`${character} · ${score} PUNTOS`;
  if(last){const record=saveRecord(score,character,undefined,recordKey);text+=` · RÉCORD ${record.score} — ${record.character}`;}
  document.querySelector('#result-score').textContent=text;
  const next=document.querySelector('#next-level');next.hidden=last;next.disabled=last;
  document.querySelector('#retry').hidden=last;document.querySelector('#retry').classList.remove('primary');
  document.querySelector('#new-game').hidden=!last;document.querySelector('#result-choose').hidden=last;
  openResult();document.querySelector(last?'#new-game':'#next-level').focus();
  if(last)offerRanking(score,character,levels.length,document.querySelector('#new-game'));
}

function showBonusResult(result){
  lastResult=result;resetResultButtons();
  const s=game.scene.getScene('Street');s.input.keyboard.resetKeys();
  document.querySelector('#result-title').textContent=result.kind==='ring'?(result.won?'¡LOS CUATRO A LA LONA!':result.reason==='timeout'?'TIEMPO AGOTADO':'PLAYER A LA LONA'):(result.won?'¡CHIVA DESTRUIDA!':'TIEMPO AGOTADO');
  document.querySelector('#result-description').textContent=result.kind==='ring'?(result.won?'¡Ganaste el ring! +10.000 puntos.':`${result.defeated}/4 rivales vencidos. La campaña continúa.`):result.won?'Bonus perfecto: 5000 puntos. ¡Coste no lo puede creer!':`${result.hits} golpes × 100 puntos. La campaña continúa.`;
  document.querySelector('#result-score').textContent=`+${result.points} BONUS · ${result.score} PUNTOS TOTALES`;
  const next=document.querySelector('#next-level');next.hidden=false;next.disabled=false;
  openResult();next.focus();
}
game.events.on('bonus-complete',showBonusResult);
game.events.on('player-death',()=>game.touchControls.setEnabled(false));
game.events.on('player-respawn',()=>{showScreen('game');game.touchControls.setCharacter(selected);focusGame();});
game.events.on('level-victory',()=>{game.touchControls.reset();});
game.events.on('continue-needed',()=>{
  clearCountdown();countdown=new ContinueCountdown();resetResultButtons();
  document.querySelector('#result-title').textContent='¿CONTINUAR?';
  const left=game.run.continuesLeft;
  document.querySelector('#result-description').textContent=`Vuelve a la pelea con 3 vidas en esta misma cuadra. ${left===1?'Te queda 1 continuación':`Te quedan ${left} continuaciones`} de ${MAX_CONTINUES}.`;
  document.querySelector('#result-score').textContent=`${game.run.score} PUNTOS`;
  document.querySelector('#continue-count').hidden=false;document.querySelector('#continue-seconds').textContent='10';
  document.querySelector('#continue-run').hidden=false;document.querySelector('#result-choose').hidden=false;
  document.querySelector('#result-choose').textContent='CONTINUAR CON OTRO PERSONAJE';
  openResult('continue');document.querySelector('#continue-run').focus();
  countdownTimer=setInterval(()=>{
    if(!countdown)return;document.querySelector('#continue-seconds').textContent=countdown.remaining;
    if(countdown.remaining===0){clearCountdown();game.scene.getScene('Street').endRun();}
  },100);
});
game.events.on('game-over',()=>{
  resetResultButtons();document.querySelector('#result-title').textContent='GAME OVER';
  document.querySelector('#result-description').textContent=game.run.canContinue?'Se acabó el tiempo. La próxima vuelta empieza desde el nivel 1.':`Usaste tus ${MAX_CONTINUES} continuaciones. La próxima vuelta empieza desde el nivel 1.`;
  const name=game.scene.getScene('Street').character.name,record=saveRecord(game.run.score,name,undefined,recordKey);
  document.querySelector('#result-score').textContent=`${name} · ${game.run.score} PUNTOS · RÉCORD ${record.score} — ${record.character}`;
  document.querySelector('#new-game').hidden=false;openResult('gameover');document.querySelector('#new-game').focus();
  offerRanking(game.run.score,name,game.run.level+1,document.querySelector('#new-game'));
});
showScreen('intro');
game.events.on('intro-complete',data=>{
  playUiSound(data.kind==='game' || (data.kind==='character' && !data.back)?'start':'button');
  if(data.kind==='ending') {
    startIntro({kind:'credits',result:data.result});
  } else if(data.kind==='credits') {
    // Back to the (paused) street under the final result: score, record and ranking.
    game.scene.resume('Street');showScreen('game');game.touchControls.setEnabled(false);showResult(data.result);
  } else if(data.kind==='character') {
    if(data.back)openSelection();
    else startIntro({kind:'level',character:data.character,level:data.level});
  } else if(data.kind==='game') {
    startIntro({kind:'story'});
  } else if(data.kind==='boss') {
    game.scene.resume('Street');game.scene.getScene('Street').resumeBoss();showScreen('game');focusGame();
  } else if(data.kind==='level') {
    showScreen('game');game.scene.start('Street',{character:data.character,level:data.level,run:game.run});focusGame();
  } else openSelection();
});
function startChivaBonus(data){
  game.run.chivaBonusPlayed=true;showScreen('game');game.scene.stop('Intro');game.scene.stop('Menu');
  game.scene.start('Street',{character:data.character,level:CHIVA_BONUS.afterLevel,chivaBonus:true,returnLevel:data.level,run:game.run});focusGame();
}
function startRingBonus(data){
  game.run.ringBonusPlayed=true;showScreen('game');game.scene.stop('Intro');game.scene.stop('Menu');
  game.scene.start('Street',{character:data.character,level:RING_BONUS.afterLevel,ringBonus:true,returnLevel:data.level,run:game.run});focusGame();
}
game.events.on('level-transition',data=>{
  if(shouldStartChivaBonus(data.level,game.run))startChivaBonus(data);
  else if(shouldStartRingBonus(data.level,game.run))startRingBonus(data);
  else startIntro({...data,kind:'level'});
});
game.events.on('boss-intro',data=>startIntro({...data,kind:'boss'}));
game.events.once('menu-ready',()=>startIntro());
if (import.meta.env.DEV) {
  // Console helpers and direct test URLs are stripped from production builds.
  window.streetDebug = {
    boss: () => game.scene.getScene('Street').boss?.snapshot(),
    attack: (key,options) => game.scene.getScene('Street').boss?.debugAttack(key,options),
    phase: phase => game.scene.getScene('Street').boss?.debugPhase(phase),
    start: (character='gymbro', attack='entry') => {
      if(!characters[character]) return false;
      selected=character;showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
      game.scene.start('Street',{character,level:campaignIndexForCombat(5),bossTest:attack});focusGame();return true;
    },
  };
  const debugParams = new URLSearchParams(window.location.search);
  if(debugParams.has('bossIntroTest'))game.events.once('menu-ready',()=>{
    const found=levels.findIndex(level=>level.boss===debugParams.get('bossIntroTest')),level=found<0?0:found;
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    game.events.once('level-start',()=>{
      const s=game.scene.getScene('Street');s.waves.skipToEnd();s.stage.jumpToArena(s.waves.arena);
      s.defeated=s.level.total;for(const enemy of s.enemies)enemy.hp=0;s.beginBossIntro();
    });
    game.scene.start('Street',{character:selected,level});focusGame();
  });
  if(debugParams.has('gameOverTest'))game.events.once('menu-ready',()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    game.events.once('level-start',()=>{game.run.score=12500;game.run.continuesUsed=MAX_CONTINUES;game.scene.getScene('Street').endRun();});
    game.scene.start('Street',{character:selected,level:0,run:game.run});
  });
  if(debugParams.has('cyclingTest'))game.events.once('menu-ready',async()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    game.scene.start('Street',{character:selected,level:1});focusGame();
    const {installCyclingPreview}=await import('./debug/cyclingPreview.js');installCyclingPreview(game);
  });
  if(debugParams.has('bonusTest'))game.events.once('menu-ready',async()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    if(debugParams.get('bonusTest')==='ring'){startRingBonus({character:selected,level:RING_BONUS.afterLevel+1});const {installRingPreview}=await import('./debug/ringPreview.js');installRingPreview(game);return;}
    startChivaBonus({character:selected,level:CHIVA_BONUS.afterLevel+1});
    const {installChivaPreview}=await import('./debug/chivaPreview.js');installChivaPreview(game);
  });
  if(debugParams.has('enemyTest') || debugParams.has('combatPreview'))game.events.once('menu-ready',async()=>{
    const {installCombatPreview}=await import('./debug/combatPreview.js');installCombatPreview(game);
  });
  const enemyTest=debugParams.get('enemyTest');
  if(enemies[enemyTest]?.combo || enemies[enemyTest]?.charge || enemies[enemyTest]?.shieldBreak || enemies[enemyTest]?.brayatan || enemies[enemyTest]?.pacho || enemies[enemyTest]?.leap || enemies[enemyTest]?.juggler || enemies[enemyTest]?.paint || enemies[enemyTest]?.throw?.fruit || enemies[enemyTest]?.diablito || enemies[enemyTest]?.pollero || enemies[enemyTest]?.papero || enemies[enemyTest]?.reversa)game.events.once('menu-ready',async()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    const testArt=['frutatiana','don_diablo','don_pico','papero','reversa'].includes(enemyTest)?(await import('./data/palomojao.js')).PALOMOJAO_ART:null;
    game.scene.start('Street',{character:selected,level:campaignIndexForCombat(testArt?7:enemies[enemyTest].mime?1:enemies[enemyTest].leap?5:enemies[enemyTest].pacho?6:enemies[enemyTest].brayatan?5:enemies[enemyTest].shieldBreak?4:2),enemyTest,testArt});focusGame();
  });
  if(debugParams.has('campaignPreview'))game.events.once('menu-ready',async()=>{
    const {installCampaignPreview}=await import('./debug/campaignPreview.js');installCampaignPreview(game);
    if(debugParams.get('campaignPreview')==='palomojao'){
      selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
      showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
      game.events.once('level-start',()=>{game.scene.getScene('Street').invulnerableUntil=Infinity;});
      game.scene.start('Street',{character:selected,level:campaignIndexForCombat(7)});focusGame();
    }
  });
  if(debugParams.has('playerPreview')) game.events.once('menu-ready',async()=>{
    const previewCharacter=characters[debugParams.get('playerPreview')]?debugParams.get('playerPreview'):'office';
    const restart=()=>{
      selected=previewCharacter;showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
      game.scene.start('Street',{character:previewCharacter,level:0,playerPreview:true});focusGame();
    };
    restart();
    const {installPlayerPreview}=await import('./debug/playerPreview.js');
    installPlayerPreview(game,restart,previewCharacter);
  });
  if(debugParams.has('bossTest')) game.events.once('menu-ready',()=>window.streetDebug.start(debugParams.get('character')||'gymbro',debugParams.get('bossTest')||'entry'));
}
document.querySelector('#choose').addEventListener('click', openSelection);
document.querySelector('#result-choose').addEventListener('click',()=>{if(countdown)acceptContinue(true);else openSelection();});
document.querySelector('#continue-run').addEventListener('click',()=>acceptContinue());
document.querySelector('#new-game').addEventListener('click',newGame);
document.querySelector('#back').addEventListener('click',selectionBack);
document.querySelectorAll('[data-pick]').forEach(button => button.addEventListener('click', () => {
  pick(button.dataset.pick);
  play();
}));
document.addEventListener('keydown', event => {
  if(event.target===initialsInput)return; // typing initials: Enter submits the form, letters are not shortcuts
  if(!event.repeat && !resultModal.hidden && ['Enter','r','R'].includes(event.key)) {
    if(countdown){event.preventDefault();event.stopImmediatePropagation();acceptContinue();return;}
    if(game.scene.getScene('Street').gameOver){event.preventDefault();event.stopImmediatePropagation();newGame();return;}
  }
  if(!resultModal.hidden && event.key==='Tab') {
    const buttons=[...resultModal.querySelectorAll('button')].filter(button=>!button.hidden && !button.disabled);
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    return;
  }
  if (screen === 'game' || event.repeat) return;
  if (screen === 'selection') {
    if (event.target.closest?.('.level-picker')) return; // arrows/Enter belong to the level dropdown
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const roster = Object.keys(characters), step = event.key === 'ArrowRight' ? 1 : -1;
      pick(roster[(roster.indexOf(selected) + step + roster.length) % roster.length]);
      document.querySelector(`[data-pick="${selected}"]`).focus();
    } else if (event.key === 'Enter' && document.activeElement.id !== 'back') { event.preventDefault(); playUiSound('start');play(); }
    else if (event.key === 'Escape') selectionBack();
  }
});
game.events.on('level-start', (index) => {
  const cycling=levels[index].mode==='cycling';
  document.querySelector('#game').setAttribute('aria-label',cycling?'Juego: pedaleo automático en bicicleta. Flechas arriba y abajo o W y S para esquivar. Shift activa dash durante 3 segundos, con 5 segundos de recarga. P pausa y R reiniciar.':combatControlsDescription);
  game.touchControls.setCharacter(game.scene.getScene('Street').characterKey);
  game.touchControls.setEnabled(true);
  resultModal.hidden=true;document.querySelector('.toolbar').inert=false;
  document.querySelector('#choose').disabled = false;
  document.querySelectorAll('[data-character], #restart').forEach((button) => { button.disabled = false; });
  const street=game.scene.getScene('Street'),bonus=street.isChivaBonus || street.isRingBonus;
  levelLabel.textContent=bonus?(street.isRingBonus?'BONUS / EL RING':'BONUS / LA CHIVA'):`${String(index+1).padStart(2,'0')} / ${game.scene.getScene('Street').level.name.toUpperCase()}`;
  document.querySelector('#restart').disabled=bonus;
  document.querySelector('#next-level').disabled = true;
});
game.events.on('level-clear', (index) => {
  document.querySelector('#next-level').disabled = index >= levels.length - 1;
});
// The final victory plays the character ending and credits before saving scores or offering initials.
game.events.on('level-result',result=>{
  const scene=game.scene.getScene('Street');
  if(result.won && result.last)startIntro({kind:'ending',character:scene.characterKey,result});
  else showResult(result);
});
game.events.on('level-restart',()=>{showScreen('game');focusGame();});
document.querySelector('#next-level').addEventListener('click', () => {
  game.scene.getScene('Street').nextLevel();
  focusGame();
});
const restart=()=>game.scene.getScene('Street').restartLevel();
document.querySelector('#restart').addEventListener('click',restart);
document.querySelector('#retry').addEventListener('click',restart);
