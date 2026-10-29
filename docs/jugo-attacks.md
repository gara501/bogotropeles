# Nuevas animaciones de Jugo Espinas

Sprite final: `src/data/bosses/jugo_attacks.png`, 1536×1024 RGBA con transparencia. Generado con ImageGen integrado usando `jugo_boss.png` como referencia. Se conserva el sprite original y se anexa esta hoja debajo del atlas existente.

- Poses 24–27: carrera.
- 28–31: alcanzar, sujetar, preparar cabezazo y contacto. El contacto se reproduce dos veces durante el agarre.
- 32–35: cuerpo encogido en bola, con cuatro orientaciones de giro.
- 36–39: furia, encogerse y dos poses de recuperación.

La IA y los tiempos se encuentran en `src/actors/JugoController.js` y `src/data/jugo.js`. En `/?enemyTest=jugo` hay botones de prueba para carrera/agarre, taxímetro, barrigazo, furia al 50% y bola. La captura respeta salto, dash e invulnerabilidad. Una vez sujeto, el jugador queda bloqueado hasta los dos golpes o la interrupción del jefe.

Prompt utilizado:

> Create a TRANSPARENT BACKGROUND animation sprite sheet for the EXACT same heavyset boss character in the reference: stocky overweight Colombian man, black slick hair, navy blue business suit, white open-collar shirt, black belt, black shoes, fierce expression. Preserve exact identity and the detailed crisp painted pixel-art style. This is an EXTENSION sheet with exactly 16 separated poses, arranged in a precise 4 columns x 4 rows equal-cell grid. No text, no labels, no UI, no scenery, no opponent. Transparent alpha everywhere around each character. Large clear margins inside each cell, no pose may touch any adjacent cell. All upright poses must use the SAME standing scale and ground baseline. Character generally faces RIGHT. ROW 1: four distinct FAST RUNNING animation poses, leaning forward aggressively, alternating arms and legs, suit coat flowing. ROW 2: (1) lunging forward with BOTH hands reaching to grab an opponent's shoulders, (2) both hands clutching imaginary shoulders just in front, elbows bent, (3) still clutching with both hands, head pulled BACK ready to headbutt, (4) hands holding imaginary shoulders while head and upper body thrust FORWARD delivering a strong headbutt. No opponent visible. ROW 3: four distinct rolling-ball poses, character truly curled tightly into a round BALL hugging his bent knees with his arms, head tucked inside, navy suit visible, sequence of 0/90/180/270 degree rotations of his curled body. These must look like a human curled into a ball, NOT a standing person rotated. Ball diameter about 65% of standing height. ROW 4: (1) enraged upright scream, clenched fists, red flushed face, (2) crouching and preparing to tuck into the ball, (3) emerging from the curled ball to crouched stance, (4) exhausted standing recovery breathing heavily. Same character proportions throughout. Exactly 16 full body isolated sprites on real transparency.
