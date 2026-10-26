# Don Diablo, el del diablito

Enemigo y carrito incorporados a Plaza de Palomojao: nivel 7, después de Chorro de Quevedo.

Prueba: http://127.0.0.1:5173/?enemyTest=don_diablo&character=office

- Embestida con dirección y carril fijados tras una preparación de 0,7 segundos.
- Si alcanza al player en tierra y sin invulnerabilidad, lo carga hasta 170 px y lo lanza hacia los puestos; un impacto de 22 de daño base, escalado con dificultad.
- Si falla o llega al límite, el carrito se clava. Don Diablo tiene 2,6 segundos de recuperación y puede recibir golpes. Interrumpirlo también deja el carrito libre.
- Después de 0,5 segundos el carrito permite reutilización: cerca del carrito, H o el botón móvil de puño lo empuja en la dirección del player. Inflige 42 de daño y derriba, una vez por enemigo y embestida.
- Otros enemigos regulares en tierra pueden apropiarse de un carrito libre; no es un arma ligada exclusivamente a Don Diablo. El dueño anterior no puede recuperarlo durante su ventana de castigo.
- Saltar o cambiar de carril evita la captura. Muerte del dueño, reinicio, victoria y cambio de escena liberan al player.
- Los players usan las poses existentes de brazos adelantados del agarre; el carrito es una textura independiente y conserva su proporción.
- Don Diablo: 260 HP base; sin carrito puede empujar débilmente a corta distancia.

Assets: `src/data/enemies/don_diablo.png` (20 poses), `src/data/items/diablito.png` (carrito independiente). Generados con image_gen integrado. La transparencia se verificó por alpha, también en Phaser.

## Prompt del personaje

Use case: stylized-concept. Production transparent sprite sheet for Don Diablo, older wiry Colombian produce-market porter inspired by man in reference photo: receding short dark gray hair, weathered face, bright turquoise short sleeve collared shirt, dark navy pants, black work shoes. Image 1 clothing reference, image 2 arcade pixel-art style reference ONLY. No cart in this sheet: separate cart will be rendered next to him. EXACT FOUR columns by FIVE rows, twenty full-body poses, equal spacious cells. Facing RIGHT in side/three-quarter arcade view, consistent adult height. Row1 four idle/walking poses arms forward gripping invisible cart handles, alternating walking legs. Row2 four sprinting/pushing hard poses arms forward at waist height, alternate legs. Row3 four stuck/recovery poses: leaning back tugging invisible handles, braced tug, tired wiping brow, turn around. Row4 two hurt then two defeat poses (falling and lying on side). Row5 four unarmed poses: idle fists, walking, shove with arm extended, recoil. Crisp detailed 1990s arcade beat-em-up pixel clusters and dark outlines matching image2. Every complete body strictly isolated in its own cell, transparent gutters. Genuine transparency, no background, floor, shadow, cart, fruit, text, labels or logos.

## Prompt del carrito

Use case: stylized-concept. Create one isolated arcade game prop sprite of a produce-market hand cart, Colombian diablito inspired by reference photo. Side view facing RIGHT: two wheel worn red metal handcart, a manageable stack of wooden fruit crates, tied sacks and green vegetables on the RIGHT/front, long pair of pushing handles extending LEFT toward an unseen pusher at waist height. Cart wheel axle under load, no person attached, complete silhouette. Compact loaded cart suitable for ramming in a beat-em-up, load about waist/chest high, not a huge mountain of goods. Crisp 1990s arcade pixel art with dark outlines, vivid red weathered frame, tan crates, dark wheels. Truly transparent background, no cast shadows, no text, no logos, no grid, no extra props, only one complete cart with ample transparent border, wide landscape canvas.

Edición final integrada: Remove every trace of colored glow, haze and shadows outside the physical cart silhouette. Preserve cart, handles, produce and wheel; fully transparent alpha including gaps between spokes and handles. Keep canvas, scale and placement.

## Frutatiana: sonidos

`frutatiana_hurt.mp3` al recibir daño y `frutatiana_die.mp3` al morir, desde public/assets/sounds, mediante los mapas de sonidos existentes.

## Verificación

375 pruebas automatizadas pasan; `npm run build` correcto. En Phaser se revisaron escala, transparencia y poses, el impacto sobre el player, la apropiación por el player y la apropiación por Frutatiana. La campaña conserva su orden actual.
