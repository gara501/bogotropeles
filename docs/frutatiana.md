# Doña Frutatiana

Enemiga de Plaza de Palomojao, nivel 7 de la campaña, después de Chorro de Quevedo.

- 190 HP base, velocidad 145, golpe cercano de 5.
- Naranjas: 12 de daño base, arco de 105 px, objetivo fijado al soltar la fruta.
- Patillas: probabilidad del 28% por lanzamiento, 22 de daño base, radio de 80 px y profundidad de 34 px. Estallan una sola vez al caer, con pulpa y fragmentos de cáscara; no dejan daño persistente.
- Marca de caída visible; esquivar por profundidad, desplazarse o saltar evita el impacto.
- Recarga base entre lanzamientos: 1.9 s, además de preparación y recuperación. El daño y la cadencia respetan la dificultad del nivel.
- Animaciones: reposo, caminar, lanzar naranja, lanzar patilla, empujón, daño, derrota y forcejeo.

Prueba jugable: http://127.0.0.1:5173/?enemyTest=frutatiana&character=office . Incluye botones para forzar ambas frutas; el player es invulnerable en esta prueba de desarrollo.

Assets finales: `src/data/enemies/frutatiana.png`, `src/data/UI/frutatiana_fruit.png`. Generados con la herramienta integrada image_gen a partir de `ejemplos/vendedora.avif` y el estilo del malabarista.

## Prompt del personaje

Use case: stylized-concept. Create a production transparent pixel-art enemy sprite sheet for a 1990s arcade beat-em-up. Image 1 is character inspiration: older Colombian female fruit vendor, dark hair tied back, lime green market vest over black short-sleeved shirt, dark blue trousers and practical dark shoes. Image 2 is ONLY arcade sprite art style reference. Character is called Doña Frutatiana, tough determined expressive fruit seller, no text. EXACT regular grid FOUR columns by SIX rows (24 complete sprites), consistent character size, same 3/4 side view facing RIGHT. Every sprite isolated by fully transparent gutters, no shadows, no background, no labels. Prefer full canvas 1536x1536 with equal 384px cells. Fit each pose completely inside its cell including arms and fruit. Row1: four idle poses holding orange. Row2: four walking cycle poses with alternating legs. Row3: four orange throwing poses: windup, arm back, arm extended release (no detached fruit), recovery. Row4: four watermelon overhead throwing poses: crouch picking up striped green watermelon, raise melon above head, throw forward release (no detached fruit), recovery. Row5: two hurt poses then two defeat poses (falling backwards and lying sideways). Row6: two weak close-range shove poses then two grabbed struggling poses. Keep character height stable across standing poses, feet baseline within each row. Crisp detailed pixel clusters and dark outlines matching existing game, readable silhouette, natural older woman body proportions. No UI, letters, brands, floor, extra characters or extra objects. Genuine transparent alpha.

## Prompt de las frutas

Use case: stylized-concept. Transparent game sprite atlas, two isolated objects only, side by side, no shadows or text. LEFT: whole vivid orange with dimpled rind and tiny green leaf. RIGHT: whole round dark green watermelon with pale green stripes. Crisp chunky pixel-art 1990s arcade beat-em-up style dark outlines matching the provided game sprite style. Each centered in its own half of a 1024x512 canvas, ample transparent margin, each object approximately 280 pixels diameter, no other objects, no slices, no floor. Genuine transparent alpha.
