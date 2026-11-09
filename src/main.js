import {SUPER} from './game/SuperPower.js';
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
import {MapScene} from './scenes/MapScene.js';
import {ComicIntroScene} from './scenes/ComicIntroScene.js';
import {PALETTES,UNLOCK_LEVELS,loadPaletteState,unlockPalette,savePaletteState} from './data/palettes.js';
import {PalettePicker,toast} from './ui/PalettePicker.js';
import {loadDifficulty,saveDifficulty,difficultyFor,DIFFICULTIES} from './data/difficulty.js';
import {MainMenu} from './ui/MainMenu.js';
import {SelectScreen} from './ui/SelectScreen.js';
import {CombosScreen} from './ui/CombosScreen.js';
import {SURVIVAL,loadSurvivalRecord,saveSurvivalRecord} from './game/Survival.js';
import menuArt from './scenes/intro_juego_v2.png?url';
import {GamepadBridge} from './input/GamepadBridge.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterIntroScene } from './scenes/CharacterIntroScene.js';
import { characters } from './data/characters.js';
import { enemies } from './data/enemies.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { AudioActivation } from './audio/AudioActivation.js';
import { TouchControls } from './input/TouchControls.js';
import { RunState, ContinueCountdown, saveRecord, MAX_CONTINUES, RANKING_KEY, loadRanking, addToRanking, qualifiesForRanking } from './game/RunState.js';
import { LevelLoader } from './ui/LevelLoader.js';
import { ControlsScreen } from './ui/ControlsScreen.js';
import { createLeaderboard, cleanUsername, validUsername, LeaderboardError, LEADERBOARD_ERRORS } from './online/Leaderboard.js';
import {ARCADE} from './data/arcade.js';
import {campaignIndexForCombat} from './data/campaign.js';
import {RING_BONUS,shouldStartRingBonus,shouldStartSecretRing} from './bonus/ringRules.js';
import {CHIVA_BONUS,shouldStartChivaBonus} from './bonus/chivaRules.js';
import {CollectibleCards} from './ui/CollectibleCards.js';
import {MONSERRATE} from './monserrate/MonserrateRun.js';
import {unlockedLevel,markLevelCleared,createProgressSlots} from './game/Progress.js';
import {CloudSave} from './online/CloudSave.js';
import {AccountPanel} from './ui/AccountPanel.js';

let selected = 'office';
let screen = 'intro';
let returnToStreet=false,lastResult=null,countdown=null,countdownTimer=null;
// Development shortcuts must never overwrite a real player's record.
const recordKey=import.meta.env.DEV && ['bossTest','bossIntroTest','enemyTest','playerPreview','campaignPreview','bonusTest','cyclingTest','gameOverTest','auraTest','monserrateTest'].some(key=>new URLSearchParams(location.search).has(key))?'street-bogota-record-qa':'street-bogota-record-v1';
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
  scene: [MenuScene, IntroScene, CharacterIntroScene, MapScene, ComicIntroScene, StreetScene],
});

