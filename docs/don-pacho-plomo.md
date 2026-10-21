# Don Pacho Plomo · level 7

Zona Rosa's thirty-enemy wave ends with Don Pacho. His white SUV drives in,
opens its door, lets him step out and closes again. He laughs before becoming
vulnerable. The parked vehicle is scenery, not a damage hazard.

Combat runs on the existing fixed 60 Hz simulation and uses attack tokens.
He crouches, hops toward an offset from the player's captured position and
fires into the landing lane. Once firing starts, the direction and lane are
committed: walking in depth, ducking and jumping can avoid bullets.

Below 50% maximum health he permanently enters phase two. Hops take less time,
recovery is shorter and the pistol is replaced with a machine gun. Healing is
telegraphed and restores 10% maximum health at one contact frame. Hits before
contact cancel the heal. Healing never returns him to phase one.

## Tuning

Values live in `src/data/pacho.js`; durations are simulation frames.

| Setting | Value | Effect |
| --- | --- | --- |
| Sprite height | 120 px | Comparable to other bosses |
| Base HP | 2900 | Scaled by level difficulty |
| SUV drive / exit / laugh | 110 / 42 / 70 | Entrance pacing |
| Hop startup / air / height | 18 / 42 / 100 px | Telegraph and evasive arc |
| Phase speed multiplier | 1.5 | Air time becomes 28 frames |
| Pistol | 3 shots, 22-frame interval | Readable individual shots |
| Machine gun | 10 shots, 7-frame interval | Sustained lane pressure |
| Healing contact / total | 75 / 110 | Interrupt window and recovery |
| Healing amount | 10% maximum HP | One grant per completed action |
| Heal cooldown / interruption cooldown | 720 / 300 | Prevents repeated healing |
| Boss score | 5000 | Completion bonus |

`src/actors/PachoController.js` owns the entrance and combat states. Enemy.js
delegates only this boss to it. Runtime shutdown and defeat release tokens,
reset jump visuals and destroy the SUV. Pausing freezes the choreography.

## Assets

Created with the built-in imagegen tool, preserving transparent PNG output:

- `src/data/bosses/don_pacho_plomo.png`: 20 full-body poses.
- `src/data/bosses/pacho_camioneta.png`: SUV closed and open door poses.

References: `ejemplos/traqueto.jpg`, `ejemplos/camioneta.jpeg`.
Source rectangles and body anchors were measured from the generated images;
the original reference photographs remain unchanged.

Generation prompts:

> Generate a transparent sprite sheet for a fictional arcade beat em up boss Don Pacho Plomo inspired by the adult man's outfit in reference: dark swept back hair, beard, bright geometric multicolored shirt, dark jeans, gold jewelry, black shoes. Detailed 1990s pixel art, side view facing RIGHT, identical scale throughout. Exactly 20 separate full body poses, regular grid 4 columns by 5 rows with spacious transparent gutters, feet aligned within cells. Row1: idle, walking left leg forward, walking right leg forward, laughing head back. Row2: crouch frog preparation, rising frog jump, airborne tucked knees, landing crouch. Row3: draw pistol, aim pistol right, fire pistol right muzzle flash attached, pistol recoil. Row4: draw compact machine gun, aim machine gun right, fire machine gun right, recoil. Row5: hold small white packet, hand raised to nose with tiny white powder puff (fictional healing action), flinch injured, defeated lying sideways. No writing, no background, no ground shadows. All figures completely separated with clear empty margins; do not crop limbs or weapons.

> Transparent pixel art sprite sheet for a 1990s arcade beat em up. Two sprites of the same white luxury SUV inspired by reference, dark tinted windows, sturdy wheels, facing LEFT, strictly side profile with slight front visibility. Top row: all doors closed. Bottom row: front driver door opened toward viewer, dark empty interior visible. No people. Same vehicle size and position in each row. Two wide rows separated by ample transparent gutters, entire vehicle and open door fully contained. Detailed hand painted pixel art with crisp edges, no logos, no text, no ground, no cast shadow, transparent background.

## QA

- Clear Zona Rosa's regular enemies: SUV entrance plays before any boss damage.
- Attack during arrival and laughter: boss health does not change.
- Watch the shadow remain grounded during the visible frog hop.
- Move out of the shot lane or duck; verify pistol shots and phase-two bursts.
- Cross below half health: phase changes once, even after healing above half.
- Interrupt the healing tell before contact: no health is granted.
- Let healing finish: health increases by exactly 10% maximum, once.
- Pause during entry, hop or healing: animation and contact frames freeze.
- Die, continue or restart: no stale jump, healing or SUV objects remain.
- Defeat Don Pacho: campaign result shows a new-game option.

Development preview: `?enemyTest=pacho`, with buttons for hopping, phase two,
healing and defeat. These shortcuts are excluded from production builds.
