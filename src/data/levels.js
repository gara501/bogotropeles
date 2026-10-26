import { CAMPAIGN } from './campaign.js';
import cyclingBackground from '../scenes/ciclovia/background.png?url';
const backgrounds = import.meta.glob('../scenes/level_*.png', {
  eager: true, query: '?url', import: 'default',
});
const artFiles = import.meta.glob(['../scenes/level*/game/*.png','../scenes/level*/*.png','../scenes/palomojao/game/*.png','../scenes/palomojao/*.png'], {
  eager: true, query: '?url', import: 'default',
});
const asset = (art, file) => ({ key: `${art.folder}-${file}`,
  url: artFiles[`../scenes/${art.folder}/game/${file}.png`] ?? artFiles[`../scenes/${art.folder}/${file}.png`] });

export const levels = CAMPAIGN.map((level, index) => {
  const base = { ...level, key: `level-${index + 1}`, url: level.mode==='cycling'?cyclingBackground:level.art?.background?asset(level.art,level.art.background).url:backgrounds[`../scenes/level_${(level.combatIndex??index) + 1}.png`] };
  if (!level.art) return base;
  return {
    ...base,
    layers: level.art.layers.map(layer => ({ ...layer, ...asset(level.art, layer.file) })),
    traffic: level.art.traffic && { ...level.art.traffic, ...asset(level.art, level.art.traffic.file) },
  };
});

/** Every texture a level needs: its fallback background plus parallax layers and traffic. */
export const levelTextures = level => [{ key: level.key, url: level.url },
  ...(level.layers ?? []), ...(level.traffic ? [level.traffic] : [])].filter(asset => asset.url);
