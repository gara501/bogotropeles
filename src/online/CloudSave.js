// Saves the player's progress (src/game/Progress.js slots) in Supabase, next to the ranking.
// Same identity as the ranking: username + the browser's secret. The secret doubles as a recovery code
// to bring the progress to another device. Without a username or a connection everything stays local.
import {collectProgress,mergeProgress,applyProgress} from '../game/Progress.js';
import {LeaderboardError,cleanUsername,validUsername,loadProfile,saveProfile} from './Leaderboard.js';

export const CLOUD_STATUS={
  disabled:'GUARDADO SOLO EN ESTE EQUIPO (NUBE NO CONFIGURADA).',
  'no-user':'ELIGE UN USUARIO PARA GUARDAR TU AVANCE EN LA NUBE.',
  idle:'AVANCE GUARDADO EN LA NUBE.',
  syncing:'SINCRONIZANDO…',
  offline:'SIN CONEXIÓN: SE GUARDA EN ESTE EQUIPO Y SE SUBE LUEGO.',
  error:'LA NUBE NO RESPONDE: SE GUARDA EN ESTE EQUIPO.',
};
/** Recovery code: the secret in groups of 6, easy to copy by hand. */
export const formatRecoveryCode=secret=>String(secret??'').toUpperCase().match(/.{1,6}/g)?.join('-')??'';
export const parseRecoveryCode=code=>String(code??'').replace(/[^0-9a-f]/gi,'').toLowerCase();

export class CloudSave{
  constructor({leaderboard,slots,storage=globalThis.localStorage,onChange=()=>{},onStatus=()=>{},delayMs=1500,retryMs=20000,setTimer=globalThis.setTimeout?.bind(globalThis),clearTimer=globalThis.clearTimeout?.bind(globalThis)}){
    Object.assign(this,{leaderboard,slots,storage,onChange,onStatus,delayMs,retryMs,setTimer,clearTimer});
    this.timer=null;this.busy=null;this.dirty=false;this.updatedAt=null;
    this.status=!leaderboard.enabled?'disabled':this.username?'idle':'no-user';
  }
  get username(){return this.leaderboard.profile.username;}
  get recoveryCode(){return formatRecoveryCode(this.leaderboard.profile.secret);}
  get statusText(){return CLOUD_STATUS[this.status]??CLOUD_STATUS.error;}
  setStatus(status){this.status=status;this.onStatus(status);}
  get ready(){return this.leaderboard.enabled && Boolean(this.username);}
  /** Remote → local. Returns the slot names that changed on this device. */
  async pull(){
    if(!this.ready)return [];
    const result=await this.leaderboard.rpc('sbog_load_progress',{p_username:this.username,p_secret:this.leaderboard.profile.secret});
    if(!result?.exists)return [];
    const merged=mergeProgress(this.slots,collectProgress(this.slots,this.storage),result.data);
    const changed=applyProgress(this.slots,this.storage,merged);
    this.updatedAt=result.updated_at??this.updatedAt;
    if(changed.length)this.onChange(changed);
    // the cloud is missing something this device has: push it
    if(JSON.stringify(mergeProgress(this.slots,result.data,{}))!==JSON.stringify(mergeProgress(this.slots,merged,{})))this.dirty=true;
    return changed;
  }
  /** Local → remote (after merging the remote copy, so another device's unlocks survive). */
  async push(){
    if(!this.ready)return null;
    await this.pull();
    const result=await this.leaderboard.rpc('sbog_save_progress',{p_username:this.username,p_secret:this.leaderboard.profile.secret,p_data:collectProgress(this.slots,this.storage)});
    this.dirty=false;this.updatedAt=result?.updated_at??this.updatedAt;return result;
  }
  /** Pull, then push if needed. Never throws: problems become a status and a later retry. */
  sync(){
    if(this.busy)return this.busy.then(()=>this.dirty?this.sync():undefined);
    if(!this.leaderboard.enabled){this.setStatus('disabled');return Promise.resolve();}
    if(!this.username){this.setStatus('no-user');return Promise.resolve();}
    this.setStatus('syncing');
    this.busy=(async()=>{
      try{await this.pull();if(this.dirty)await this.push();this.setStatus('idle');}
      catch(error){
        this.setStatus(error?.code==='offline'?'offline':'error');
        if(error?.code!=='username_taken')this.schedule(this.retryMs);
      }finally{this.busy=null;}
    })();
    return this.busy;
  }
  /** Something was unlocked: save soon (several unlocks in a row become one upload). */
  schedule(delay=this.delayMs){
    this.dirty=true;
    if(!this.ready){this.setStatus(this.leaderboard.enabled?'no-user':'disabled');return;}
    if(this.timer)this.clearTimer?.(this.timer);
    this.timer=this.setTimer?.(()=>{this.timer=null;this.sync();},delay);
  }
  /** Claims a username for this browser (or reuses its own) and uploads the current progress. */
  async register(username){
    const clean=cleanUsername(username);
    if(!validUsername(clean))throw new LeaderboardError('invalid_username');
    const state=await this.leaderboard.check(clean);
    if(state==='taken')throw new LeaderboardError('username_taken');
    if(state==='invalid')throw new LeaderboardError('invalid_username');
    this.leaderboard.rememberUsername(clean);this.dirty=true;
    await this.sync();if(this.status!=='idle')throw new LeaderboardError(this.status==='offline'?'offline':'server');
    return clean;
  }
  /** Another device: username + recovery code. The code becomes this browser's secret. */
  async recover(username,code){
    const clean=cleanUsername(username),secret=parseRecoveryCode(code);
    if(!validUsername(clean))throw new LeaderboardError('invalid_username');
    if(secret.length<24)throw new LeaderboardError('invalid_secret');
    const result=await this.leaderboard.rpc('sbog_load_progress',{p_username:clean,p_secret:secret});
    if(!result?.exists)throw new LeaderboardError('not_found');
    const profile=loadProfile(this.storage);profile.username=result.username??clean;profile.secret=secret;saveProfile(profile,this.storage);
    this.dirty=true;await this.sync();
    return profile.username;
  }
}
