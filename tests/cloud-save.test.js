import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressSlots,collectProgress,mergeProgress,applyProgress,markLevelCleared,unlockedLevel,registerSlot,PROGRESS_KEY} from '../src/game/Progress.js';
import {CloudSave,formatRecoveryCode,parseRecoveryCode} from '../src/online/CloudSave.js';
import {Leaderboard,PROFILE_KEY} from '../src/online/Leaderboard.js';
import {PALETTE_KEY} from '../src/data/palettes.js';
import {SURVIVAL} from '../src/game/Survival.js';

const memory=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};
const card=(id,at)=>({id,unlockedAt:at});

/** A fake Supabase with the two progress RPCs and username check, mirroring supabase/progress.sql. */
function fakeServer(){
  const players=new Map(),calls=[];
  const hash=s=>`h:${s}`;
  const fetch=async(url,{body})=>{
    const name=url.split('/').pop(),a=JSON.parse(body);calls.push(name);
    const reply=(status,json)=>({ok:status<300,status,json:async()=>json});
    const p=players.get(a.p_username?.toLowerCase());
    if(name==='sbog_check_username')return reply(200,!p?'free':p.hash===hash(a.p_secret)?'mine':'taken');
    if(name==='sbog_load_progress'){
      if(!p)return reply(200,{exists:false,data:null});
      if(p.hash!==hash(a.p_secret))return reply(400,{message:'username_taken'});
      return reply(200,{exists:true,username:p.username,data:p.data,updated_at:'t'});
    }
    if(name==='sbog_save_progress'){
      if(p && p.hash!==hash(a.p_secret))return reply(400,{message:'username_taken'});
      const row=p??{username:a.p_username,hash:hash(a.p_secret),data:{}};row.data={...row.data,...a.p_data};players.set(a.p_username.toLowerCase(),row);
      return reply(200,{ok:true,username:row.username,data:row.data,updated_at:'t'});
    }
    return reply(404,{message:'unknown'});
  };
  return {players,calls,fetch};
}
const device=(server,storage=memory())=>{
  const leaderboard=new Leaderboard({url:'https://x.supabase.co',key:'k',fetch:server.fetch,storage});
  const changes=[];
  const cloud=new CloudSave({leaderboard,storage,slots:createProgressSlots(),onChange:c=>changes.push(c),setTimer:()=>0,clearTimer:()=>{}});
  return {storage,leaderboard,cloud,changes};
};

test('levels unlock only after the previous one is beaten, and never go back',()=>{
  const s=memory();assert.equal(unlockedLevel(s),0);
  assert.equal(markLevelCleared(0,s),true);assert.equal(unlockedLevel(s),1);
  assert.equal(markLevelCleared(0,s),false);assert.equal(markLevelCleared(4,s),true);assert.equal(unlockedLevel(s),5);
  assert.equal(markLevelCleared(2,s),false);assert.equal(unlockedLevel(s),5);
  assert.equal(s.getItem(PROGRESS_KEY),'5');assert.equal(markLevelCleared(-1,s),false);
});

test('merging two devices keeps every unlock: max level, all cards, all colours, best survival',()=>{
  const slots=createProgressSlots();
  const a={levels:3,cards:[card('toreto','2026-01-02')],palettes:{selected:{office:'noche'},unlocked:['centro']},survival:{wave:5,score:900,character:'X'}};
  const b={levels:6,cards:[card('toreto','2026-01-01'),card('el-2x1','2026-02-01')],palettes:{selected:{office:'neon',gymbro:'noche'},unlocked:['campaign','hack']},survival:{wave:8,score:10,character:'Y'},trophies:['nuevo']};
  const m=mergeProgress(slots,a,b);
  assert.equal(m.levels,6);assert.deepEqual(m.cards,[card('toreto','2026-01-01'),card('el-2x1','2026-02-01')]);
  assert.deepEqual(m.palettes.unlocked.sort(),['campaign','centro']);assert.equal(m.palettes.selected.office,'noche','this device keeps its own choice');
  assert.equal(m.palettes.selected.gymbro,'noche');assert.equal(m.survival.wave,8);
  assert.deepEqual(m.trophies,['nuevo'],'slots from a newer version of the game are kept');
  assert.deepEqual(mergeProgress(slots,{},undefined).cards,[]);
});

