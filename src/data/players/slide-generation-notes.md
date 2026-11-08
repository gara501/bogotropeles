# Slide animation generation

Generated with the built-in image generation tool for Universitaria (player 2), Teleperforman (player 3), and Magolita (player 5). Gymbro excluded.

Each A image requests anticipation, drop and low slide impact; each B image requests continued slide, supported recovery and fighting guard. Original character sheets were supplied as identity references; B also uses its corresponding A image.

Shared prompt:

Output one PNG exactly 1536x1024. THREE sprites in ONE ROW, equal invisible cells x0..511, x512..1023, x1024..1535. EACH sprite strictly fits within its own 512px cell with >=16px margins. Centers x256,768,1280. Ground/support baseline y900. Standing-equivalent height560px, head about110px, same anatomical scale in every pose, NEVER enlarge low poses. Low slide height252px with top near648. Face RIGHT in side three-quarter arcade beat em up view. Authentic clean arcade pixel art: uniform square4x4 logical pixels, hard stepped edges, continuous 4px exterior #14101C outline, flat hard cel shades, upper-left lighting, max28 opaque colors per character with 3 tones per material. Pure perfectly flat chroma green #00FF00 everywhere outside silhouettes, no green character colors. NO antialias, gradients, blur, painterly texture, dithering, shadows, floor, dust, speed lines, glows, effects, text, labels, watermarks or drawn grid. Anatomically normal limbs, no oversized hands or shoes. Preserve exact character identity, clothing, base colors and accessories from reference. 

A poses:

IMAGE A ONLY, exactly frames1,2,3 of six-frame sliding sweep: LEFT anticipation coming out of run, torso leaning strongly forward, left leg supporting bent, right leg starting forward, arms swung backwards. MIDDLE drop: hips close to floor, body falling sideways, right leg extending forward RIGHT, left leg folding underneath, LEFT hand reaching to floor behind hips on left. RIGHT impact: almost lying sideways, supported on LEFT hand/forearm behind on left, RIGHT LEG FULLY STRAIGHT toward RIGHT just above floor at ankle height, LEFT leg folded underneath, loose clothing/hair trails backward. Low pose only45% of standing height, NOT upright seated. End right shoe before x1519. This is a low sliding kick, not a high kick.

B poses:

IMAGE B ONLY, exactly frames4,5,6 of six-frame sliding sweep: LEFT continuation of reference A's last pose, almost lying sideways supported by left hand/forearm BEHIND on left, RIGHT leg completely extended toward RIGHT at ankle height, LEFT folded beneath, right foot slightly forward and hair/clothing waved differently. Low sliding silhouette only252px tall, entire silhouette must fit x16..495, no long stretched torso. MIDDLE recovery: left hand pushing up behind, LEFT knee on floor, RIGHT foot planted forward, torso rising, right fist closing near chest; fits x528..1007. RIGHT guard: standing fight stance matching original character sheet's guard, both fists up, knees slightly bent legs apart, ready to punch, height560px, head110px, fits x1040..1519. Not a victory pose. Match image A's anatomy, colors and outline exactly.

Character instructions: Universitaria retains long brown hair, white top with brown trim, blue jeans and white sneakers. Teleperforman retains brown hair and beard, worn headset, lilac shirt, black tie, charcoal trousers and black shoes. Magolita retains stocky build, hair bun, blue uniform, pale blue apron and white ties, purple gloves and black shoes; empty hands as in her running frames.

Known limitations: Generated drafts require correction of equal-cell containment, ground baseline, consistent scale, strict palette and uniform logical pixel size before direct game integration. No consuming game code changed.
