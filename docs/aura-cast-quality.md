# Aura cast quality v2

The Gordo and all eight spectator NPCs now use the original approved source detail at the same rendering density as the player-v2 art. They no longer pass through the old coarse pixel grid and reduced fixed palettes.

- Rival: 256×512 per frame, 280-pixel reference body, baseline 450. All nine poses share one scale and adaptive 256-color palette. Red shorts register the body axis independently of pointing/raised hands; small skin/toe-colored fragments are excluded from the cloth anchor.
- Audience: 192×256 per frame, a shared 200-pixel reference body and baseline 240. Phones, microphone, faces, clothes and shoes retain the source colors and shapes. The eight established identities/roles and their stage positions remain intact.
- The on-screen reference heights remain 190 for the rival and the existing 105–124 heights for spectators. The higher-resolution sheets preserve detail instead of enlarging coarse pixels.

Assets: `src/scenes/aura/game/cast-v2/`. Reproducible originals and original built-in image_gen prompts: `src/scenes/aura/source/cast-v2/`. Build with `python scripts/prepare-aura-cast-quality.py`. The main aura preparation pipeline calls it after player-v2 preparation when the cast manifest exists.

Tests in `tests/aura-art.test.js` cover color detail, all nine foot baselines, the rival's body axis, the eight NPC silhouettes, transparency and chroma removal. Runtime layout constants live in `src/aura/spriteLayout.js`.
