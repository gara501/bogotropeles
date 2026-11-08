import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Leaderboard,LeaderboardError,cleanUsername,validUsername,loadProfile,PROFILE_KEY} from '../src/online/Leaderboard.js';

const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};};
const reply=(status,body)=>Promise.resolve({ok:status<300,status,json:()=>Promise.resolve(body)});

test('usernames are cleaned to 3-16 safe characters (accents and ñ allowed)',()=>{
  assert.equal(cleanUsername('  Andrés Bogotá!! '),'Andrés_Bogotá_');
  assert.equal(cleanUsername('Ñoño<script>'),'Ñoñoscript');
  assert.equal(cleanUsername('x'.repeat(30)).length,16);
  assert.equal(validUsername('ab'),false);assert.equal(validUsername('Pepe_1'),true);assert.equal(validUsername('a b c'),false);
});

test('the browser profile keeps one random secret and a valid username',()=>{
  const storage=memory(),first=loadProfile(storage);
  assert.equal(first.username,'');assert.ok(first.secret.length>=24);
  assert.equal(loadProfile(storage).secret,first.secret,'the secret is stable');
  storage.setItem(PROFILE_KEY,'{broken');assert.ok(loadProfile(storage).secret.length>=24);
});

test('submit calls the sbog_submit_score RPC with the publishable key only in the apikey header',async()=>{
  const calls=[],storage=memory();
  const board=new Leaderboard({url:'https://demo.supabase.co/',key:'sb_publishable_x',storage,fetch:(url,init)=>{calls.push({url,init});return reply(200,{ok:true,username:'Pepe_1',rank:3,unlocked:[]});}});
  const result=await board.submit({username:'Pepe 1',score:1234.4,character:'gymbro',level:40,won:true,continues:2});
  assert.equal(result.rank,3);
  assert.equal(calls[0].url,'https://demo.supabase.co/rest/v1/rpc/sbog_submit_score');
  assert.equal(calls[0].init.headers.apikey,'sb_publishable_x');assert.equal(calls[0].init.headers.Authorization,undefined);
  const body=JSON.parse(calls[0].init.body);
  assert.deepEqual({...body,p_secret:'·'},{p_username:'Pepe_1',p_secret:'·',p_score:1234,p_character:'gymbro',p_level:12,p_won:true,p_continues:2,p_duration:null});
  assert.equal(body.p_secret,board.profile.secret);assert.equal(board.profile.username,'Pepe_1','the username is remembered');
});

test('server errors map to player-facing codes; network trouble is offline',async()=>{
  const taken=new Leaderboard({url:'u',key:'k',storage:memory(),fetch:()=>reply(400,{code:'P0001',message:'username_taken'})});
  await assert.rejects(taken.submit({username:'Pepe_1',score:1,character:'office',level:1}),e=>e instanceof LeaderboardError && e.code==='username_taken' && e.recoverable);
  const down=new Leaderboard({url:'u',key:'k',storage:memory(),fetch:()=>Promise.reject(new TypeError('Failed to fetch'))});
  await assert.rejects(down.top(),e=>e.code==='offline' && !e.recoverable);
  const off=new Leaderboard({url:'',key:'',storage:memory()});assert.equal(off.enabled,false);
  await assert.rejects(off.top(),e=>e.code==='disabled');
  await assert.rejects(off.submit({username:'no',score:1,character:'office',level:1}),e=>e.code==='invalid_username');
});

test('the Supabase SQL keeps tables closed and exposes only the ranking RPCs',()=>{
  const sql=readFileSync(new URL('../supabase/ranking.sql',import.meta.url),'utf8');
  for(const table of ['players','scores','achievements','player_achievements'])assert.match(sql,new RegExp(`alter table public\\.sbog_${table}\\s+enable row level security`));
  for(const fn of ['submit_score','check_username','get_leaderboard','get_player'])assert.match(sql,new RegExp(`grant execute on function public\\.sbog_${fn}\\(`));
  assert.match(sql,/revoke all on public\.sbog_players, public\.sbog_scores, public\.sbog_player_achievements from anon, authenticated/);
  // nothing outside the sbog_ prefix: another ranking can live in the same database
  assert.doesNotMatch(sql,/public\.(?!sbog_)(players|scores|achievements|player_achievements|submit_score|check_username|get_leaderboard|get_player)\b/);
  for(const key of ['office','student','teleperforman','gymbro','magolita'])assert.ok(sql.includes(`'${key}'`),key);
});
