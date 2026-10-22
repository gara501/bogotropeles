# Malabarista y evasión de jefes

## Malabarista
- Nuevo enemigo en los niveles 2, 3, 5, 6 y 7; conserva los totales de las oleadas.
- 110 HP base, velocidad 220, daño cuerpo a cuerpo 5 y alcance 65.
- Lanza ráfagas de tres pinos con daño 18 por impacto (antes del escalado de nivel), alcance de 175 a 620 y aviso de 500 ms. Apunta a la posición del jugador al iniciar la ráfaga; permite esquivar cambiando de carril o saltando.
- Busca distancia de 270. A menos de 100 salta y cambia de carril; si está contra una pared, cruza sobre el jugador. El salto tiene cooldown de 150 frames, por lo que puede agarrarse durante recuperación o aturdimiento.
- Hoja propia de 20 poses: malabares, carrera, lanzamiento, daño, caída, salto y forcejeo. No requiere animaciones nuevas de los jugadores.
- Assets: `src/data/enemies/malabarista.png`, `src/data/UI/juggling_club.png`.
- Prueba local de desarrollo: `?enemyTest=malabarista&character=gymbro`.

## Siete jefes de campaña
- Regla común en ambos bordes del área actual, incluyendo escenarios con scroll.
- Tras dos impactos dentro de 1400 ms junto a un borde, salta hacia el interior y cruza al atacante.
- También detecta 900 ms de presión cercana sin segundo impacto: cubre escudos y pausas de impacto que antes perpetuaban el encierro.
- Evasión de 600 ms, protección de aterrizaje de 180 ms, cooldown de 900 ms después del salto.
- La trayectoria avanza por tiempo de combate antes de hitstop/controladores especiales. Pausar el juego conserva la pausa.
- Respeta entradas, cambios de fase, escudos temporales y stomps aéreos. Limpia acciones, marcadores y tokens usando los controladores de Brayatan y Don Pacho.
- Se conservan los ataques particulares y las ventanas de daño fuera de esa evasión.
- El controlador antiguo Dormilón no forma parte de los siete niveles actuales y no se modificó.

## Generación de assets
Generados con ImageGen integrado, usando `ejemplos/malabarista.jpg` como referencia de aspecto. PNG con transparencia. Recortes y pivotes declarados en `src/data/juggler.js`.

### Prompt de hoja de personaje
Use case: stylized-concept / game animation sprite sheet. Create a production sprite sheet for a side scrolling hand painted pixel arcade beat em up in Bogota. The attached photograph is the CHARACTER REFERENCE ONLY, not the scene: young lean athletic street juggler, short swept brown hair, light beard and ear plug, loose RED T SHIRT, knee-length KHAKI SHORTS, WHITE SOCKS and black skate sneakers. Preserve this distinctive outfit. Render the man in chunky crisp dark outlines and rich pixel-art shading matching Final Fight style illustrated sprites, full-body three-quarter SIDE VIEW facing RIGHT. True transparent background, NO photographic surroundings, no text or guides or shadows. EXACTLY 20 separate full-body poses, in FOUR EQUAL COLUMNS and FIVE EQUAL ROWS; generous empty cell padding, equal scale and aligned feet per cell, pelvis on consistent cell pivot. Frame every entire body, held club and detached juggling clubs, never touch cell borders. Club design: small magenta or orange bulb with narrow white handle and black end cap, about forearm length, visibly held or juggled. ROW 1 (frames 0-3): idle ready pose holding three clubs low (0), then three juggling cycle poses with clubs floating a little above his hands (1,2,3). ROW 2 (4-7): four distinct agile running/walking steps facing right while holding the clubs close to chest. ROW 3 (8-11): long-range attack with one club: telegraph raised hand (8), draw throwing arm behind shoulder (9), decisive rightward RELEASE with fully extended throwing arm and visible club still right at fingertips (10), recovery retracting hand (11). ROW 4 (12-15): two hurt reactions (12,13), knocked down falling (14), lying defeated on the floor (15). ROW 5 (16-19): crouch preparing evasive hop (16), airborne agile tucked knees hop toward right (17), grabbed struggling with bent elbows (18), grabbed struggling twisting shoulders (19). Same man and same clothes in every frame. Strict 4x5 layout, transparent alpha, no scenery, no lettering. Small clubs do not exceed one forearm. Avoid glow or motion trails.

### Prompt del proyectil
One isolated juggling club projectile sprite for a pixel art side scrolling beat em up. Horizontal orientation: narrow white handle with small black end cap on LEFT, elongated vivid MAGENTA pink bulb on RIGHT. Sleek smooth bowling-pin-like circus juggling club, clearly long narrow handle, as the clubs in the attached reference photograph. Forearm-sized object, entirely visible with transparent margin. Chunky dark navy outline, hand-painted pixel arcade shading, crisp tiny-game readable silhouette. Truly transparent background. NO person, no text, no shadow, no scene, no glow, no variants. Only ONE club, side view, 5:1 length to width.
