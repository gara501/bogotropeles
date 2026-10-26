# Bonus: El ring de los traques

Después del nivel jugable 6 (Chorro de Quevedo), antes de Palomojao. No cambia la numeración de la campaña ni el bonus de la chiva.

Orden: Cristiano Violencia → Piernas Locas → Brincolas Rataquieta → MiniLaja. Un único reloj de 120 segundos después de la cuenta regresiva. Los cuatro derrotados antes del límite otorgan exactamente 10.000 puntos; no hay puntos individuales ni premio parcial. El bonus se juega una vez por partida. Timeout o KO continúa la campaña sin descontar vidas ni permitir reintentar el bonus para duplicar premios.

Cristiano: ráfaga recta con ojos cerrados, dos segundos de cansancio vulnerables, botes para esquivar y llanto al recibir golpes. Piernas: paso tambaleante, piernas largas, billetes y monedas, patada de alcance 175. Brincolas: saltos al otro lado, brazos abiertos, cachetadas y risa. MiniLaja: puños y gorras; bajo el 20% salta lejos y baila dos segundos para curar 10% de HP máximo. Interrumpir el baile evita la curación; enfriamiento de 12 segundos.

Sprites de 24 poses cada uno en `src/data/enemies/ring/`; fondo y proyectiles en `src/scenes/ring/`. Texturas preparadas con recortes medidos, conservando los PNG originales y su transparencia. El frente del ring está libre de cuerdas que tapen a los jugadores. Campana y risa con efectos originales sintetizados. Cristiano utiliza `cristiano_appear.wav` al entrar y `cristiano_hurt.wav` cuando llora al recibir golpes.

Prueba en desarrollo: `http://127.0.0.1:5173/?bonusTest=ring&character=student`. Controles auxiliares solo en desarrollo; el reloj público permanece en dos minutos.

## Generación de arte

Archivos finales en el proyecto:

- `src/scenes/ring/background.png`
- `src/scenes/ring/projectiles.png`
- `src/data/enemies/ring/cristiano.png`
- `src/data/enemies/ring/piernas.png`
- `src/data/enemies/ring/brincolas.png`
- `src/data/enemies/ring/minilaja.png`

Verificación: 412 pruebas aprobadas, build de producción correcto, secuencia completa y premio comprobados con los controles de desarrollo en el navegador. Captura del resultado: `docs/ring-victory-preview.png`.

Habilidad imagegen, herramienta integrada. Referencias proporcionadas: ring.webp, westcol.jpg, arrieta.jpg, cossio.jpg y crisval.jpg. Vestuario sin marcas/logotipos.

### cristiano (primera versión; sustituida)

Use case: stylized-concept. Production sprite sheet for Colombian pixel art side scrolling beat-em-up, detailed 1990s arcade shading, dark outlines, match Street Bogota. Full body sprites, facing RIGHT in three-quarter side view. True transparent background. Exact 4 columns x 6 rows =24 isolated poses, regular grid on 1024x1536 canvas, generous empty margins between every sprite, feet aligned within each cell. NO labels, numbers, logos, text, ground or shadows. Same character costume and scale across all poses, arms and feet fully contained in cell; poses 0..23 in row-major order. Fictional comic fighter Cristiano Violencia, young slim adult man, black cap, plain oversized black sweatshirt with one unlettered white chest stripe, dark trousers, sneakers. Use reference for face and clothes without any branding. Poses row1: idle guard, walking contact left, walking passing, walking contact right. Row2: eyes firmly closed flailing fists forward 4 different arm motions. Row3: tired hands on knees, tired deep breath, tired head hanging, tired recovering. Row4: cartwheel start, inverted hands on ground legs split, cartwheel landing, dodge ready. Row5: hit crying eyes, wiping tears, sobbing hands up, crying recoil. Row6: slap/punch windup, punch extend, defeat falling, defeat lying.

### piernas

Use case: stylized-concept. Production sprite sheet for Colombian pixel art side scrolling beat-em-up, detailed 1990s arcade shading, dark outlines, match Street Bogota. Full body sprites, facing RIGHT in three-quarter side view. True transparent background. Exact 4 columns x 6 rows =24 isolated poses, regular grid on 1024x1536 canvas, generous empty margins between every sprite, feet aligned within each cell. NO labels, numbers, logos, text, ground or shadows. Same character costume and scale across all poses, arms and feet fully contained in cell; poses 0..23 in row-major order. Fictional comic fighter Piernas Locas based on reference: tattooed young adult man with black fringe, charcoal shirt, dark pants, sneakers. Exaggerated comically long legs about TWO THIRDS total body height, short torso, keep legs consistently long. Poses row1 idle guard, drunken bow-legged walk left contact, wobbly passing, walk right contact. Row2 long kick windup, leg extended horizontal, high long kick, kick recovery. Row3 throwing money windup, banknotes toss, coin flick, recovery. Row4 four staggered unsteady drunken boxing poses. Row5 four hit recoils. Row6 crouch, taunt, defeat falling, defeat lying. Do not draw floating projectiles outside hands.