const focusGame = () => document.querySelector('#game').focus({ preventScroll: true });
const audioActivation=new AudioActivation(game,{button:document.querySelector('#audio-toggle')});
game.events.once('destroy',()=>audioActivation.destroy());
game.run=new RunState();
game.touchControls=new TouchControls(game);
const safeStorage=(()=>{try{return window.localStorage;}catch{return null;}})();
game.paletteState=loadPaletteState(safeStorage);
// var, not const: pick() may run before this line.
var palettePicker=new PalettePicker({state:game.paletteState,storage:safeStorage,getCharacter:()=>selected,anchor:document.querySelector('.selection-hint')});
game.run.setDifficulty(loadDifficulty(safeStorage));
var difficultyPicker=null; // the difficulty now lives in the main menu
// SoR4-style character selection laid over the existing #selection DOM.
let playMode='story',stageChoice=null;
var selectScreen=new SelectScreen({root:selection,paletteState:game.paletteState,
  modeLabel:()=>`${playMode==='survival'?'SUPERVIVENCIA':stageChoice!=null?'ELEGIR NIVEL':'HISTORIA'} · ${difficultyFor(game.run.difficulty).name}`});
{const refresh=palettePicker.refresh.bind(palettePicker);palettePicker.refresh=()=>{refresh();selectScreen?.drawIdle();};}
selectScreen.cancel.addEventListener('click',()=>selectionBack());
// Stage select unlocks every level the player has reached (all of them in development).
// A level opens only after the previous one has been beaten (saved locally and in the cloud).
const levelUnlocked=index=>import.meta.env.DEV || index<=unlockedLevel(safeStorage);
const menuRoot=document.createElement('section');menuRoot.id='main-menu';menuRoot.hidden=true;menuRoot.setAttribute('aria-label','Menú principal');
selection.parentElement.insertBefore(menuRoot,selection);
const storyInProgress=()=>game.run.mode==='story' && game.run.started;
function chooseFighter(mode,stage=null){
  playMode=mode;stageChoice=stage;
  if(mode==='survival' || stage!=null || game.run.mode!=='story')game.run.reset();
  if(stage!=null && !String(stage).startsWith('bonus'))game.run.advance(0);
  openSelection();
}
var mainMenu=new MainMenu({root:menuRoot,art:menuArt,onBack:()=>startIntro({kind:'game',afterComic:true}),items:[
  {id:'story',big:true,get label(){return storyInProgress()?'CONTINUAR HISTORIA':'HISTORIA';},action:()=>chooseFighter('story'),
    hint:()=>storyInProgress()?`Sigues en el nivel ${game.run.level+1}: ${levels[game.run.level].name}.`:'Cruza Bogotá de Transmilleno a la Zona Rosa. Doce tramos, nueve jefes.'},
  {id:'stages',label:'ELEGIR NIVEL',action:()=>openStageSelect(),hint:()=>'Juega cualquier tramo al que ya hayas llegado.'},
  {id:'survival',label:'SUPERVIVENCIA',action:()=>chooseFighter('survival'),hint:()=>{const r=loadSurvivalRecord(safeStorage);
    return `Trancón infinito: una vida, oleadas sin fin.${r.wave?` Récord: oleada ${r.wave} · ${r.score} pts (${r.character}).`:''}`;}},
  {id:'difficulty',label:'DIFICULTAD',value:()=>difficultyFor(game.run.difficulty).name,disabled:()=>storyInProgress(),
    change:dir=>{const i=DIFFICULTIES.findIndex(d=>d.id===game.run.difficulty);game.run.setDifficulty(DIFFICULTIES[(i+dir+DIFFICULTIES.length)%DIFFICULTIES.length].id);saveDifficulty(game.run.difficulty,safeStorage);},
    hint:()=>storyInProgress()?'Se elige antes de empezar una historia nueva.':difficultyFor(game.run.difficulty).note},
  {id:'ranking',label:'RANKING',action:()=>document.querySelector('#ranking-open')?.click(),hint:()=>'Los mejores puntajes, locales y en línea.'},
  {id:'cards',label:'MIS TARJETAS',action:()=>cards.open(),hint:()=>'Las tarjetas que ganaste pasando tramos sin morir.'},
  {id:'account',label:'MI CUENTA',action:()=>{mainMenu.close();account.open({onClose:openMainMenu});},
    hint:()=>cloud?.username?`${cloud.username} · ${cloud.statusText}`:'Guarda tu avance en la nube y recupéralo en otro equipo.'},
  {id:'controls',label:'CONTROLES',action:()=>{mainMenu.close();controlsScreen.show(selected,{portrait:document.querySelector(`[data-portrait="${selected}"]`)?.src||null,onDone:openMainMenu,onBack:openMainMenu});},
    hint:()=>'Teclado, táctil y gamepad.'},
  {id:'combos',label:'COMBOS',action:()=>openCombos(),hint:()=>'PPKKK para todos; Gomelo suma PPP, Universitaria KKK y Teleperforman PPP de puños y KKK con teléfono; agarre + puño para latigazos.'},
  {id:'sound',label:'SONIDO',value:()=>document.querySelector('#audio-toggle')?.getAttribute('aria-pressed')==='true'?'SÍ':'NO',change:()=>document.querySelector('#audio-toggle')?.click(),hint:()=>'Música y efectos.'},
  {id:'intro',label:'VER INTRO',action:()=>startComic(),hint:()=>'La historia de cómo Don Pacho alquiló la ciudad.'},
]});
const combosRoot=document.createElement('section');selection.parentElement.insertBefore(combosRoot,selection);
var combosScreen=new CombosScreen({root:combosRoot,sheets:key=>selectScreen.sheet(key),paletteState:game.paletteState,
  portraits:key=>{const img=document.querySelector(`[data-portrait="${key}"]`);return img?.dataset.baseSrc||img?.getAttribute('src')||'';}});
