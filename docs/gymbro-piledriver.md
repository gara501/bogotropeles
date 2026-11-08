# Gymbro: spinning piledriver

Referencia de movimiento: el manual de Capcom de Final Fight 2 describe agarrar,
saltar y luego pulsar ataque para el spinning piledriver de Haggar. Consulta:
https://www.world-of-nintendo.com/manuals/super_nes/final_fight_2.shtml
La animación es nueva y conserva el personaje de Gymbro; no reutiliza sprites
de Final Fight.

## Controles y comportamiento

Acércate a un rival agarrable hasta sujetarlo. Pulsa Espacio para saltar con él
y después H, antes de aterrizar, para iniciar el giro y el piledriver.
En controles táctiles se usan Salto y luego Puño. Solo Gymbro tiene esta acción.
Si no se pulsa puño durante el salto, ambos aterrizan y continúa el agarre normal;
el tiempo límite del agarre sigue contando.

El rival conserva su propio sprite: se eleva junto a Gymbro, se invierte durante
el giro vertical y aterriza entre las piernas en la caída sentada. La rotación,
escala horizontal, sombra, barra de vida y altura se restauran al terminar o al
cancelar el agarre. Recibir daño interrumpe el movimiento; pausa congela ambas
alturas. Reinicio y muerte del rival también limpian el movimiento.

Un único impacto al aterrizar causa **110 de daño**, frente a los 55 del
lanzamiento habitual de Gymbro (42 × 1,3 redondeado). El rival queda derribado
con una fase de aturdimiento de **90 frames / 1500 ms**, más larga que los
42 frames normales. El ataque no consume energía de especial. La recuperación
de Gymbro dura 20 frames y la altura máxima es 130 px.

Al aterrizar también golpea una vez a los otros enemigos que estén debajo o
inmediatamente junto al punto de caída: daño del puño normal de Gymbro (38),
sin el derribo/aturdimiento especial del rival agarrado. El contacto se comprueba
en un radio horizontal de 56 px más la caja corporal del rival y en el mismo
carril. No alcanza a rivales elevados, invulnerables o en otros carriles, y el
rival agarrado queda excluido para evitar aplicarle daño doble.

Respeta los límites del escenario. Un piledriver ya iniciado se resuelve antes
del escape de esquina del rival agarrado; los jefes continúan sin poder agarrarse.
Los rodillazos y lanzamientos anteriores siguen disponibles.

## Assets y generación

Generado mediante ImageGen integrado con `src/data/players/player_4.png` como
referencia de identidad. Archivo final:
`src/data/players/player_4_piledriver.png`, RGBA 1024×768, doce celdas 256×256.
Se apila después de las hojas existentes en y=2938, frames 58–69; contacto 67.
Una sola escala iguala la guardia nueva a la altura de referencia de 198 px.
Pivote x=128 y suelo y=232 por celda.

Normalización: `python scripts/prepare-gymbro-piledriver.py <imagen-generada.png>`.
Previews: `python scripts/preview-gymbro-piledriver.py [grabacion.json]`.
`gymbro-piledriver-preview.gif` contiene una grabación real del juego;
`gymbro-piledriver-art.gif` muestra las doce poses del atlas.

## Verificación

Pruebas de ejecución en ambos sentidos, daño único en el contacto, aturdimiento
prolongado, salto sin puño, pausa, interrupción, muerte antes/durante el impacto,
reinicio, bordes y pulsaciones repetidas. También se comprueban los doce recortes
y sus márgenes transparentes. Reproducción en Chrome: una víctima de 1000 HP
quedó en 890, se invirtió durante el giro, aterrizó con 90 frames de aturdimiento
y recuperó su rotación original; Gymbro volvió al estado de caminar.

## Prompt de generación (ImageGen integrado)

Use case: identity-preserve. Create a production 12-frame animation sprite sheet for Gymbro in an existing 2D pixel-art arcade beat-em-up. Reference is Gymbro's exact character sprite atlas: muscular adult Colombian man, short black hair, full black beard, black sleeveless tank top, gray athletic trousers, black sneakers with white soles, black wristbands. Preserve identical face, anatomy, muscles, clothing, colors and chunky dark-outlined pixel illustration quality. NEW WRESTLING SPINNING PILEDRIVER animation inspired by an arcade wrestler's jump -> vertical spin -> seated slam. Draw ONLY GYMBRO, no opponent; opponent is a separate game sprite added at runtime. Arms/hands must grip an invisible opponent's waist in front of his abdomen, with enough empty space above/between the arms for that separate upside-down opponent. Exactly TWELVE separate full-body frames in FOUR equal columns by THREE equal rows, common body scale and horizontal pelvis pivot, generous transparent margin every cell; no clipping. Sequence left to right top to bottom: 0 crouched low preparing to lift, both arms wrapping invisible waist; 1 lifting upward, arms clasped forward at abdomen, rising; 2 airborne front-right three-quarter, knees tucking up, hands locked forward; 3 airborne right/back three-quarter beginning a spin about vertical body axis. 4 airborne full back view with hands around invisible waist in front, knees bent; 5 airborne left three-quarter side rotating; 6 airborne front three-quarter again, hands still gripping forward, legs spreading for landing; 7 airborne seated piledriver stance, legs apart, hands holding imaginary upside-down waist between his thighs. 8 descending seated stance, boots extended apart; 9 seated ground slam impact pose, butt low on imaginary ground, legs apart, arms firmly holding the imaginary opponent at waist; 10 release and deep crouched recovery with empty hands; 11 stand back into original combat guard facing RIGHT. This is NOT a somersault: torso stays upright, rotation happens around vertical spine. No extra people, no opponent body parts, no text, labels, floor, shadows, effects, props, checkerboard, speed lines. Actual transparent background. Keep the same head size and limb mass across standing, crouched, back-view and seated frames; do not scale seated poses to standing height.
