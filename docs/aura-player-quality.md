# Aura player art v2

The old emotes used independent slide/guard interpretations, a forced 4-pixel logical grid, and hard-coded palettes of roughly 16–25 colors. Their 140-pixel-tall bodies were enlarged to 184 pixels in the level. Walking used the unrelated combat sheet and the circle trigger moved the player from x230 to x300. Together these caused a coarse, flat face, changed proportions and a visible positional jump.

Each of the five new families uses the actual original unarmed guard as its visual reference. A single family sheet contains walking studies, a neutral pose and the five three-frame emotes. The face, costume and head-to-body proportions are defined together. Source sheets and complete generation prompts are kept in `src/scenes/aura/source/players-v2/` and `src/scenes/aura/player-quality.json`.

New runtime emotes use 256×512 cells, a 280-pixel reference body and a baseline at 450. An adaptive shared 192-color palette preserves skin, hair and fabric detail without frame-to-frame palette changes. Each character uses one uniform scale across all poses; leaning poses are not stretched back to full height.

The neutral pose was used as the reference for a new eight-frame PixelLab PixMiniMax entrance gait per character. These are authored at 224×256 with a 184-pixel body, so walking displays at its native size. The source frames and job IDs live beside each family. Runtime gait baseline is 240. The on-screen body remains 184 pixels both walking and posing.

`AuraStage` now uses this coherent aura family throughout the entrance and battle. It walks to x300 before stopping, plants a neutral pose briefly, and then performs the emotes. It no longer swaps to the unrelated main combat atlas. The starting point is inset so the hair and shoes are fully visible.

Tools: built-in image_gen for family generation; PixelLab `animate_image_pixminimax` for the entrance cycles; deterministic alpha, scale, palette and anchor preparation with `scripts/prepare-aura-quality.py` and `scripts/fetch-aura-walks.py`.

Regression checks cover color detail, chroma removal, foot baselines, eight distinct walking frames, walking body size, and the exact walk-to-pose handoff. Original combat animations are unchanged.
