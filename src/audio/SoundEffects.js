export const EFFECT_FILES={piernasEntry:'piernas_locas_appear.mp3',piernasHurt:'male_grunt.mp3',piernasDie:'piernas_locas_die.mp3',brincolasEntry:'brincolas_appear.mp3',brincolasHurt:'male_grunt.mp3',brincolasDie:'brincolas_die.mp3',minilajaEntry:'minilaja_appear.mp3',minilajaDie:'minilaja_die.mp3',ringBell:'ring_bell.wav',ringLaugh:'ring_laugh.wav',ringCry:'cristiano_hurt.wav',cristianoEntry:'cristiano_appear.wav',reversaHorn:'reversa_horn.wav',reverseBeep:'reversa_reverse.wav',reversaHornDie:'reversa_stop.wav',bossIntro:'boss_intro.wav',whistle:'whistle.mp3',knife:'knife.mp3',hurt:'hurt.mp3',hurt2:'hurt2.mp3',lose:'lose.mp3',bar:'bar.mp3',punch:'punch.mp3',kick:'kick.mp3',moto:'moto.mp3',running:'running.mp3',tambo:'tambo.mp3',start:'start.mp3',button:'button.mp3',whip:'whip.mp3',celuco:'celuco.mp3',stomp:'stomp.mp3',spell:'spell.mp3',
  frutatianaDie:'frutatiana_die.mp3',frutatianaHurt:'frutatiana_hurt.mp3',
  chicken:'chiken.mp3',
  wave:'wave.mp3',maleGrunt:'male_grunt.mp3',maleGrunt2:'male_grunt2.mp3',maleGrunt3:'male_grunt3.mp3',maleGrunt4:'male_grunt4.mp3',
  femaleGrunt:'female_grunt.mp3',metalCrack:'metal_crack.mp3',item:'item.mp3',punch2:'punch2.mp3',screeching:'screeching.mp3',femaleGrunt2:'female_grunt2.mp3',
  player1Die:'player_1_die.mp3',player2Die:'player_2_die.mp3',player3Die:'player_3_die.mp3',player4Die:'player_4_die.mp3',player5Die:'player_die_5.mp3',
  player2Grunt:'player_2_grunt.wav',player4Grunt:'player_4_grunt.mp3',enemy2Voice:'enemy_2_voice.mp3',femaleHurt:'female_grunt.mp3',maleHurt:'male_grunt.mp3',
  enemy11Attack:'enemy_11_attack.mp3',enemy12Attack:'enemy_12_attack.mp3',enemy3Die:'enemy_3_die.mp3',enemy10Die:'enemy_10_die.mp3',enemy1Die:'enemy_1_die.mp3',boss6Die:'enemy_boss_6_die.mp3',
  homelessDie:'homeless_die.mp3',motorataDie:'motorata_die.mp3',guitaristDie:'guitarista_die.mp3',enemy11Die:'enemy_11_die.mp3',
  gruntSound:'gruntsound.mp3',guitaristHurt:'hurt_01.mp3',malabaristaHurt:'hurt_03.mp3',malabaristaDie:'malabarista_die.mp3',
  ratEntry:'rat.ogg',motorataEntry:'motorata_entry.mp3',pachoDie:'traqueto_die.mp3',policeEntry:'policia_appear.mp3',fanEntry:'enemy_7_appear.mp3',
  boss1Attack:'enemy_boss_1_attack.mp3',boss2Attack:'enemy_boss_2_attack.mp3',boss2Hurt:'enemy_boss_2_hurt.mp3',boss3Attack:'enemy_boss_3_attack.mp3',
  boss4Attack:'enemy_boss_4_attack.mp3',boss5Attack:'enemy_boss_5_attack.mp3',boss6Attack:'enemy_boss_6_attack.mp3',power1:'power_player_1.mp3',power2:'power_player_2.mp3',power3:'power_player_3.mp3',power4:'power_player_4.mp3',power5:'power_player_5.mp3'};

// Sound when an enemy's strike becomes active (enemy_N.png → key in src/data/enemies.js).
// Sound when a charge starts its rush (enemy_9 vendor, enemy_10 belly). Any other charger uses running.
// enemy_2 (crossing moto courier) shouts once per pass, only when it rides by close to the player.
export const CROSSING_VOICE={sound:'enemy2Voice',range:200,depth:70};
// Level bosses (level 1 → 6): attack = voice when an attack starts (once per combo), throw = only for throws,
// hurt = grunt when hit (at most every BOSS_HURT_COOLDOWN ms so a combo doesn't stack grunts).
export const BOSS_SOUNDS={barra:{attack:'boss1Attack',hurt:'maleGrunt2'},palomera:{throw:'boss2Attack',hurt:'boss2Hurt'},
  grafitero:{attack:'boss3Attack',hurt:'maleGrunt2'},cabecilla:{attack:'boss4Attack',hurt:'maleGrunt4'},
  antidisturbios:{throw:'boss5Attack',hurt:'maleGrunt4'},brayatan:{hurt:'maleGrunt2'},dormilon:{attack:'boss6Attack',hurt:'maleGrunt4'},pacho:{hurt:'gruntSound'}};
export const BOSS_HURT_COOLDOWN=400;
export const CHARGE_SOUNDS={vendor:'screeching',belly:'running'};
export const chargeSound=key=>CHARGE_SOUNDS[key]??'running';
export const ENEMY_ATTACK_SOUNDS={don_pico:'bar',motorata:'knife',guitarist:'bar',malabarista:'wave',parlanchin:'kick',guard:'tambo',chain:'bar',sweeper:'bar',belly:'bar',leash:'whip',barra:'wave',palomera:'wave',grafitero:'wave',cabecilla:'wave',estudiante:'punch2',barrista:'bar',yulitza:'knife',walker:'punch2',brawler:'punch2',fan:'punch2'};

