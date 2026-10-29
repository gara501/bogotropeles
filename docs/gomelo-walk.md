# Caminata de Gomelo

## Versión actual: hoja de 18 poses

Se integra el nuevo `src/data/players/player_1_walk.png` (1280 × 1024), proporcionado por el usuario, sin editar el dibujo. Posee cinco columnas y cuatro filas, con tres poses en la última fila. El estilo es un trote con inclinación del cuerpo.

Cuadros 56–73, anexados después de la hoja principal (1705 px) y agarre (941 px). Recortes por alfa, anclas individuales de torso y escalas para una altura de referencia constante de 153 px, a 24 fps. Los ataques y agarres conservan sus índices.

Validación: 418 pruebas aprobadas y build correcto. Prueba visual: `?playerPreview=office`.

## Historial: hoja anterior de seis cuadros

Asset: `src/data/players/player_1_walk.png`.

Generado con la herramienta integrada `image_gen`, usando `player_1.png` como referencia de identidad y estilo. El PNG conserva la transparencia. La hoja original y sus ataques se mantienen.

La hoja contiene ocho dibujos; el juego usa seis: contacto, apoyo y paso de cada pierna. Se omiten las dos poses de contacto redundantes de la cuarta columna. Se anexan como fotogramas 56–61, después del agarre, con recortes, escala y anclas de cadera individuales. El juego los refleja para caminar hacia la izquierda.

## Prompt inicial

Use case: identity-preserve.
Asset type: transparent pixel-art walking sprite sheet for an existing side-scrolling beat-em-up.
Input image: supplied player_1.png is the reference for exact character identity, outfit, proportions, palette and pixel style. Its first-row walk cycle is broken and repeats the same leg. Create ONLY a corrected walking sheet; do not reproduce its combat rows.
Character: Gomelo, swept black hair, sunglasses, short beard, navy blazer, open white shirt, charcoal trousers, white sneakers. Same stocky proportions and crisp chunky outlined pixel art as reference, no redesign.
Composition: EXACTLY EIGHT full-body sprites in FOUR columns and TWO rows, read left-to-right then next row. Generous transparent spacing between sprites, nothing overlaps, all face RIGHT, identical size, consistent pivot at pelvis and ground baseline within each row. Transparent background, no ground shadows, no text or labels.
Animation: one anatomically correct complete 8-frame walk loop, not running. Clearly distinguish near leg (lighter charcoal) and far leg (darker charcoal), and show BOTH legs taking turns stepping. Frame 1 near leg forward heel contact, far leg back toe-off; frame 2 near leg supporting, far knee bending to swing; frame 3 near leg planted under hips, far knee passes forward; frame 4 far leg extends forward while near heel lifts; frame 5 FAR leg forward heel contact and NEAR leg back toe-off, opposite of frame 1; frame 6 far leg supporting near knee swinging; frame 7 far leg planted near leg passes forward; frame 8 near leg extends forward and far heel lifts, smoothly closing the loop to frame 1. Arms swing gently opposite the legs. Slight vertical bob only, torso mostly upright. Important frame 5 must swap which leg is forward, not repeat frame 1. No stuck feet, no sliding stationary leg, no extra limbs, no fighting stance, no props. Preserve character silhouette, face, clothing and detailed 1990s arcade pixel-art style.

## Prompt de corrección final

Edit the supplied 8-pose transparent walk sheet. Keep the character appearance, scale, pixel art and 4-column 2-row layout. Correct the gait: currently the two rows repeat the SAME leg positions, which is wrong.
Redraw LOWER BODY and arm swing so ROW TWO is the OPPOSITE half-stride of ROW ONE. Keep all heads and torso design the same. Near-side trouser leg is light gray and far-side trouser leg dark gray, so the alternation is obvious.
Frame order, read left-to-right top row then bottom row:
TOP ROW: 1 LIGHT near leg straight forward/right, DARK far leg back/left; 2 LIGHT leg supporting vertical with foot flat under pelvis, DARK far leg bends behind; 3 LIGHT leg now extends BACK/LEFT, DARK far knee lifts FORWARD/RIGHT; 4 LIGHT leg BACK/LEFT toe touching ground, DARK far leg straight FORWARD/RIGHT heel touching ground.
BOTTOM ROW: 5 DARK leg FORWARD/RIGHT planted, LIGHT near leg BACK/LEFT trailing; 6 DARK leg vertical supporting, LIGHT near knee bends BEHIND/LEFT with heel raised; 7 DARK leg extends BACK/LEFT, LIGHT near knee lifts FORWARD/RIGHT; 8 DARK far leg BACK/LEFT toe touching, LIGHT near leg straight FORWARD/RIGHT heel touching, closing loop.
Critical: bottom-left sprite must show the LIGHT near leg pointing BACK/LEFT across the dark leg, and DARK far leg pointing FORWARD/RIGHT. This is a reverse contact pose, NOT a repeated top-left. Top-row THIRD sprite should have DARK far knee raised forward, LIGHT leg planted to the LEFT behind it. Hands swing naturally opposite legs, no bent high fighting fists. All sprites face RIGHT and stand on equal baselines. Exactly eight isolated full figures, no extra props/text/shadows, transparent background. Walking rather than high-knee marching.
