# Guitarist · levels 3 and 5

The musician is based on `ejemplos/guitarra.jpg`: flat cap, black clothing,
orange acoustic guitar, blue backpack drum and brass cymbal. The generated
transparent PNGs are saved in the project:

- `src/data/enemies/guitarist.png`: 24 poses covering stance, walking, two
  guitar swings, hurt, defeat, crouching and getting up.
- `src/data/enemies/guitarist_grab_struggle.png`: six poses while held.

Level 3 replaces both `brawler` (enemy_6) and `fan` (enemy_7) slots with
`guitarist`. The duplicate slot preserves their combined spawn frequency.
Level 5's current pool already had neither type, so it gains a guitarist slot.
Both levels retain twenty enemies and two/three-enemy waves. Other levels'
pools and enemy_6/enemy_7 definitions remain intact.

## Combat

He attacks with a horizontal guitar bash followed by an overhead smash. Both
deal more damage than the replaced fighters. The second is a finisher with
the normal increased hitstop and knockback. Both swings are committed even
when the first misses. A counterhit interrupts the remaining combo.

He uses the existing approach, windup, attack, recover, hurt, grab and
knockdown states and the two-attack-token limit. Guitar swings use `bar.mp3`.
The legacy attack path also respects two stages and per-stage contact poses.

## Tuning (`src/data/guitarist.js`)

| Setting | Initial value |
| --- | --- |
| Display height, including cymbal | 119 px |
| Base speed / HP / damage | 115 px/s / 280 / 14 per hit |
| Combo stages | 2 |
| First windup / next windup | 600 / 240 ms |
| Recovery per swing / cooldown | 320 / 1800 ms |
| Active frames | 4 per swing |
| Reach | 155 / 175 px |
| Contact poses | 6 / 10 |
| Grab loop | 6 poses at the existing grab cadence |
| Grab sheet scale correction | 252 / 493 |

Level difficulty scales base health, movement, damage and attack cooldown.
The two source sheets use measured rectangles and torso anchors. Custom
struggle sheet metadata lets them share the normal grab pipeline without
forcing the existing 256-pixel frame format. The scale correction matches
the generated drawing sizes rather than resizing either PNG.

## Manual checks

- Play level 3: both old enemy_6/enemy_7 slots are now guitarists.
- Play level 5: guitarists appear among the existing enemies.
- Let him wind up: horizontal and overhead attacks hit once each.
- Counterhit after the first blow: the overhead blow is cancelled.
- Step out of the lane or jump: the combo misses.
- Walk into him: six struggle poses loop while he is held.
- Knee him, throw him and let him break free: the main sheet returns at the
  correct size, with no leftover guitar or drum from neighbouring poses.
- Knock him down: fall, lie, get up and wake invulnerability still work.

Development preview: `?enemyTest=guitarist`, including grab/release buttons.

## Image generation

Built-in imagegen was used for both transparent assets. Original reference
and generated source files are preserved. Prompts:

> Detailed 1990s arcade beat em up pixel art. Same adult street musician inspired by the reference: lean older man, dark charcoal flat cap, black button shirt sleeves rolled, dark trousers, brown boots, orange wooden acoustic guitar, blue bass drum strapped on his back and brass cymbal over backpack. Full body side view facing RIGHT. Consistent anatomy, clothing, musical equipment and pixel scale in every pose. No text, no labels, no background, no ground shadows, no other people. Actual transparent alpha background and wide empty gutters, no limbs or instruments touching other cells. Create exactly 24 isolated full body sprites in four columns and six rows. Row1: neutral combat stance holding guitar, walk stride A, walk stride B, walk stride C. Row2: wind up guitar held sideways, rotate torso to swing, heavy horizontal guitar bash with guitar fully extended to right, follow through and recover. Row3: lift guitar overhead, prepare overhead blow, heavy downward guitar smash toward right, low follow through. Row4: hit flinch, recoil backward, stagger bent forward, regain balance. Row5: knocked backward in air, falling sideways, lying defeated with guitar and drum, motionless defeated on ground. Row6: turn torso alert, crouch for knockdown recovery, getting up with guitar, neutral stance with guitar. Keep complete guitar, tail-like straps, cymbal and drum inside each cell. Both attacks use guitar as a blunt weapon, guitar remains intact.

> Detailed 1990s arcade beat em up pixel art. Same adult street musician inspired by the reference: lean older man, dark charcoal flat cap, black button shirt sleeves rolled, dark trousers, brown boots, orange wooden acoustic guitar, blue bass drum strapped on his back and brass cymbal over backpack. Full body side view facing RIGHT. Consistent anatomy, clothing, musical equipment and pixel scale in every pose. No text, no labels, no background, no ground shadows, no other people. Actual transparent alpha background and wide empty gutters, no limbs or instruments touching other cells. Create exactly SIX full body grabbed-and-struggling animation frames, grid three columns by two rows. The musician has been seized by an unseen opponent: arms pinned close, guitar trapped against torso angled down, head pulled forward and shoulders hunched, feet planted. Frame1 held tense, frame2 pulls shoulders backward, frame3 twists left, frame4 grimaces from a knee strike, frame5 twists back, frame6 returns to held tense. No captor visible, no extra hands. Each cell includes intact guitar, blue drum, cymbal and entire body. Feet on consistent baseline. Clear readable struggle animation rather than attacking or playing guitar.
