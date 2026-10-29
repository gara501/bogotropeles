# EL dorado

Orden: Calles del centro → EL dorado → Zona Rosa. ID de combate estable: 8.
Recorrido completo: 25 enemigos entre Ortencio, Agente Paredes y Uber José. Después de 15 aparece el cruce de 8–15 taxis, seguido de diez enemigos y Jugo Espinas. Detalles y accesos de prueba en `docs/dorado-traffic.md`. `/?enemyTest=ortencio` conserva el combate de cooperación con Uber José.

Jefe: JUGO ESPINAS, sprite `src/data/bosses/jugo_boss.png`, intro `src/scenes/boss-intros/jugo.png`.
Ataques: carrera con agarre y dos cabezazos, barrigazo cercano (pose 13) y taxímetro a distancia (pose 6). Al llegar al 50% de vida hace una transición rojiza y añade tres pasadas rápidas en forma de bola. Los ataques de carrera y bola anuncian y fijan su carril para poder esquivarlos.
Las 16 poses nuevas de carrera, agarre, cabezazo, bola y recuperación están en `src/data/bosses/jugo_attacks.png`, anexadas al atlas original. El agarre se libera al segundo golpe, al interrumpir al jefe, al morir cualquiera de los dos o al cerrar la escena. La bola deja una recuperación vulnerable.
El taxímetro recorre los primeros ocho cuadros de `src/data/items/taximetro.png`; al impactar muestra los ocho cuadros restantes y aplica daño una sola vez.
Saltar, cambiar de carril o agacharse permite esquivar el proyectil. Agotar el recorrido también dispara su animación de explosión.
Audio: usa la música de jefe existente; las voces y efectos nuevos quedan pendientes.

Pruebas locales con `npm run dev`:

- `/?campaignPreview=dorado`: nivel completo, con botones para resolver las oleadas.
- `/?enemyTest=jugo`: combate directo con Jugo, invulnerabilidad de prueba y controles de combate.
- `/?bossIntroTest=jugo`: intro del jefe.

## Fondo

Prompt de la panorámica final (ImageGen integrado, con el fondo inicial como referencia):

> undefined

Archivo final: `src/scenes/level8/panorama.png`.
Generado con la herramienta integrada ImageGen usando `ejemplos/dorado.avif` como referencia arquitectónica, convertido temporalmente a PNG para la herramienta.
La panorámica conserva su proporción original de 2109×745 y recorre el ancho disponible de la imagen a lo largo de los 3840 px del nivel, sin estirar los taxis ni la fachada. `repeat:false` limita el desplazamiento a sus bordes. Una segunda capa recorta el asfalto y lo desplaza a la velocidad real del mundo para evitar la sensación de ralentización al aparecer GO. Las dos capas comparten una sola textura fuente. La versión inicial se conserva en `background.png` como referencia.

Prompt inicial:

> Use case: stylized-concept. Create one production game background for a side-scrolling beat-em-up called Street Bogotá. Use the attached airport photograph as architectural reference only (El Dorado terminal, sweeping roof, glass facade, gold EL DORADO sign, taxi pickup lanes), no real people. Output a single landscape 16:9 image, ideally 960x540. Painterly pixel-art arcade background matching a 1990s detailed urban beat-em-up, crisp chunky textures, muted blue-grey glass and concrete, golden yellow taxis parked BEHIND the play area at terminal curb. Strict side-on game camera with shallow depth, no diagonal road vanishing point. Sky and curved terminal roof upper third, glass facade and readable EL DORADO sign middle band, curb at 72% image height. Entire lower 28% is empty uninterrupted asphalt fighting floor with subtle wear, absolutely no obstacles, cars or people in foreground. No UI, no characters, no border. Tile-friendly left and right edges. Daylight Bogotá overcast sky.