function openCombos(){showScreen('combos');combosScreen.open(selected,{onClose:openMainMenu});}
function openMainMenu(){
  game.scene.stop('Street');game.scene.stop('Intro');game.scene.stop('Comic');game.scene.stop('Map');game.scene.stop('CharacterIntro');
  returnToStreet=false;showScreen('menu');mainMenu.open();
}
function openStageSelect(){
  const items=levels.map((level,index)=>({label:`${String(index+1).padStart(2,'0')} · ${level.name.toUpperCase()}`,disabled:()=>!levelUnlocked(index),
    hint:()=>levelUnlocked(index)?(level.boss?'Con jefe al final.':'Tramo especial.'):'Aún no llegas a este tramo en la historia.',action:()=>chooseFighter('story',index)}));
  if(import.meta.env.DEV)items.push({label:'BONUS · DESTRUYE LA CHIVA',action:()=>chooseFighter('story','bonus:chiva'),hint:()=>'Solo en desarrollo.'},
    {label:'BONUS · EL RING DE LOS TRAQUES',action:()=>chooseFighter('story','bonus:ring'),hint:()=>'Solo en desarrollo.'});
  mainMenu.openSub('ELEGIR NIVEL',items);
}
function startSurvival(){
  game.run.startSurvival(SURVIVAL.lives);
  const level=campaignIndexForCombat(SURVIVAL.combat);
  const go=()=>{showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');game.scene.start('Street',{character:selected,level,survival:true,run:game.run});focusGame();};
  if(document.documentElement.classList.contains('is-mobile'))return go();
  controlsScreen.show(selected,{portrait:document.querySelector(`[data-portrait="${selected}"]`)?.src||null,onDone:go,onBack:()=>document.querySelector(`[data-pick="${selected}"]`)?.focus()});
}
game.events.on('level-clear',index=>{
  const street=game.scene.getScene('Street');
  if(street?.isSurvival || street?.isChivaBonus || street?.isRingBonus || street?.isAuraExhibition || game.run.mode!=='story')return;
  if(markLevelCleared(index,safeStorage))cloud?.schedule();
});
function unlockPalettes(...unlocks){
  for(const unlock of unlocks)if(unlock && unlockPalette(game.paletteState,unlock)){
    savePaletteState(game.paletteState,safeStorage);palettePicker.refresh();cloud?.schedule();
    toast(`NUEVO COLOR DESBLOQUEADO · ${PALETTES.find(p=>p.unlock===unlock)?.name}`);
  }
}
// Palettes unlock by winning: Calles del centro (neón) and the whole campaign (dorado).
game.events.on(['level','result'].join('-'),result=>{ // separate listener, runs before the main level-result handler
  if(result.won && !result.bonus)unlockPalettes(UNLOCK_LEVELS[game.scene.getScene('Street')?.level?.name],result.last?'campaign':null);
});
game.gamepad=new GamepadBridge(game,{menuActive:()=>screen!=='game' || !resultModal.hidden || cards.isOpen || account?.isOpen || !board.hidden || controlsScreen.open});
installCrispText(game);
game.recordKey=recordKey;
const rankingKey=recordKey.endsWith('-qa')?'street-bogota-ranking-qa':RANKING_KEY;game.rankingKey=rankingKey;
const flushCombatInput=()=>{const s=game.scene.getScene('Street');s?.arcade?.clearInput();s?.input?.keyboard?.resetKeys();};
const cards=new CollectibleCards({key:recordKey.endsWith('-qa')?'street-bogota-cards-qa':'street-bogota-cards-v1',onOpen:()=>{flushCombatInput();game.touchControls.reset();}});
const collectionButton=document.createElement('button');
collectionButton.type='button';collectionButton.id='collection-open';collectionButton.textContent='MIS TARJETAS';
collectionButton.addEventListener('click',()=>cards.open());
document.querySelector('.selection-heading')?.insertBefore(collectionButton,document.querySelector('#back'));
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
function showScreen(next, introMusic=false) {
  screen = next;
  game.menuMusic?.setPaused(!introMusic && !['menu','selection','combos'].includes(next));
  document.documentElement.dataset.screen=next;
  game.touchControls.setEnabled(next==='game');
  selection.hidden = next !== 'selection';
  if(next!=='menu')mainMenu?.close();
  if(next!=='combos' && combosScreen?.isOpen){combosScreen.root.hidden=true;}
  resultModal.hidden=true;
  document.querySelector('#game').inert = false;
  document.querySelector('.toolbar').inert = next !== 'game';
}
function pick(key) {
  selected = key;
  document.querySelectorAll('[data-pick]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pick === key)));
  palettePicker?.refresh();
  selectScreen?.show(key);
}
// TEST LEVEL SELECTOR: lets you start any level from the character screen.
// Set LEVEL_SELECT to false to remove it (the game then always continues from the campaign's current level).
const LEVEL_SELECT = false; // replaced by ELEGIR NIVEL in the main menu
const levelPicker=import.meta.env.DEV && LEVEL_SELECT?createLevelPicker():null;
// The aura battle is only reached through the campaign (level 11, Gran Estación); ?auraTest opens it in development.
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
  // Every level card is preceded by the trip across the Bogotá map (MapScene emits intro-complete with kind 'map').
  if(data.kind==='level' && !data.fromMap)return startMap(data);
  if(['boss','ending','credits'].includes(data.kind))game.scene.pause('Street');
  else game.scene.stop('Street');
  game.scene.stop('Menu');game.scene.stop('CharacterIntro');
  showScreen('intro',['game','story','character'].includes(data.kind));
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
  selectScreen.confirm(startChosen);
}
function startChosen(){
  if(playMode==='survival')return startSurvival();
  if(stageChoice!=null){
    const choice=String(stageChoice);stageChoice=null;
    if(choice==='bonus:chiva' || choice==='bonus:ring'){
      const ring=choice==='bonus:ring',bonus=ring?RING_BONUS:CHIVA_BONUS;
      game.run.advance(bonus.afterLevel);
      if(ring){secretRingResult={won:true,last:true,score:game.run.score,character:characters[selected].name};startRingBonus({character:selected,level:bonus.afterLevel});}
      else startChivaBonus({character:selected,level:bonus.afterLevel+1});
      return;
    }
    const level=Number(choice);if(level!==game.run.level)game.run.advance(level);
  }
  // Character story screen first; confirming it continues to the level intro.
  const begin=()=>startIntro({kind:'character',character:selected,level:game.run.level});
  // Desktop: show the keys for the chosen fighter first and wait for ENTER (touch players see on-screen buttons).
  if(document.documentElement.classList.contains('is-mobile'))return begin();
  controlsScreen.show(selected,{portrait:document.querySelector(`[data-portrait="${selected}"]`)?.src||null,onDone:begin,
    onBack:()=>document.querySelector(`[data-pick="${selected}"]`)?.focus()});
}
const controlsScreen=new ControlsScreen(document.querySelector('#controls-screen'));
function startAuraBattle(){
  showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');game.scene.stop('CharacterIntro');
  game.scene.start('Street',{character:selected,level:game.run.level,auraBattle:true,run:game.run});focusGame();
}
game.events.on('aura-exit',()=>{
  game.scene.stop('Street');returnToStreet=false;
  showScreen('selection');if(levelPicker)levelPicker.hidden=false;
  pick(selected);document.querySelector(`[data-pick="${selected}"]`).focus();
});
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
  game.run.reset();returnToStreet=false;lastResult=null;secretRingResult=null;openMainMenu();
  levelLabel.textContent=`01 / ${levels[0].name.toUpperCase()}`;
}
function selectionBack(){if(returnToStreet)resumeStreet();else openMainMenu();}
const rankingForm=document.querySelector('#ranking-entry'),initialsInput=document.querySelector('#initials'),rankingList=document.querySelector('#ranking-list');
let pendingRanking=null,rankingRequest=0;
const leaderboard=createLeaderboard();game.leaderboard=leaderboard;
// Online save: niveles pasados, tarjetas, colores y récord de supervivencia (src/game/Progress.js).
var cloud=new CloudSave({leaderboard,storage:safeStorage,slots:createProgressSlots({cardsKey:cards.key}),
  onStatus:()=>{if(account?.isOpen)account.render();},
  onChange:changed=>{
    const st=loadPaletteState(safeStorage);game.paletteState.unlocked=st.unlocked;game.paletteState.selected=st.selected;palettePicker.refresh();
    if(screen==='menu' && !menuRoot.hidden)mainMenu.render();
    toast(`AVANCE RECUPERADO DE LA NUBE · ${changed.map(name=>({levels:'NIVELES',cards:'TARJETAS',palettes:'COLORES',survival:'SUPERVIVENCIA'})[name]??name.toUpperCase()).join(' · ')}`);
  }});
