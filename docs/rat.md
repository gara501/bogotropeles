# Level-six rats and motorcycles

`rat` is a regular enemy in Calles del centro. The thirty-enemy total is unchanged:
rats participate in the normal two/three-enemy waves and award the regular score.
Only `rider` motorcycles cross the screen, exactly as in level two. Their lane and
direction remain fixed and leaving the screen resolves them without kill points.

The rat scurries toward the player, rears on its hind legs, crouches, leaps and
bites once. Its landing position is captured at takeoff. Moving in depth or
jumping avoids the bite. Tokens, local hitstop, hurt and respawn cancellation
reuse the normal enemy system. Rats cannot be held in a human grab.

## Tuning

`src/data/rat.js` contains the sprite atlas and all rat-specific values:

| Parameter | Initial value |
| --- | --- |
| Ground pose height | 42 px |
| Speed / base HP / damage | 185 px/s / 90 / 8 |
| Leap trigger range / bite reach | 155 / 44 px |
| Startup / leap / recovery | 30 / 24 / 25 frames |
| Bite contact window | Leap frames 9 through 21 |
| Leap distance / height | 145 / 58 px |
| Landing gap | 18 px |
| Depth threshold | 22 px |
| Attack cooldown | 100 frames, adjusted by level pressure |

Normal campaign difficulty scales speed, health and damage. `LeapingBite.js`
owns the captured target and the separate ground and Z coordinates. The active
open-mouth animation pose gates contact. Taking damage cancels the leap and
restores Z to zero. Pausing and local hitstop freeze the leap's frame counter.

## Art

Saved asset: `src/data/enemies/rat.png`, generated with the built-in imagegen tool
from `ejemplos/rata.avif`. A PNG format conversion was used only to view the
reference. The original reference and generated PNG are preserved. Sixteen
measured source rectangles and body anchors keep the tail from shifting poses.

Generation prompt:

> Transparent sprite sheet for a 1990s detailed pixel art 2D beat em up enemy: a real gray-brown sewer rat based on reference, coarse shaggy fur, rounded pink ears, black eyes, pink feet, long thin bare tail. Animal rat anatomy, no clothing, no human body. Side view facing RIGHT. Exactly 16 distinct isolated poses in 4 columns and 4 rows, spacious empty transparent gutters between every pose. Full body and full tail contained in each cell. Same animal and same scale throughout. Row1: idle on four paws, scurry stride A, scurry stride B, scurry stride C. Row2: rears up on TWO HIND LEGS, crouches hind legs ready to spring, airborne forward leap with open mouth biting and visible incisors, lands with mouth closed. Row3: stunned flinch, hurt recoil, hurt hunched, recovery alert. Row4: knocked sideways, falling on side, lying defeated, lying defeated motionless. Crisp detailed hand-drawn pixel art matching arcade human fighters. No text, no labels, no background, no floor, no shadow, no effects connecting adjacent cells. Genuine alpha transparency.

## Checks

- Find rats during level-six waves; all enemies still total thirty before Brayatan.
- Watch the rat rear up, leap, bite and land with a grounded shadow.
- Evade the captured lane: a bite must miss and cannot track you in flight.
- Get bitten: only one hit is possible per leap, on its open-mouth pose.
- Interrupt or respawn during a leap: the rat returns to ground without stale hits.
- Pause or hitstop the rat: its trajectory and contact window freeze together.
- Level-six motorcycles travel edge to edge and do not pursue or turn.
- Motorcycle exit counts once, and surviving normal enemies still block the next wave.

Development-only preview: `?enemyTest=rat`.
