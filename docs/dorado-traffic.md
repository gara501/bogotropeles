# Agente Paredes y cruce de taxis · EL dorado

Solo EL dorado incorpora al agente de movilidad con señal PARE, inspirado en el personaje de la derecha de `ejemplos/taxista3.webp`. Nombre provisional: AGENTE PAREDES. Sprite `src/data/enemies/agente_pare.png` (1024×1536 RGBA), 24 poses recortadas y ancladas en `src/data/agentePare.js`. Camina despacio y encadena dos barridos y un remate descendente; prepara el primero 900 ms y los siguientes 720 ms, con recuperación entre golpes. Cada golpe causa 26 de daño con los multiplicadores del nivel. Cambiar de carril, saltar, esquivar o interrumpirlo permite evitar el combo.

Se restaura el recorrido completo de 25 enemigos: Ortencio, Agente Paredes y Uber José. Después de derrotar a 15, las oleadas paran y comienza una transición automática de una arena. Salen entre 8 y 15 taxis, repartidos por tres carriles y en ambas direcciones. Una franja amarilla intermitente y una flecha señalan el carril y la entrada 900 ms antes. Los taxis infligen 22 de daño; cambiar de carril o saltar permite evitarlos. Las colisiones usan barrido para no saltarse al jugador entre fotogramas. No hay tres carriles ocupados simultáneamente por vehículos. Se conserva el movimiento libre del jugador durante el desplazamiento de cámara.

Al terminar, continúan los diez enemigos restantes y el jefe Jugo Espinas. Pausa y muerte congelan el tráfico; cerrar/reiniciar destruye sus avisos y vehículos. El checkpoint del jefe salta también el cruce. Cada taxi reproduce `car_pass.mp3` al entrar. Agente Paredes usa `pipe.wav` en cada golpe y `agente_pare_die.wav` al morir.

Taxi `src/data/items/taxis.png` (1908×824 RGBA), dos perfiles independientes, basado en `ejemplos/taxi.avif`; recortes en `src/data/taxis.js`.

Pruebas rápidas en desarrollo:
- `?enemyTest=agente_pare`: agente y controles de combo.
- `?campaignPreview=taxis`: salta directamente al cruce, con daño habilitado.
- `?enemyTest=jugo`: conserva la prueba directa del jefe.

Validación: simulación del combate real (tres impactos, tiempos, daño y evasión), rangos/avisos/colisión/pausa/limpieza de taxis, bloqueo y continuación de oleadas y desplazamiento de cámara. No se ha verificado visualmente en un navegador interactivo.

## Prompts de generación (ImageGen integrado)

### Agente

Create a production animation sprite sheet for Street Bogotá, detailed crisp painted 1990s arcade pixel-art. Character is inspired ONLY by the man on the RIGHT of the photo: stocky middle-aged Colombian traffic mobility agent, royal-blue cap, royal-blue reflective jacket with broad silver stripes, navy trousers and black boots. Enemy nickname AGENTE PAREDES. His weapon is a handheld STOP traffic paddle: a large red octagonal sign with white border and clearly legible PARE letters, attached to a short sturdy pole, used as a heavy club. All poses hold this SAME sign; no other characters, no car, no scenery, no labels or borders. REAL TRANSPARENT BACKGROUND. EXACTLY 24 full-body separate poses in a 4 columns x 6 rows grid, with wide transparent margins around each, no overlap between cells. Generally faces RIGHT. Keep same body scale and grounded baseline across upright poses. Row 1: two idle guard poses holding sign upright and two distinct slow heavy walking poses. Row 2: four poses of heavy swing ONE: (1) long windup winding sign back at shoulder, (2) raised sign and tense body, (3) forceful horizontal sign bash to the right, (4) follow-through recovering. Row 3: four poses swing TWO: (1) pull sign across body, (2) two-handed side windup, (3) huge backhand sweep with sign to the right at chest level, (4) recovery. Row 4: four poses swing THREE: (1) lift sign high overhead with both hands, (2) pause at the top crouched for power, (3) slam sign downward toward right-front, (4) bent-knee recovery with sign low. Row 5: two hit recoil poses, stumble, seated knocked-down. Row 6: defeated stumble, collapsing to knees, fallen on back, final motionless fallen pose. Full weapon and entire body visible in every frame. Pose backgrounds pure alpha transparency.

### Taxis

Use case: stylized-concept. Create a production vehicle sprite sheet for Street Bogotá, matching detailed crisp painted 1990s arcade pixel-art. Use photograph as reference for the recognizable small yellow Bogotá taxi: compact yellow Hyundai-style hatchback, black bumpers, black trim, small TAXI roof sign, a dark-blue-shirt driver visible through the side window. EXACTLY TWO isolated vehicles, one above the other, two equal-height rows on transparent background. TOP ROW: perfect side-on profile driving RIGHT, front bumper on right. BOTTOM ROW: perfect side-on profile driving LEFT, front bumper on left. Each car is complete from bumper to bumper, both wheels and roof fully visible, equal size and ground baseline within each row, generous transparent margin between and around cars. Passenger door taxi markings understated, TAXI roof text readable, no exact license plate needed. No street or scenery, no people outside car, no speed trails, no cast ground shadow, no labels, no grid, genuine alpha transparency. Long landscape canvas, width roughly 2.3 times total height, each car four times wider than tall.
