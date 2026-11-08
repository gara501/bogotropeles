// Online ranking (Supabase RPC over plain fetch: no SDK in the bundle).
// The tables are closed to the publishable key; every call goes through the SQL functions in supabase/ranking.sql.
// A random secret kept in localStorage proves a username belongs to this browser (only its hash is stored online).

export const USERNAME_PATTERN=/^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$/;
export const PROFILE_KEY='street-bogota-profile-v1';
export const MAX_LEVEL=12; // campaign length (src/data/campaign.js); keep in sync with supabase/ranking.sql
const ERROR_CODES=['username_taken','too_fast','invalid_username','invalid_secret','invalid_score','invalid_character','invalid_level','invalid_progress'];
export const LEADERBOARD_ERRORS={
  username_taken:'ESE USUARIO YA ES DE OTRO JUGADOR. PRUEBA CON OTRO.',
  too_fast:'ESPERA UNOS SEGUNDOS Y VUELVE A INTENTAR.',
  invalid_username:'USUARIO: 3 A 16 LETRAS, NÚMEROS, _ O -',
  offline:'SIN CONEXIÓN: TU PUNTAJE QUEDÓ GUARDADO EN ESTE EQUIPO.',
  disabled:'RANKING ONLINE NO CONFIGURADO: GUARDADO EN ESTE EQUIPO.',
  server:'EL RANKING NO RESPONDE: GUARDADO EN ESTE EQUIPO.',
  invalid_secret:'CÓDIGO DE RECUPERACIÓN INCOMPLETO.',
  not_found:'ESE USUARIO NO EXISTE EN LA NUBE.',
};

/** Spaces become _, anything outside the allowed set is dropped, max 16 characters. */
export const cleanUsername=value=>String(value??'').normalize('NFC').trimStart().replace(/\s+/g,'_').replace(/[^A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]/g,'').slice(0,16);
export const validUsername=value=>USERNAME_PATTERN.test(value);

export class LeaderboardError extends Error{
  constructor(code,detail){super(detail||code);this.code=code;}
  get text(){return LEADERBOARD_ERRORS[this.code]??LEADERBOARD_ERRORS.server;}
  /** Network/server trouble (the score can still be kept locally) vs a problem the player can fix. */
  get recoverable(){return ['username_taken','too_fast','invalid_username','invalid_secret','not_found'].includes(this.code);}
}

function randomSecret(){
  const bytes=new Uint8Array(24);globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function loadProfile(storage=globalThis.localStorage){
  let saved=null;try{saved=JSON.parse(storage?.getItem(PROFILE_KEY)??'null');}catch{saved=null;}
  const profile={username:typeof saved?.username==='string' && validUsername(saved.username)?saved.username:'',secret:typeof saved?.secret==='string' && saved.secret.length>=24?saved.secret:randomSecret()};
  if(!saved || saved.secret!==profile.secret)saveProfile(profile,storage);
  return profile;
}
export function saveProfile(profile,storage=globalThis.localStorage){try{storage?.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{/* private mode */}}

export class Leaderboard{
  constructor({url,key,fetch=globalThis.fetch?.bind(globalThis),storage=globalThis.localStorage,timeoutMs=7000}={}){
    this.url=String(url??'').replace(/\/+$/,'');this.key=key??'';this.fetch=fetch;this.storage=storage;this.timeoutMs=timeoutMs;
  }
  get enabled(){return Boolean(this.url && this.key && this.fetch);}
  get profile(){return loadProfile(this.storage);}
  rememberUsername(username){const profile=this.profile;profile.username=username;saveProfile(profile,this.storage);}
  async rpc(name,args){
    if(!this.enabled)throw new LeaderboardError('disabled');
    const abort=typeof AbortController==='function'?new AbortController():null,timer=abort && setTimeout(()=>abort.abort(),this.timeoutMs);
    let response;
    try{
      // publishable keys (sb_publishable_…) go only in the apikey header; they are not JWTs
      response=await this.fetch(`${this.url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:this.key,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args),signal:abort?.signal});
    }catch(error){throw new LeaderboardError('offline',error?.message);}
    finally{if(timer)clearTimeout(timer);}
    let body=null;try{body=await response.json();}catch{body=null;}
    if(!response.ok){
      const message=String(body?.message??body?.error??'');
      throw new LeaderboardError(ERROR_CODES.find(code=>message.includes(code))??'server',message);
    }
    return body;
  }
  /** 'free' | 'mine' | 'taken' | 'invalid' */
  check(username){return this.rpc('sbog_check_username',{p_username:username,p_secret:this.profile.secret});}
  async submit({username,score,character,level,won=false,continues=0,durationS=null}){
    const clean=cleanUsername(username);
    if(!validUsername(clean))throw new LeaderboardError('invalid_username');
    const result=await this.rpc('sbog_submit_score',{p_username:clean,p_secret:this.profile.secret,p_score:Math.max(0,Math.round(score)),p_character:character,
      p_level:Math.max(1,Math.min(MAX_LEVEL,Math.round(level))),p_won:Boolean(won),p_continues:continues,p_duration:durationS===null?null:Math.round(durationS)});
    this.rememberUsername(result?.username??clean);
    return result;
  }
  async top(period='all',limit=10){const rows=await this.rpc('sbog_get_leaderboard',{p_period:period,p_limit:limit});return Array.isArray(rows)?rows:[];}
  player(username){return this.rpc('sbog_get_player',{p_username:username});}
}

export function createLeaderboard(options={}){
  const env=import.meta.env??{};
  return new Leaderboard({url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_ANON_KEY??env.VITE_SUPABASE_PUBLISHABLE_KEY,...options});
}