game.cloudSave=cloud;
var account=new AccountPanel({cloud,onOpen:()=>{flushCombatInput();game.touchControls.reset();}});
cards.saveNote=()=>cloud.username && leaderboard.enabled?`Colección guardada en la nube como ${cloud.username}.`:'Colección guardada en este navegador. En MI CUENTA puedes guardarla en la nube.';
cloud.sync();
const rankingStatus=document.querySelector('#ranking-status'),achievementUnlocks=document.querySelector('#achievement-unlocks'),rankingSave=document.querySelector('#ranking-save');
const characterName=key=>characters[key]?.name??key??'';
function setStatus(element,text,tone='ok'){element.textContent=text??'';element.dataset.tone=tone;element.hidden=!text;}
/** Online rows → the shape renderRanking uses. */
const onlineEntries=rows=>rows.map(row=>({initials:row.username,character:characterName(row.fighter),level:row.level_reached,score:row.score,title:row.title}));
const mineIn=(rows,username)=>username?rows.findIndex(row=>row.username?.toLowerCase()===username.toLowerCase()):-1;
// Phaser captures W/A/S/D/H/J/K/L/P/R…; release them while the player types initials.
function setTyping(typing){const keyboard=game.scene.getScene('Street')?.input?.keyboard;if(typing)keyboard?.disableGlobalCapture?.();else keyboard?.enableGlobalCapture?.();}
function renderRanking(ranking,mine=-1,list=rankingList) {
  list.replaceChildren(...(ranking.length?ranking.map((entry,index)=>{
    const row=document.createElement('li');if(index===mine)row.className='mine';
    for(const [cls,text] of [['initials',entry.initials],['who',`${entry.character??''}${entry.level?` · NIVEL ${entry.level}`:''}`],['points',entry.score]]){
      const cell=document.createElement('span');cell.className=cls;cell.textContent=text;row.append(cell);
    }
    return row;
  }):[Object.assign(document.createElement('li'),{className:'empty',textContent:'AÚN NO HAY PUNTAJES'})]));
  list.hidden=false;
}
/** Online top 10 into the result list (falls back silently to the local list already shown). */
async function showOnlineTop(request,username){
  if(!leaderboard.enabled)return;
  try{const rows=await leaderboard.top('all',10);if(request===rankingRequest)renderRanking(onlineEntries(rows),mineIn(rows,username));}catch{/* keep the local list */}
}
function showUnlocks(unlocked){
  achievementUnlocks.replaceChildren(...(unlocked??[]).map(item=>{
    const li=document.createElement('li');li.title=item.description;
    li.append(`${item.icon} ${item.title} `,Object.assign(document.createElement('b'),{textContent:`+${item.points} XP`}));return li;
  }));
  achievementUnlocks.hidden=!unlocked?.length;
}
/** Game over / final victory: ask for a username to register the score online (local top 10 when offline). */
function offerRanking(score,character,level,focusAfter,{won=false}={}) {
  const ranking=loadRanking(undefined,rankingKey),request=++rankingRequest,username=leaderboard.profile.username;
  setStatus(rankingStatus,'');showUnlocks([]);
  const characterKey=game.scene.getScene('Street')?.characterKey;
  if(score>0 && (leaderboard.enabled || qualifiesForRanking(score,ranking))){
    pendingRanking={request,score,character,characterKey,level,won,continues:game.run.continuesUsed,focusAfter};
    document.querySelector('#ranking-label').textContent=leaderboard.enabled?(username?`REGISTRA TU RÉCORD COMO ${username}`:'REGISTRA TU RÉCORD · ESCRIBE TU USUARIO'):'¡ENTRASTE AL RANKING LOCAL! ESCRIBE TU USUARIO';
    rankingForm.hidden=false;initialsInput.value=username;rankingSave.disabled=false;
    renderRanking(ranking);setTyping(true);setTimeout(()=>{initialsInput.focus();initialsInput.select();},0);
  } else {pendingRanking=null;renderRanking(ranking);focusAfter?.focus();}
  showOnlineTop(request,username);
}
function keepLocally(entry,username){
  const {ranking,position}=addToRanking({initials:username,score:entry.score,character:entry.character,level:entry.level},undefined,rankingKey);
  renderRanking(ranking,position);return position;
}
async function submitRanking() {
  const entry=pendingRanking;if(!entry || rankingSave.disabled)return;
  const username=cleanUsername(initialsInput.value);
  if(!validUsername(username)){setStatus(rankingStatus,LEADERBOARD_ERRORS.invalid_username,'error');initialsInput.focus();return;}
  const finish=()=>{pendingRanking=null;rankingForm.hidden=true;setTyping(false);entry.focusAfter?.focus();};
  if(!leaderboard.enabled){keepLocally(entry,username);setStatus(rankingStatus,LEADERBOARD_ERRORS.disabled,'warn');finish();return;}
  rankingSave.disabled=true;setStatus(rankingStatus,'GUARDANDO EN EL RANKING…');
  try{
    const result=await leaderboard.submit({username,score:entry.score,character:entry.characterKey,level:entry.level,won:entry.won,continues:entry.continues});
    if(entry.request!==rankingRequest)return; // the result screen was closed meanwhile
    keepLocally(entry,result.username);finish();cloud.schedule();
    setStatus(rankingStatus,`#${result.rank} EN BOGOTÁ${result.new_best?' · ¡NUEVO RÉCORD PERSONAL!':''} · +${result.xp_gained} XP · NIVEL ${result.level} · ${String(result.title).toUpperCase()}`);
    showUnlocks(result.unlocked);showOnlineTop(entry.request,result.username);
  }catch(error){
    if(entry.request!==rankingRequest)return;
    const problem=error instanceof LeaderboardError?error:new LeaderboardError('server');
    if(problem.recoverable){setStatus(rankingStatus,problem.text,'error');rankingSave.disabled=false;initialsInput.focus();initialsInput.select();return;}
    leaderboard.rememberUsername(username);keepLocally(entry,username);setStatus(rankingStatus,problem.text,'warn');finish();
  }finally{if(entry.request===rankingRequest && pendingRanking)rankingSave.disabled=false;}
}
rankingForm.addEventListener('submit',event=>{event.preventDefault();submitRanking();});
initialsInput.addEventListener('input',()=>{const clean=cleanUsername(initialsInput.value);if(clean!==initialsInput.value)initialsInput.value=clean;if(rankingStatus.dataset.tone==='error')setStatus(rankingStatus,'');});