test('applying remote progress writes localStorage and reports what changed',()=>{
  const slots=createProgressSlots(),s=memory({[PROGRESS_KEY]:'2'});
  const changed=applyProgress(slots,s,{levels:4,cards:[card('toreto','2026-01-01'),card('fake','x')],palettes:{selected:{},unlocked:['centro']},survival:null});
  assert.deepEqual(changed.sort(),['cards','levels','palettes']);
  assert.equal(unlockedLevel(s),4);assert.deepEqual(collectProgress(slots,s).cards,[card('toreto','2026-01-01')],'unknown cards are dropped');
  assert.deepEqual(JSON.parse(s.getItem(PALETTE_KEY)).unlocked,['centro']);
  assert.deepEqual(applyProgress(slots,s,{levels:1}),[],'a lower level never overwrites');
  assert.throws(()=>registerSlot(slots,'x',{read(){}}));
  registerSlot(slots,'trophies',{read:st=>JSON.parse(st.getItem('t')??'[]'),write:(st,v)=>st.setItem('t',JSON.stringify(v??[])),merge:(a,b)=>[...new Set([...(a??[]),...(b??[])])]});
  assert.deepEqual(mergeProgress(slots,{trophies:['a']},{trophies:['b']}).trophies,['a','b']);
});

test('recovery code round-trips the secret',()=>{
  const secret='0123456789abcdef0123456789abcdef01234567';
  assert.match(formatRecoveryCode(secret),/^[0-9A-F]{6}(-[0-9A-F]{1,6})+$/);
  assert.equal(parseRecoveryCode(formatRecoveryCode(secret)),secret);assert.equal(parseRecoveryCode(' 01-23 '),'0123');
});

test('without a username or Supabase nothing is uploaded and the status says why',async()=>{
  const server=fakeServer(),one=device(server);
  one.cloud.schedule();assert.equal(one.cloud.status,'no-user');await one.cloud.sync();assert.equal(server.calls.length,0);
  const off=new CloudSave({leaderboard:new Leaderboard({storage:memory()}),storage:memory(),slots:createProgressSlots()});
  assert.equal(off.status,'disabled');await off.sync();assert.equal(off.status,'disabled');
});

test('progress travels to another device with username + recovery code and merges both ways',async()=>{
  const server=fakeServer(),pc=device(server);
  markLevelCleared(4,pc.storage);pc.storage.setItem('street-bogota-cards-v1',JSON.stringify([card('toreto','2026-01-01')]));
  assert.equal(await pc.cloud.register('Andrés'),'Andrés');assert.equal(pc.cloud.status,'idle');
  assert.equal(server.players.get('andrés').data.levels,5);
  // phone: plays a bit first, then recovers
  const phone=device(server);markLevelCleared(0,phone.storage);
  phone.storage.setItem(SURVIVAL.recordKey,JSON.stringify({wave:9,score:50,character:'Magolita'}));
  await assert.rejects(phone.cloud.recover('Andrés','000000000000000000000000000'),e=>e.code==='username_taken');
  await assert.rejects(phone.cloud.recover('Nadie',pc.cloud.recoveryCode),e=>e.code==='not_found');
  assert.equal(await phone.cloud.recover('andrés',pc.cloud.recoveryCode),'Andrés');
  assert.equal(unlockedLevel(phone.storage),5);assert.equal(phone.leaderboard.profile.username,'Andrés');
  assert.deepEqual(phone.changes.at(-1).sort(),['cards','levels']);
  assert.equal(server.players.get('andrés').data.survival.wave,9,'the phone record went up too');
  // back on the PC the survival record arrives
  await pc.cloud.sync();assert.equal(JSON.parse(pc.storage.getItem(SURVIVAL.recordKey)).wave,9);
  // another browser cannot take the name
  const thief=device(server);await assert.rejects(thief.cloud.register('ANDRÉS'),e=>e.code==='username_taken');
});

test('an offline upload becomes a status and a retry, never an exception',async()=>{
  const storage=memory({[PROFILE_KEY]:JSON.stringify({username:'Andres',secret:'a'.repeat(48)})});
  const timers=[];
  const leaderboard=new Leaderboard({url:'https://x',key:'k',storage,fetch:async()=>{throw new Error('down');}});
  const cloud=new CloudSave({leaderboard,storage,slots:createProgressSlots(),setTimer:(f,ms)=>timers.push(ms),clearTimer:()=>{}});
  await cloud.sync();assert.equal(cloud.status,'offline');assert.equal(timers.at(-1),cloud.retryMs);
});
