import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {existsSync} from 'node:fs';
import {SoundEffects,EFFECT_FILES,preloadEffects,enemyDeathSound,PLAYER_DEATH_SOUNDS,PLAYER_HURT_SOUNDS,PLAYER_POWER_SOUNDS,playPowerSound,ENEMY_HURT_SOUNDS,ENEMY_SPAWN_SOUNDS,BOSS_SOUNDS,DEATH_SOUNDS} from '../src/audio/SoundEffects.js';

test('Frutatiana uses her dedicated hurt and death recordings',()=>{
  assert.equal(EFFECT_FILES[ENEMY_HURT_SOUNDS.frutatiana],'frutatiana_hurt.mp3');
  assert.equal(EFFECT_FILES[DEATH_SOUNDS.frutatiana],'frutatiana_die.mp3');
});

test('sack carrier, Motorata, guitarist, leash and belly use their requested hurt/death recordings',()=>{
  for(const [key,hurt,death] of [['don_pico','hurt2.mp3','enemy_10_die.mp3'],['homeless','male_grunt4.mp3','homeless_die.mp3'],['motorata','male_grunt4.mp3','motorata_die.mp3'],['guitarist','hurt_01.mp3','guitarista_die.mp3'],['malabarista','hurt_03.mp3','malabarista_die.mp3']]){
    assert.equal(EFFECT_FILES[ENEMY_HURT_SOUNDS[key]],hurt);assert.equal(EFFECT_FILES[DEATH_SOUNDS[key]],death);
  }
  assert.equal(EFFECT_FILES[DEATH_SOUNDS.leash],'enemy_11_die.mp3');
  assert.equal(EFFECT_FILES[DEATH_SOUNDS.belly],'enemy_10_die.mp3');
  assert.equal(EFFECT_FILES[BOSS_SOUNDS.pacho.hurt],'gruntsound.mp3');
  assert.equal(EFFECT_FILES[DEATH_SOUNDS.pacho],'traqueto_die.mp3');
  assert.equal(EFFECT_FILES[ENEMY_SPAWN_SOUNDS.rat],'rat.ogg');
  assert.equal(EFFECT_FILES[ENEMY_SPAWN_SOUNDS.motorata],'motorata_entry.mp3');
  assert.equal(EFFECT_FILES[ENEMY_SPAWN_SOUNDS.guard],'policia_appear.mp3');
});

test('each player has its own death sound and player_2 grunts when hit',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(PLAYER_DEATH_SOUNDS).map(([k,v])=>[k,EFFECT_FILES[v]])),
    {office:'player_1_die.mp3',student:'player_2_die.mp3',teleperforman:'player_3_die.mp3',gymbro:'player_4_die.mp3',magolita:'player_die_5.mp3'});
  assert.equal(EFFECT_FILES[PLAYER_HURT_SOUNDS.student],'player_2_grunt.wav');assert.equal(EFFECT_FILES[PLAYER_HURT_SOUNDS.magolita],'female_grunt.mp3');assert.equal(EFFECT_FILES[PLAYER_HURT_SOUNDS.gymbro],'player_4_grunt.mp3');
  assert.equal(EFFECT_FILES[PLAYER_HURT_SOUNDS.office],'gruntsound.mp3');
});

test('each player shouts its own power_player_N sound when launching the special',()=>{
  const keys=['office','student','teleperforman','gymbro','magolita'];
  assert.deepEqual(keys.map(k=>EFFECT_FILES[PLAYER_POWER_SOUNDS[k]]),keys.map((_,i)=>`power_player_${i+1}.mp3`));
  const calls=[];playPowerSound({characterKey:'gymbro',sfx:{play:n=>calls.push(n)}});assert.deepEqual(calls,['power4']);
});

function setup(locked=false) {
  const manager=new EventEmitter(),sounds=[];manager.locked=locked;
  manager.add=(key,config)=>{
    const sound=new EventEmitter();Object.assign(sound,{key,config,isPlaying:false,isPaused:false,
      play(){this.isPlaying=true;return true;},pause(){this.isPlaying=false;this.isPaused=true;},
      resume(){this.isPlaying=true;this.isPaused=false;},stop(){this.isPlaying=false;},
      destroy(){this.destroyed=true;this.removeAllListeners();}});
    sounds.push(sound);return sound;
  };
  const effects=new SoundEffects(manager,{exists:()=>true});return {manager,sounds,effects};
}
test('all effects reference existing assets, including the WAV death sounds and the whoosh',()=>{
  const loaded=[];preloadEffects({cache:{audio:{exists:()=>false}},load:{audio:(key,url)=>loaded.push([key,url])}});
  assert.equal(loaded.length,Object.keys(EFFECT_FILES).length);
  for(const file of Object.values(EFFECT_FILES))assert.ok(existsSync(new URL(`../public/assets/sounds/${file}`,import.meta.url)),file);
  assert.deepEqual(loaded.find(([key])=>key==='sfx-hurt'),['sfx-hurt','/assets/sounds/hurt.mp3']);
  assert.deepEqual(loaded.find(([key])=>key==='sfx-whistle'),['sfx-whistle','/assets/sounds/whistle.mp3']);
});
test('death sounds alternate across scene changes',()=>{
  const game={},calls=[],sfx={play:name=>calls.push(name)};
  enemyDeathSound({game,sfx});enemyDeathSound({game,sfx});enemyDeathSound({game,sfx});
  assert.deepEqual(calls,['hurt','hurt2','hurt']);
});
test('locked combat sounds are discarded; only the latest UI gesture waits for unlock',()=>{
  const {manager,effects,sounds}=setup(true);
  effects.play('knife');effects.play('button',{waitForUnlock:true});effects.play('start',{waitForUnlock:true});
  assert.equal(sounds.length,0);manager.locked=false;manager.emit('unlocked');
  assert.deepEqual(sounds.map(s=>s.key),['sfx-start']);manager.emit('unlocked');assert.equal(sounds.length,1);
});
test('effects pause/resume, limit overlap and release completed sounds without touching music',()=>{
  const {effects,sounds}=setup();effects.play('moto');effects.play('moto');assert.equal(sounds.length,1);
  effects.setPaused(true);assert.equal(sounds[0].isPaused,true);assert.equal(effects.play('knife'),false);
  effects.setPaused(false);assert.equal(sounds[0].isPlaying,true);
  sounds[0].emit('complete');assert.equal(effects.active.size,0);assert.equal(sounds[0].destroyed,true);
  effects.play('moto');assert.equal(sounds.length,2);assert.equal(sounds[1].config.loop,false);
});
test('shutdown clears every owned sound and unlock callback; missing assets remain silent',()=>{
  const {effects,manager,sounds}=setup();effects.play('running');effects.destroy();
  assert.ok(sounds.every(s=>s.destroyed));assert.equal(manager.listenerCount('unlocked'),0);assert.equal(effects.play('lose'),false);
  const missing=new SoundEffects(manager,{exists:()=>false});assert.equal(missing.play('knife'),false);missing.destroy();
});