// ── Ranking board (selection screen): global / weekly top and the player's level and achievements ──
const board=document.querySelector('#ranking-board'),boardList=document.querySelector('#board-list'),boardStatus=document.querySelector('#board-status'),boardProfile=document.querySelector('#board-profile');
let boardPeriod='all',boardReturnFocus=null,boardRequest=0;
async function loadBoard(period=boardPeriod){
  boardPeriod=period;const request=++boardRequest,username=leaderboard.profile.username;
  board.querySelectorAll('[data-period]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.period===period)));
  if(!leaderboard.enabled){
    setStatus(boardStatus,'RANKING ONLINE NO CONFIGURADO · MOSTRANDO ESTE EQUIPO','warn');renderRanking(loadRanking(undefined,rankingKey),-1,boardList);renderProfile(null,username);return;
  }
  setStatus(boardStatus,'CARGANDO…');
  try{
    const rows=await leaderboard.top(period,10);if(request!==boardRequest)return;
    setStatus(boardStatus,period==='week'?'MEJOR PUNTAJE DE CADA JUGADOR · ÚLTIMOS 7 DÍAS':'MEJOR PUNTAJE DE CADA JUGADOR');renderRanking(onlineEntries(rows),mineIn(rows,username),boardList);
  }catch(error){
    if(request!==boardRequest)return;
    setStatus(boardStatus,(error instanceof LeaderboardError?error:new LeaderboardError('server')).text,'warn');renderRanking(loadRanking(undefined,rankingKey),-1,boardList);
  }
  let player=null;
  if(username)try{player=await leaderboard.player(username);}catch{player=null;}
  if(request===boardRequest)renderProfile(player,username);
}
function renderProfile(player,username){
  boardProfile.replaceChildren();
  const add=(tag,props={})=>{const el=Object.assign(document.createElement(tag),props);boardProfile.append(el);return el;};
  add('p',{className:'eyebrow',textContent:'TU PERFIL'});
  if(!player){
    add('h3',{textContent:username||'SIN USUARIO'});
    add('p',{textContent:username?'Aún no hay partidas registradas online con este usuario.':'Al terminar una partida escribe tu usuario: sumas XP, subes de nivel y desbloqueas logros.'});
    return;
  }
  add('h3',{textContent:player.username});
  add('p',{className:'rank-title',textContent:`NIVEL ${player.level} · ${String(player.title).toUpperCase()} · PUESTO #${player.rank}`});
  const span=Math.max(1,player.next_level_xp-player.level_xp),bar=add('div',{className:'xp-bar'});
  bar.append(Object.assign(document.createElement('i'),{style:`width:${Math.min(100,Math.round((player.xp-player.level_xp)*100/span))}%`}));
  add('p',{textContent:`${player.xp} XP · ${Math.max(0,player.next_level_xp-player.xp)} PARA EL NIVEL ${player.level+1}`});
  const stats=add('div',{className:'board-stats'});
  for(const [label,value] of [['RÉCORD',player.best_score],['PARTIDAS',player.runs],['VICTORIAS',player.wins]])stats.append(Object.assign(document.createElement('span'),{innerHTML:`<b>${Number(value)||0}</b>${label}`}));
  const achievements=player.achievements??[],done=achievements.filter(item=>item.unlocked_at).length;
  add('p',{className:'eyebrow',textContent:`LOGROS ${done}/${achievements.length}`});
  const grid=add('ul',{className:'achievement-grid'});
  for(const item of achievements){
    const li=document.createElement('li');if(item.unlocked_at)li.className='unlocked';
    li.append(Object.assign(document.createElement('strong'),{textContent:`${item.icon} ${item.title}`}),Object.assign(document.createElement('small'),{textContent:`${item.description} · +${item.points} XP`}));
    grid.append(li);
  }
}
function openBoard(){boardReturnFocus=document.activeElement;board.hidden=false;document.querySelector('#board-close').focus();loadBoard('all');}
function closeBoard(){board.hidden=true;boardRequest++;boardReturnFocus?.focus?.();}
document.querySelector('#ranking-open').addEventListener('click',()=>{playUiSound('button');openBoard();});
document.querySelector('#board-close').addEventListener('click',closeBoard);
board.querySelectorAll('[data-period]').forEach(tab=>tab.addEventListener('click',()=>loadBoard(tab.dataset.period)));
board.addEventListener('click',event=>{if(event.target===board)closeBoard();});
function resetResultButtons() {
  for(const id of ['next-level','retry','result-choose','continue-run','new-game'])document.getElementById(id).hidden=true;
  document.querySelector('#continue-count').hidden=true;
  rankingForm.hidden=true;rankingList.hidden=true;if(pendingRanking){pendingRanking=null;setTyping(false);}
  rankingRequest++;setStatus(rankingStatus,'');showUnlocks([]);
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
  document.querySelector('#result-title').textContent=result.monserrate?'¡LLEGASTE A LA CIMA!':result.aura?'¡BATALLA DE AURA GANADA!':result.cycling?'¡CICLOVÍA COMPLETADA!':last?'BOGOTÁ DESPEJADA':'CUADRA DESPEJADA';
  document.querySelector('#result-description').textContent=result.monserrate?`Superaste el ascenso a Monserrate. Sigue ${nextName(result)}.`:result.aura?'El Gordo del Aura se rindió. El público está contigo.':result.cycling?`Llegaste a la meta. Sigue ${nextName(result)}.`:last?'Sobreviviste a la pelea por Bogotá.':'La siguiente cuadra te espera.';
  let text=`${character} · ${score} PUNTOS`;
  if(last){const record=saveRecord(score,character,undefined,recordKey);text+=` · RÉCORD ${record.score} — ${record.character}`;}
  document.querySelector('#result-score').textContent=text;
  const next=document.querySelector('#next-level');next.hidden=last;next.disabled=last;next.textContent='SIGUIENTE NIVEL · ENTER';
  document.querySelector('#retry').hidden=last;document.querySelector('#retry').classList.remove('primary');
  document.querySelector('#new-game').hidden=!last;document.querySelector('#result-choose').hidden=last;
  openResult();document.querySelector(last?'#new-game':'#next-level').focus();
  if(last)offerRanking(score,character,levels.length,document.querySelector('#new-game'),{won});
}

/** Name of the level after the one just cleared (results only know the scene's current level). */
function nextName(){const s=game.scene.getScene('Street'),next=levels[(s?.levelIndex??0)+1];return next?next.name.replace(' · ',' — '):'la aventura';}
// Secret ring: Zona Rosa cleared with zero continues opens "El ring de los traques" before the ending.
let secretRingResult=null;
function showBonusResult(result){
  lastResult=result;resetResultButtons();
  const s=game.scene.getScene('Street');s.input.keyboard.resetKeys();
  document.querySelector('#result-title').textContent=result.kind==='ring'?(result.won?'¡LOS CUATRO A LA LONA!':result.reason==='timeout'?'TIEMPO AGOTADO':'PLAYER A LA LONA'):(result.won?'¡CHIVA DESTRUIDA!':'TIEMPO AGOTADO');
  document.querySelector('#result-description').textContent=result.kind==='ring'?(result.won?'¡Ganaste el ring! +10.000 puntos.':`${result.defeated}/4 rivales vencidos. ${secretRingResult?'Ahora sí, el final.':'La campaña continúa.'}`):result.won?'Bonus perfecto: 5000 puntos. ¡Coste no lo puede creer!':`${result.hits} golpes × 100 puntos. La campaña continúa.`;
  document.querySelector('#result-score').textContent=`+${result.points} BONUS · ${result.score} PUNTOS TOTALES`;
  const next=document.querySelector('#next-level');next.hidden=false;next.disabled=false;
  next.textContent=secretRingResult?'VER EL FINAL · ENTER':'SIGUIENTE NIVEL · ENTER';
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
  const street=game.scene.getScene('Street');
  if(street?.isSurvival){
    resetResultButtons();const wave=street.survival?.wave??1,name=street.character.name;
    const {record,isNew}=saveSurvivalRecord({wave,score:game.run.score,character:name},safeStorage);if(isNew)cloud.schedule();
    document.querySelector('#result-title').textContent=isNew?'¡NUEVO RÉCORD!':'FIN DEL TRANCÓN';
    document.querySelector('#result-description').textContent=`Aguantaste hasta la oleada ${wave} con ${street.defeated} rivales derrotados.`;
    document.querySelector('#result-score').textContent=`${name} · ${game.run.score} PUNTOS · RÉCORD: OLEADA ${record.wave} · ${record.score} — ${record.character}`;
    document.querySelector('#new-game').hidden=false;openResult('gameover');document.querySelector('#new-game').focus();return;
  }
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
  } else if(data.kind==='story' && data.showTitle) {
    startIntro({kind:'game',afterComic:true,hardCut:true});
  } else if(data.kind==='game') {
    if(data.afterComic)openMainMenu();
    else startComic();
  } else if(data.kind==='boss') {
    game.scene.resume('Street');game.scene.getScene('Street').resumeBoss();showScreen('game');focusGame();
  } else if(data.kind==='map') {
    startIntro({...data,kind:'level',fromMap:true});
  } else if(data.kind==='level') {
    showScreen('game');game.scene.start('Street',{character:data.character,level:data.level,run:game.run});focusGame();
  } else openMainMenu();
});
function startComic(){
  game.scene.stop('Intro');game.scene.stop('Menu');game.scene.stop('CharacterIntro');
  showScreen('intro',true);game.scene.start('Comic');game.scene.bringToTop('Comic');focusGame();
}
function startMap(data){
  game.scene.stop('Street');game.scene.stop('Menu');game.scene.stop('CharacterIntro');game.scene.stop('Intro');
  showScreen('intro');document.querySelector('#next-level').disabled=true;
  levelLabel.textContent=`${String(data.level+1).padStart(2,'0')} / ${levels[data.level].name.toUpperCase()}`;
  game.scene.start('Map',data);game.scene.bringToTop('Map');focusGame();
}
function startChivaBonus(data){
  game.run.chivaBonusPlayed=true;showScreen('game');game.scene.stop('Intro');game.scene.stop('Menu');
  game.scene.start('Street',{character:data.character,level:CHIVA_BONUS.afterLevel,chivaBonus:true,returnLevel:data.level,run:game.run});focusGame();
}
function startSecretRing(result){
  secretRingResult=result;
  startRingBonus({character:game.scene.getScene('Street').characterKey,level:RING_BONUS.afterLevel});
}
function startRingBonus(data){
  game.run.ringBonusPlayed=true;showScreen('game');game.scene.stop('Intro');game.scene.stop('Menu');
  game.scene.start('Street',{character:data.character,level:RING_BONUS.afterLevel,ringBonus:true,returnLevel:data.level,run:game.run});focusGame();
}
game.events.on('level-transition',data=>{
  if(secretRingResult){ // after the secret ring: the ending with the final score (ring points included)
    const result={...secretRingResult,score:game.run.score};secretRingResult=null;
    startIntro({kind:'ending',character:data.character,result});return;
  }
  if(shouldStartChivaBonus(data.level,game.run))startChivaBonus(data);
  else if(shouldStartRingBonus(data.level,game.run))startRingBonus(data);
  else startIntro({...data,kind:'level'});
});
game.events.on('boss-intro',data=>startIntro({...data,kind:'boss'}));
// Loader while a level downloads and builds; hidden again when the level starts.
const levelLoader=new LevelLoader(document.querySelector('#level-loader'));
game.events.on('level-loading',data=>levelLoader.start({...data,portrait:document.querySelector(`[data-portrait="${data.character}"]`)?.src||null}));
game.events.on('level-load-progress',value=>levelLoader.progress(value));
game.events.on('level-load-error',file=>levelLoader.fail(file));
game.events.on('level-start',()=>levelLoader.finish());
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
  if(debugParams.has('menuPreview'))game.events.once('menu-ready',openMainMenu);
  if(debugParams.has('monserrateTest'))game.events.once('menu-ready',()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    if(debugParams.has('monserrateRewardTest'))game.events.once('level-start',()=>{
      const stage=game.scene.getScene('Street').monserrate;
      stage.run.distance=MONSERRATE.length;stage.run.elapsed=5000;
      stage.run.crashes=debugParams.get('monserrateRewardTest')==='crash'?1:0;stage.finish();
    });
    // Development art review: freeze at a real point on the course, then P resumes.
    if(debugParams.has('monserratePreview'))game.events.once('level-start',()=>{
      const stage=game.scene.getScene('Street').monserrate;
      const at=Number(debugParams.get('monserratePreview'));
      if(stage && Number.isFinite(at)){
        stage.run.distance=Math.max(0,Math.min(420,at));stage.run.elapsed=5000;stage.run.nextWave=6500;
        stage.setPaused(true,false);stage.render();
      }
    });
    game.scene.start('Street',{character:selected,level:levels.findIndex(l=>l.mode==='monserrate')});focusGame();
  });
  if(debugParams.has('auraTest'))game.events.once('menu-ready',()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    startAuraBattle();
  });
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
    if(debugParams.get('bonusTest')==='ring'){secretRingResult={won:true,last:true,score:0,character:characters[selected].name};startRingBonus({character:selected,level:RING_BONUS.afterLevel});const {installRingPreview}=await import('./debug/ringPreview.js');installRingPreview(game);return;}
    startChivaBonus({character:selected,level:CHIVA_BONUS.afterLevel+1});
    const {installChivaPreview}=await import('./debug/chivaPreview.js');installChivaPreview(game);
  });
  if(debugParams.has('enemyTest') || debugParams.has('combatPreview'))game.events.once('menu-ready',async()=>{
    const {installCombatPreview}=await import('./debug/combatPreview.js');installCombatPreview(game);
  });
  const enemyTest=debugParams.get('enemyTest');
  if(enemies[enemyTest]?.combo || enemies[enemyTest]?.charge || enemies[enemyTest]?.shieldBreak || enemies[enemyTest]?.brayatan || enemies[enemyTest]?.pacho || enemies[enemyTest]?.leap || enemies[enemyTest]?.juggler || enemies[enemyTest]?.paint || enemies[enemyTest]?.throw?.fruit || enemies[enemyTest]?.diablito || enemies[enemyTest]?.pollero || enemies[enemyTest]?.papero || enemies[enemyTest]?.reversa || enemies[enemyTest]?.ortencio || enemies[enemyTest]?.callReinforcements)game.events.once('menu-ready',async()=>{
    selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
    showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
    const testArt=['frutatiana','don_diablo','don_pico','papero','reversa'].includes(enemyTest)?(await import('./data/palomojao.js')).PALOMOJAO_ART:null;
    game.scene.start('Street',{character:selected,level:campaignIndexForCombat(['jugo','ortencio','agente_pare'].includes(enemyTest)?8:testArt?7:enemies[enemyTest].mime?1:enemies[enemyTest].leap?5:enemies[enemyTest].pacho?6:enemies[enemyTest].brayatan?5:enemies[enemyTest].shieldBreak?4:2),enemyTest,testArt});focusGame();
  });
  if(debugParams.has('campaignPreview'))game.events.once('menu-ready',async()=>{
    const {installCampaignPreview}=await import('./debug/campaignPreview.js');installCampaignPreview(game);
    if(['palomojao','dorado','andino','chorro','plaza','taxis','panela','vuvuzela','super'].includes(debugParams.get('campaignPreview'))){
      selected=characters[debugParams.get('character')]?debugParams.get('character'):'office';
      showScreen('game');game.scene.stop('Menu');game.scene.stop('Intro');
      game.events.once('level-start',()=>{
        const s=game.scene.getScene('Street');
        if(debugParams.get('campaignPreview')==='taxis'){
          for(const enemy of s.enemies)if(enemy.hp>0)s.hitEnemy(enemy,{damage:99999,knockback:0,facing:1});
          Object.assign(s.waves,{spawned:15,wave:6,arena:2,arenaWave:2,waiting:false});s.defeated=15;
          s.stage.jumpToArena(2);s.invulnerableUntil=0;s.waves.update();s.updateCounter();
        }else {
          s.invulnerableUntil=Infinity;
          if(debugParams.get('campaignPreview')==='super'){
            s.superPower.charge=SUPER.hits;s.superPower.showCharge();
            s.enemies.forEach((enemy,i)=>{enemy.x=600+i*130;enemy.y=450;enemy.config={...enemy.config,speed:0};});
          }
          if(['panela','vuvuzela'].includes(debugParams.get('campaignPreview'))){
            s.debugPreview=true;(s.panela??s.vuvuzela)?.equip();
            s.enemies.forEach((enemy,i)=>{enemy.x=600+i*130;enemy.y=450;});
          }
        }
      });
      const previewCombat={palomojao:7,dorado:8,andino:6,chorro:4,plaza:1,taxis:8,panela:1,vuvuzela:0,super:2}[debugParams.get('campaignPreview')];
      game.scene.start('Street',{character:selected,level:campaignIndexForCombat(previewCombat)});focusGame();
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
  if(cards.isOpen || account.isOpen)return;
  if(event.target===collectionButton && ['Enter',' '].includes(event.key))return;
  if(event.target===initialsInput)return; // typing initials: Enter submits the form, letters are not shortcuts
  if(controlsScreen.handleKey(event))return; // controls screen: ENTER plays, ESC goes back
  if(!board.hidden){if(event.key==='Escape'){event.preventDefault();closeBoard();}return;} // the ranking board owns the keyboard
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
  if (screen === 'combos') { if(combosScreen.handleKey(event) && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))playUiSound('button'); return; }
  if (screen === 'menu') { const did=mainMenu.handleKey(event); if(did)playUiSound(did==='choose'?'start':'button'); return; }
  if (screen === 'game' || event.repeat) return;
  if (screen === 'selection') {
    if (event.target.closest?.('.level-picker')) return; // arrows/Enter belong to the level dropdown
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const roster = Object.keys(characters), step = event.key === 'ArrowRight' ? 1 : -1;
      pick(roster[(roster.indexOf(selected) + step + roster.length) % roster.length]);
      document.querySelector(`[data-pick="${selected}"]`).focus();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();palettePicker.cycle(event.key === 'ArrowDown' ? 1 : -1);playUiSound('button');
    } else if (event.key === 'Enter' && document.activeElement.id !== 'back') { event.preventDefault(); playUiSound('start');play(); }
    else if (event.key === 'Escape') selectionBack();
  }
});
game.events.on('level-start', (index) => {
  const cycling=levels[index].mode==='cycling';
  document.querySelector('#game').setAttribute('aria-label',levels[index].mode==='monserrate'?'Ascenso a Monserrate: corres automáticamente. Izquierda y derecha o A y D para esquivar caminantes, Shift o espacio para un dash de velocidad. Chocar quita vida. P pausa y R reinicia.':cycling?'Juego: pedaleo automático en bicicleta. Flechas arriba y abajo o W y S para esquivar. Shift activa dash durante 3 segundos, con 5 segundos de recarga. P pausa y R reiniciar.':combatControlsDescription);
  game.touchControls.setCharacter(game.scene.getScene('Street').characterKey);
  game.touchControls.setEnabled(true);
  resultModal.hidden=true;document.querySelector('.toolbar').inert=false;
  document.querySelector('#choose').disabled = false;
  document.querySelectorAll('[data-character], #restart').forEach((button) => { button.disabled = false; });
  const street=game.scene.getScene('Street'),bonus=street.isChivaBonus || street.isRingBonus;
  levelLabel.textContent=bonus?(street.isRingBonus?'BONUS / EL RING':'BONUS / LA CHIVA'):`${String(index+1).padStart(2,'0')} / ${game.scene.getScene('Street').level.name.toUpperCase()}`;
  if(street.isAura){
    levelLabel.textContent=street.isAuraExhibition?'AURA / GRAN ESTACIÓN':`${String(index+1).padStart(2,'0')} / GRAN ESTACIÓN · AURA`;
    document.querySelector('#game').setAttribute('aria-label','Batalla de aura: camina con las flechas hasta el círculo. El Gordo del Aura muestra una secuencia; repítela con flechas o WASD, H puño y J patada, o con los botones de abajo, antes de que se acabe el tiempo. P pausa, R reinicia.');
  }
  document.querySelector('#restart').disabled=bonus;
  document.querySelector('#next-level').disabled = true;
});
game.events.on('level-clear', (index) => {
  document.querySelector('#next-level').disabled = index >= levels.length - 1;
});
// The final victory plays the character ending and credits before saving scores or offering initials.
game.events.on('level-result',result=>{
  const scene=game.scene.getScene('Street');
  if(result.won && result.collectible){cards.open({reward:true,cardId:result.collectible,onClose:()=>showResult(result)});cloud.schedule();return;}
  if(shouldStartSecretRing(result,game.run)){startSecretRing(result);return;}
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