// Sound when a player character takes a hit (character key in src/data/characters.js; player_2 = student).
export const PLAYER_HURT_SOUNDS={office:'gruntSound',student:'player2Grunt',gymbro:'player4Grunt',magolita:'femaleGrunt'};
// Voice shout when a player character launches its special (player_N → power_player_N.mp3), on top of the special's own effect.
export const PLAYER_POWER_SOUNDS={office:'power1',student:'power2',teleperforman:'power3',gymbro:'power4',magolita:'power5'};
export const playPowerSound=scene=>{const name=PLAYER_POWER_SOUNDS[scene.characterKey];if(name)scene.sfx?.play(name);};
// Sound when a player character loses a life (player_N.png → character key).
export const PLAYER_DEATH_SOUNDS={office:'player1Die',student:'player2Die',teleperforman:'player3Die',gymbro:'player4Die',magolita:'player5Die'};

// Death sound per enemy (enemy_N.png → key in src/data/enemies.js). Others alternate hurt/hurt2.
// Regular enemies: grunt when hit (same cooldown as bosses) and a shout when they enter the fight.
export const ENEMY_HURT_SOUNDS={piernas_locas:'piernasHurt',brincolas_rataquieta:'brincolasHurt',minilaja:'maleGrunt',don_pico:'hurt2',frutatiana:'frutatianaHurt',homeless:'maleGrunt4',motorata:'maleGrunt4',guitarist:'guitaristHurt',malabarista:'malabaristaHurt',yulitza:'femaleHurt',leash:'femaleHurt',thrower:'maleHurt'};
export const ENEMY_SPAWN_SOUNDS={piernas_locas:'piernasEntry',brincolas_rataquieta:'brincolasEntry',minilaja:'minilajaEntry',cristiano_violencia:'cristianoEntry',yulitza:'enemy12Attack',leash:'enemy11Attack',rat:'ratEntry',motorata:'motorataEntry',guard:'policeEntry',fan:'fanEntry'};
export const DEATH_SOUNDS={piernas_locas:'piernasDie',brincolas_rataquieta:'brincolasDie',minilaja:'minilajaDie',don_pico:'enemy10Die',frutatiana:'frutatianaDie',homeless:'homelessDie',motorata:'motorataDie',guitarist:'guitaristDie',malabarista:'malabaristaDie',pacho:'pachoDie',brayatan:'boss6Die',yulitza:'femaleGrunt',palomera:'femaleGrunt',walker:'enemy1Die',belly:'enemy10Die',thrower:'enemy3Die',leash:'enemy11Die',guard:'maleGrunt4',sweeper:'maleGrunt3'};
/** Punches and kicks: impact sound when they connect, a whoosh when they miss. */
export const strikeSound=(type,connected)=>!connected?'wave':type==='punch'?'punch':'kick';

export function preloadEffects(scene) {
  for(const [name,file] of Object.entries(EFFECT_FILES))if(!scene.cache.audio.exists(`sfx-${name}`))scene.load.audio(`sfx-${name}`,`${import.meta.env?.BASE_URL??'/'}assets/sounds/${file}`);
}

// Each owner cleans up its own effects without interrupting the level music.
export class SoundEffects {
  constructor(manager,cache) {
    this.manager=manager;this.cache=cache;this.active=new Set();this.paused=false;this.destroyed=false;
    this.onUnlock=()=>{const name=this.pending;this.pending=null;if(name)this.play(name);};
    manager.on('unlocked',this.onUnlock);
    manager.on('audio-ready',this.onUnlock);
  }
  play(name,{waitForUnlock=false}={}) {
    const key=`sfx-${name}`;
    if(this.destroyed || this.paused || !EFFECT_FILES[name] || !this.cache.exists(key))return false;
    if(this.manager.locked || (this.manager.context && this.manager.context.state!=='running')){if(waitForUnlock)this.pending=name;return false;}
    const limit=['moto','running','screeching','lose'].includes(name)?1:3;
    if([...this.active].filter(sound=>sound.key===key).length>=limit)return false;
    const sound=this.manager.add(key,{volume:name==='button'?.45:.65,loop:false});
    this.active.add(sound);
    sound.once('complete',()=>{this.active.delete(sound);sound.destroy();});
    if(!sound.play()){this.active.delete(sound);sound.destroy();return false;}
    return true;
  }
  setPaused(paused) {
    this.paused=paused;
    for(const sound of this.active)if(paused){if(sound.isPlaying)sound.pause();}else if(sound.isPaused)sound.resume();
  }
  stop() {
    this.pending=null;
    for(const sound of this.active){sound.stop();sound.destroy();}
    this.active.clear();
  }
  destroy(){this.destroyed=true;this.stop();this.manager.off('unlocked',this.onUnlock);this.manager.off('audio-ready',this.onUnlock);}
}

export function enemyDeathSound(scene,enemy=null) {
  const own=DEATH_SOUNDS[enemy?.key];
  if(own){scene.sfx?.play(own);return;}
  const index=scene.game.enemyDeathSoundIndex??0;
  scene.game.enemyDeathSoundIndex=index+1;
  scene.sfx?.play(index%2?'hurt2':'hurt');
}
