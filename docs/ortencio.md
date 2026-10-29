# Ortencio

Nuevo enemigo de apoyo de EL dorado, inspirado en `ejemplos/taxista2.jpg`: polo naranja rojizo, bigote, pelo entrecano, jeans y zapatos oscuros.

Sprite final: `src/data/enemies/ortencio.png`, 1024×1536 RGBA, generado con ImageGen integrado. Sus 24 poses cubren reposo, caminar, carrera, aviso rojo, alcanzar/sujetar, salto evasivo, daño y derrota. Los recortes y anclajes están en `src/data/ortencio.js`.

## Comportamiento

- Se pone rojo y avisa durante 48 fotogramas antes de correr hacia el carril que ocupaba el jugador. Saltar, cambiar de carril o usar dash permite esquivarlo.
- Si alcanza al jugador lo sujeta hasta tres segundos. Ortencio no hace daño al agarrar: libera su turno de ataque para que sus compañeros puedan golpear, respetando la invulnerabilidad normal entre impactos.
- Se escapa con seis pulsaciones separadas de ataque, salto o dash. Un derribo también corta el agarre. Liberarse concede una protección corta.
- Los ataques cercanos provocan pequeños saltos evasivos con probabilidad alta y un enfriamiento de 1,3 segundos. También puede recibir golpes, ser agarrado o lanzado y ser derrotado como los demás enemigos.
- Daño a Ortencio, muerte, reinicio, cambio de personaje y cierre de escena liberan al jugador. La pausa congela sus tiempos.

La campaña completa presenta a Ortencio primero, junto a Agente Paredes y Uber José. Hay 25 enemigos y un cruce intermedio de taxis; ver `docs/dorado-traffic.md`. Las pruebas directas del jefe siguen disponibles.

`/?enemyTest=ortencio` abre una prueba con Ortencio y Uber José. El botón «Aviso rojo + agarre» permite repetir la carrera. La prueba usa el registro separado habitual y no inicia el jefe al acabar.

## Prompt utilizado

> Use case: stylized-concept. Create a production animation sprite sheet for a new Street Bogotá beat-em-up enemy named ORTENCIO, using the supplied photograph only as a character appearance reference. Middle-aged stocky Colombian taxi driver, short curly salt-and-pepper hair, prominent dark mustache, rust orange short-sleeve polo shirt, blue jeans, dark brown shoes. Friendly street-driver appearance turned into a determined grappler, exaggerated arcade proportions, 1990s detailed painted pixel-art matching Street Bogotá. No car, no photo scenery, no weapons, no second character, no text. EXACTLY 24 FULL BODY SEPARATED POSES in a precise 4 columns by 6 rows sheet, real transparent background. Generous transparent spacing around every pose; keep each entirely inside its own cell. All upright poses same scale and baseline, generally facing RIGHT. Row 1: (1) idle ready with open hands, (2) second idle, (3) walking left leg forward, (4) walking right leg forward. Row 2: four distinct fast running poses, alternating legs and arms, leaning forward toward a grab. Row 3: (1) blushing red angry face and flexed arms telegraphing a charge, (2) lunging forward BOTH arms reaching for shoulders, (3) pulling an imaginary opponent toward himself with BOTH hands, (4) holding an imaginary opponent by both shoulders at arm's length, solid braced stance. DO NOT draw an opponent. Row 4: (1) crouch preparing a hop, (2) airborne small evasive jump with knees bent, (3) airborne dodge side-hop, (4) landing with knees bent. Row 5: (1) hit recoil, (2) second hit recoil, (3) falling backwards off balance, (4) knocked down seated. Row 6: (1) defeated stumble, (2) collapsing to knees, (3) lying on back defeated, (4) motionless final fallen pose. Pure transparent background, no shadows connecting poses, no borders or labels.
