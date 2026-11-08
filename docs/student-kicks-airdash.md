# Maca Demia: patadas y rebote aéreo

## Controles y balance

- J → J → J: combo nuevo de patada frontal, patada baja y remate alto.
  Daño 22 / 24 / 32, alcance 100 / 104 / 118 px. Solo el tercero derriba.
- Durante el salto: Shift y luego J dentro de 12 frames, o Shift + J juntos.
  Espacio + Shift + J simultáneos también inician la patada aérea.
- Dash aéreo: velocidad 660 px/s, daño 26, alcance 86 px, derribo y retroceso 32.
  Usa una animación propia y no consume energía de especial.
- Un impacto que realmente quita vida a un enemigo y no es bloqueado hace
  rebotar a Maca Demia. El rebote dura 34 frames, eleva el cuerpo y permite
  volver a usar Shift + J contra otro enemigo antes de tocar el suelo.
- Un fallo, una paloma/caja, un rival invulnerable o un escudo frontal no
  conceden el rebote. Solo hay un dash por vuelo salvo impacto confirmado.
- Daño, caída o reinicio cancelan el movimiento; pausa congela su progreso.
  La altura está limitada a 120 px para evitar acumular ascenso indefinido.
- Se conserva H → H → J, la patada aérea normal, L, los libros y la barrida
  en el suelo. Las rutas de combos mixtos y de patadas se guardan por separado.

## Arte y procedencia

Generado con ImageGen integrado, usando `src/data/players/player_2.png` como
referencia de identidad y estilo. Archivo final:
`src/data/players/player_2_kicks_air.png`, RGBA 1536×1280, 20 celdas de 384×256.
Tres filas de patadas, una fila de dash aéreo y una fila de rebote.

Frames 66–85, apilados en y=3195 después de las hojas existentes; contactos
68 / 72 / 76 / 80. Escala corporal común, pivote x=192, suelo y=232.
Las poses del atlas anterior siguen disponibles para el combo mixto.

Normalización: `python scripts/prepare-student-kicks.py <imagen-generada.png>`.
Separa las 20 figuras por alfa, elimina spill con la misma regla del personaje
y alinea los pies sin deformar cada pose para llenar la celda.

Previsualización: `python scripts/preview-student-kicks.py [grabacion.json]`.
`student-kicks-preview.gif` muestra las tres patadas; `student-airdash-preview.gif`
es una grabación del juego con dos impactos, dos rebotes y aterrizaje normal.

## Verificación

Pruebas del combo mixto y de patadas, desplazamiento y derribo en ambos sentidos,
rebote contra un segundo rival, inmunidad del rival derribado, fallos, escudos,
cancelación por daño, pausa, pulsación mantenida y controles simultáneos.
Se verifican los márgenes, baseline y siluetas de las 20 celdas del atlas.
La reproducción en navegador confirmó dos impactos de daño 26 en la pose 80,
dos rebotes y regreso al suelo.

## Prompt de generación (ImageGen integrado)

Use case: identity-preserve. Production animation sprite atlas for existing 2D pixel illustrated arcade beat-em-up. Preserve EXACTLY the woman in reference: Maca Demia, young Colombian university student, very long loose chestnut brown hair, off-shoulder white long-sleeved crop top with dark brown trim at chest and cuffs, fitted blue jeans, dark belt, white sneakers. Match original hand-painted pixel sprite style, dark outlines, same face, anatomy, proportions, palette and costume. NO books, weapons or other props. All poses three-quarter SIDE VIEW FACING RIGHT. Exactly TWENTY isolated full-body frames in FOUR equal columns and FIVE equal rows with generous transparent gutters, entire hair and shoes visible. ROW1 frames0-3 fast waist-high front kick: defensive anticipation, knee chamber, fully extended contact leg to right, recovery. ROW2 frames4-7 distinct low shin kick using the other leg: anticipation, chamber, contact, recovery. ROW3 frames8-11 high roundhouse finishing kick: windup lean, chamber, full extension at upper chest height to right, recovery. Ground rows have planted supporting shoe aligned to a shared foot baseline and stable hip pivot. ROW4 frames12-15 AIR DASH KICK: airborne tuck anticipation, body stretching horizontally rightwards with one extended sneaker, decisive fully extended flying side kick contact to right with trailing long hair and bent trailing leg, retraction. ROW5 frames16-19 BOUNCE/REBOUND after connecting: springing upward with knees bent, airborne rising defensive tuck with hair floating downward, apex ready pose knees raised, descending toward landing one foot reaching downward. Airborne poses are distinct from grounded kicks, keep same physical body scale rather than enlarging or shortening anatomy. Hands empty and held defensively; two arms and two legs only. Keep common horizontal hip axis in every cell, place imaginary ground at same y in all cells and show the air frames visually elevated slightly. Clean pixel clusters, crisp silhouette; no motion streaks, no scenery, no text, labels or grid. ACTUAL transparent background; no shadow; no limbs or hair crossing cell boundaries. At least 18px transparent margin every cell.
