# Magolita: combo de cuatro patadas

Cuatro pulsaciones de J encadenan patada frontal, patada baja, lateral y remate
alto. Cada patada tiene cuatro poses nuevas sin escoba: preparación, rodilla
recogida, contacto y recuperación. Solo la cuarta es remate y derriba.
Mantener J no repite el ataque automáticamente; recibir daño cancela la cadena.

Balance: daño 12 / 14 / 16 / 22 (64 total); alcance 96 / 96 / 104 / 112 px.
Antes, una patada tenía daño 36 y alcance 170 px. Los tres primeros impactos
mantienen al rival cerca y el cuarto tiene retroceso 28. La patada aérea usa
el primer movimiento con daño 12 y alcance 96. Los combos de puño y barrida
conservan sus rutas independientes. El panel de controles muestra ×4 COMBO.

Asset final: `src/data/players/player_5_kicks.png`, RGBA 1024×768, 16 celdas
de 256×192. Se apila después de las hojas anteriores (y=2772), frames 65–80;
contactos 67, 71, 75 y 79. Escala común de generación, pie de apoyo x=96,
suelo y=176 y pivote x=128 por celda. El atlas existente sigue intacto.

Generación: ImageGen integrado, con `src/data/players/player_5.png` como
referencia. Normalización reproducible:
`python scripts/prepare-magolita-kicks.py <imagen-generada.png>`.
Verificación de arte: márgenes alfa, baseline común y cuatro siluetas de
contacto distintas. Prueba del combo real en ambos sentidos, daño por golpe,
cancelación, pulsación mantenida, alcance y preservación del combo de puños.

## Prompt de generación

Use case: identity-preserve. Production animation sprite sheet for existing 2D arcade game. Reference image is Magolita's existing sprite sheet. Create NEW FOUR KICK ANIMATIONS preserving EXACTLY her identity and existing pixel illustrated style: short stocky Colombian cleaning lady, brown hair bun, round face, royal-blue short-sleeve uniform shirt, navy pants, light blue apron with white waist bow, purple gloves, black work shoes. Face RIGHT in three-quarter side view in every pose. NO mop, broom, bucket or other weapons: all attacks use her legs. EXACTLY 16 separate full-body poses in a strict FOUR columns by FOUR rows equal-cell grid. Each row is ONE four-frame kick animation: column1 anticipation, column2 leg chamber, column3 fully extended CONTACT pose, column4 recovery foot returning toward ground. Row1 quick front kick at waist height with right leg; Row2 distinct low shin kick with other leg; Row3 side kick at waist height with torso leaning back; Row4 strong finishing high forward kick at chest height, remain facing right and keep planted supporting foot on baseline. Four distinct readable leg silhouettes and natural believable anatomy; only two legs and two arms in each pose. Both hands empty and held up defensively. Preserve consistent face, head size, body volume, palette, clothing and pixel scale over all sixteen poses; adult full height about 180 pixels per cell if 256px cells. Keep common horizontal hip anchor and common ground baseline within each row; planted shoe at same y, at least 18 pixels transparent margin on every cell edge. Wider kicks have enough room to show full extended black shoe. Clean dark outlines, crisp pixel clusters matching original raster art; no blur, no gradients on background. Actual transparent background. No scene, words, labels, grid lines, extra figures, speed effects, shadows or clipped limbs. Do not copy the original broom attack; draw authentic leg kicks.
