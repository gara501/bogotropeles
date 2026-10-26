import { enemies } from './enemies.js';

// Which runtime sheets a run needs: the chosen fighter, the level's enemy pools and boss, and every enemy those can bring in
// (summons, minions…) found by scanning their config for other enemy keys. Everything else stays unloaded to save memory.
const refs = (value, out = new Set(), seen = new Set()) => {
  if (typeof value === 'string') { if (enemies[value]) out.add(value); return out; }
  if (!value || typeof value !== 'object' || seen.has(value)) return out;
  seen.add(value);
  for (const item of Array.isArray(value) ? value : Object.values(value)) refs(item, out, seen);
  return out;
};

export function actorsFor(level, characterKey, extra = []) {
  const wanted = new Set([characterKey, ...(level?.enemies ?? []), ...(level?.crossingEnemies ?? []), level?.boss, ...extra].filter(Boolean));
  const stack = [...wanted];
  while (stack.length) {
    const config = enemies[stack.pop()];
    if (!config) continue;
    for (const key of refs(config)) if (!wanted.has(key)) { wanted.add(key); stack.push(key); }
  }
  if (wanted.has('motorata')) wanted.add('motorata-entry');
  if (wanted.has('dormilon')) wanted.add('boss-effects');
  if (wanted.has('don_pico')) wanted.add('pico-hen');
  return wanted;
}