### brincolas

Use case: stylized-concept. Production sprite sheet for Colombian pixel art side scrolling beat-em-up, detailed 1990s arcade shading, dark outlines, match Street Bogota. Full body sprites, facing RIGHT in three-quarter side view. True transparent background. Exact 4 columns x 6 rows =24 isolated poses, regular grid on 1024x1536 canvas, generous empty margins between every sprite, feet aligned within each cell. NO labels, numbers, logos, text, ground or shadows. Same character costume and scale across all poses, arms and feet fully contained in cell; poses 0..23 in row-major order. Fictional comic fighter Brincolas Rataquieta based on reference: athletic adult man, short black top haircut, bare heavily tattooed chest and arms, black trousers sneakers. Poses row1 idle wild grin, walk contact left, passing, contact right. Row2 slap windup open palm, huge open-hand slap extended, opposite hand slap, recovery. Row3 laughing arms spread standing, arms spread crouched jump prep, arms wide airborne legs tucked, arms spread landing. Row4 four airborne leaping acrobatic poses arms spread. Row5 four damage recoil poses. Row6 grin, doubled over laughing, defeat falling, defeat lying.

### minilaja

Use case: stylized-concept. Production sprite sheet for Colombian pixel art side scrolling beat-em-up, detailed 1990s arcade shading, dark outlines, match Street Bogota. Full body sprites, facing RIGHT in three-quarter side view. True transparent background. Exact 4 columns x 6 rows =24 isolated poses, regular grid on 1024x1536 canvas, generous empty margins between every sprite, feet aligned within each cell. NO labels, numbers, logos, text, ground or shadows. Same character costume and scale across all poses, arms and feet fully contained in cell; poses 0..23 in row-major order. Fictional comic fighter MiniLaja based on reference: short stocky young adult man, black baseball cap without logo, black T shirt, gold chain neck tattoos earrings, black jeans white sneakers. Poses row1 idle guard, walk contact left, passing, contact right. Row2 punch windup, straight punch, hook punch, recovery. Row3 cap throw windup holding cap, throw cap fully extended hand, without cap followthrough, cap back on. Row4 four distinct reggaeton dancing poses hips moving, knees bent, arms alternating. Row5 four hurt recoils. Row6 jump crouch, leap airborne to opposite side, defeat falling, defeat lying.

### Escenario

Use case: stylized-concept. Create production 16:9 1536x864 opaque pixel art background for Street Bogota 1990s detailed arcade beat-em-up BONUS boxing ring, inspired by attached reference. Camera mostly side-on, low elevated view but flat walkable large blue canvas apron in LOWER HALF, playable strip y=310 to495 at 960x540 logical scale; ring extends x70 to890, back ropes at y285 only, side corner posts outside x65 and895. Dark arena seats behind, dramatic red/blue spotlights rig, festive nighttime boxing event. No people, no fighters, NO text or logos. IMPORTANT front ropes must NOT cross playable space, omit front ropes entirely so player sprites and feet remain visible. Broad clean blue ring floor bottom half, back corners and ropes entirely behind fighters. Crisp square pixel shading, palette matches Colombian game, detailed but visually quiet combat floor. No interface, bars or timer.

### Proyectiles

Use case stylized-concept. Transparent pixel art game projectile atlas, horizontal row of THREE isolated objects, 1536x512 canvas, each object centered in its own equal 512x512 cell with large empty margins. First cell: black baseball cap without any logo, viewed side-on flying with brim facing left. Second cell: single folded green paper banknote with abstract non-readable design. Third cell: shiny gold coin seen almost face on, no symbols or text. 1990s arcade beat em up art, bold dark pixel outlines, colored highlight shading, true transparent background, NO glow, NO motion trail, NO labels, no letters, no numbers. These are individual projectiles for boxing bonus.

Cristiano fue regenerado con `ejemplos/cris.png`. El prompt y los detalles actuales están en [cristiano-appearance-v2.md](cristiano-appearance-v2.md).

MiniLaja: `minilaja_appear.mp3` al aparecer, `male_grunt.mp3` cuando recibe golpes y `minilaja_die.mp3` al morir.

Brincolas: `brincolas_appear.mp3` al aparecer, `male_grunt.mp3` al recibir golpes (sustituto mientras falta la grabación específica `man_hurt.mp3`) y `brincolas_die.mp3` al morir.

Piernas Locas: `piernas_locas_appear.mp3` al aparecer, `male_grunt.mp3` al recibir golpes (sustituto mientras falta la grabación específica `male_hurt.mp3`) y `piernas_locas_die.mp3` al morir.
