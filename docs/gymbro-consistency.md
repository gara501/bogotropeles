# Gymbro: continuidad entre combate y carrera

La carrera anterior tenía un cuerpo más delgado, una silueta de cabeza/hombros más estrecha y menos volumen de brazos que el modelo usado por los combos. Se ha tomado el arte de combate como referencia canónica y corregido la carrera desarmada y las variantes con vuvuzela y panela.

Archivos finales:

- `src/data/players/player_4_run_consistent.png`
- `src/data/players/gymbro_vuvuzela_motion_v3.png`
- `src/data/players/gymbro_panela_motion_v3.png`

Los ciclos conservan ocho poses, los índices 50–57 del atlas de carrera, los apoyos de los pies, la dirección y la cadencia de tres ticks por pose. La carrera desarmada queda a 206 px de altura de origen y se importa con el factor existente 0,96 (197,76 px), frente a 198 px de la guardia. Las variantes con objeto usan directamente esa escala nativa de 198 px. No se cambia la velocidad de desplazamiento ni el funcionamiento de los ataques.

Generación: edición con la herramienta integrada `image_gen`, usando la hoja de carrera como objetivo de movimiento y poses de combate como modelo de identidad. Referencias, fuentes y prompts completos: `prompts/gymbro-consistency/generation.json`. `scripts/prepare-gymbro-consistency.py` reproduce la normalización y la comparación animada. La limpieza de alfa se comparte con la preparación de los objetos mediante `scripts/held_art_utils.py`.

Comparación: `docs/gymbro-consistency.gif` (carrera anterior, carrera corregida, combate, vuvuzela, panela). La validación comprueba tamaño corporal, silueta superior y volumen visible de brazos frente a la guardia de combate, además de los controles generales de transparencia y animación.

Verificación final: 770 pruebas aprobadas; compilación de itch completada; ZIP revisado por CRC y presencia de las tres hojas nuevas. Captura en juego: docs/gymbro-consistency-game.png.
