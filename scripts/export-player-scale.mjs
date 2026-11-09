import {registerHooks} from 'node:module';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
registerHooks({load(url,ctx,next){if(url.endsWith('?url'))return {format:'module',source:`export default ${JSON.stringify(url)}`,shortCircuit:true};return next(url,ctx);}});
const {characters}=await import('../src/data/characters.js');
const configs=Object.fromEntries(Object.entries(characters).map(([k,c])=>[k,{...Object.fromEntries(['idle','frameRects','frameScales','trimFrames','isolateFrames','keepDetachedFrames','frameClips','animations','grab','cleanFringes'].map(name=>[name,c[name]])),sources:[c.url,...c.appendUrls].map(x=>relative(process.cwd(),fileURLToPath(x.replace('?url',''))))}]));
writeFileSync(new URL('../docs/player-scale-config.json',import.meta.url),JSON.stringify(configs));
