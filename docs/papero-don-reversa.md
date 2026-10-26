# Assets de Palomojao: Papero y Don Reversa

Referencias del usuario: `ejemplos/papero.jpg` y `ejemplos/camionero.jpg`. Generados con la habilidad imagegen; alpha original preservado. Rectángulos y recortes en el motor, sin repintado por scripts.

## Archivos integrados

- `src/data/enemies/papero.png`: 32 poses; caminar con/sin costal, alzar, estrellar, lanzar, reponer, daño y caída.
- `src/data/items/papero_potatoes.png`: costal y derrame.
- `src/data/bosses/don_reversa.png`: 24 poses de conductor.
- `src/data/bosses/reversa_truck.png`: seis estados: cerrado, puerta, ventanilla, plataforma, reversa, derrota sentado.
- `src/data/items/reversa_eggs.png`: caja de huevos.
- `src/scenes/boss-intros/reversa.png`: tarjeta del jefe.

## Mecánicas

Papero aparece en las oleadas de Palomojao, es lento y resistente. Alzar el costal se puede interrumpir; las papas hacen resbalar a ambos bandos. Reabastece de cajas intactas con dos costales; destruir o vaciar la caja impide reponer. Sin caja usa golpes débiles.

Don Reversa es el jefe después de las oleadas, antes del Centro. Entrada de reversa; fase a pie con costal, hombrazo avisado, estibadores e interrupción del tinto. A mitad de vida sube permanentemente a la mula: motor blindado, aperturas laterales, reversa con tres pitos, cono que aturde, plataforma, exosto fijo y huevos con trayectoria parabólica al lugar marcado. La mula tiene colisión física. Al derrotarlo permanece sentado en el parachoques.

Las frases se muestran como subtítulos, no son voces grabadas. Los pitos y apagado del camión son WAV originales sintetizados. Efectos de suelo usan geometría del motor.

### Cómo dañar la mula

El motor frontal recibe solo el 8% del daño y la carrocería cerrada el 12%. Durante el lanzamiento de huevos la ventanilla recibe el daño completo por dos segundos; acertar deja la puerta abierta otros dos segundos, con 70% de daño. Hay que alinearse con la franja verde del piso junto a la cabina y golpear hacia el camión. Ahora la primera acción de la cabina demuestra esta apertura. La ventanilla y el suelo se marcan en verde solo mientras la apertura está activa. Cada impacto muestra el daño real, destello y sacudida del camión; un impacto reducido dice «BLINDADO» y suena metálico.

## Pruebas manuales

- `http://127.0.0.1:5173/?enemyTest=papero&character=student`
- `http://127.0.0.1:5173/?enemyTest=reversa&character=student`
- `http://127.0.0.1:5173/?bossIntroTest=reversa&character=office`

Controles de prueba solo en desarrollo. La selección de niveles de la versión pública sigue desactivada.

## Prompts

### Papero — generación

Use case: stylized-concept. Transparent game enemy sprite sheet: El Papero, stocky strong Colombian market porter inspired by image1: moustache, worn navy cap WITHOUT logo, dark open jacket over faded teal polo, red cloth draped over shoulder, tan work trousers, dark boots. Heavy burlap sack of potatoes on shoulder when armed. Image2 ONLY existing arcade art style. EXACT FOUR columns by EIGHT rows, 32 complete isolated sprites, equal spacious grid cells, facing RIGHT, side/three-quarter beat-em-up view. Row1 four idle poses carrying potato sack on shoulder. Row2 four slow heavy walking poses with sack, alternating feet. Row3 four long warning/lift poses: brace, bend knees, lift sack, sack held high overhead. Row4 two overhead ground-slam poses (sack descending, sack hits ground in front) then two far-throw poses (sack pulled back, arms release forward WITHOUT detached sack). Row5 four unarmed tired walking poses with empty hands. Row6 four weak unarmed punches: guard, windup, short jab, recoil. Row7 four reload poses with NO box in drawing: bend down reaching into invisible box, pull potato sack up, lift to shoulder, secure sack. Row8 two hurt poses then two defeat poses (falling, lying sideways), no detached sack. Keep full body and full sack strictly inside own cell, transparent gutters, all poses same character scale and standing baseline per row. Crisp detailed 1990s arcade pixel art, dark outlines, no logos, words, numbers, floor, background, shadow, other people or extra props. Genuine transparent alpha.

### Papero — separación de poses

Use case: precise-object-edit. Fix only sprite spacing in this Papero sprite sheet. Keep exactly the same 32 poses in the SAME four columns by eight rows order, same character design, colors and pixel-art style. Repack onto a taller canvas with generous COMPLETELY TRANSPARENT margins around EACH pose. All thirty-two poses must be disconnected separate silhouettes, no foot touching a sack in another row, no overlap across rows or columns. Shrink drawings uniformly if necessary to leave at least 25px of empty alpha gutter vertically and horizontally. Preserve all anatomy, full bodies, full sacks, animations and pose sequence. No background or colored glow: outside physical sprites must have alpha zero. No text or labels.

### Costal y papas

Use case: stylized-concept. Transparent arcade game prop atlas, exactly TWO isolated objects side by side, no text. LEFT: a tied round heavy beige burlap sack stuffed with potatoes, short tied neck, coarse weave with a couple small potatoes visible through an opening, viewed from side, compact oval shape for rolling on a street. RIGHT: a sparse flattened scatter of about twelve loose golden-brown potatoes seen in side/top arcade perspective, wide low oval footprint with TRANSPARENT gaps between potatoes, not a huge mound, designed as slippery floor hazard. Crisp detailed 1990s beat-em-up pixel art with dark outlines and earthy palette matching existing game. Genuine transparency outside physical objects, no glow, floor, cast shadows, background, labels or extra props. Two equal large cells with spacious transparent gutter.

### Don Reversa — conductor

Use case: stylized-concept. Transparent arcade game character sprite sheet of Don Reversa, a heavyset Colombian truck driver inspired by image1, NOT exact real identity: broad thick body, big belly protruding under short gray tee, sweaty beige cap without logo, brown leather work gloves, dark navy work trousers, brown boots, small white towel over shoulder. Image2 only existing crisp 1990s beat-em-up pixel-art style. EXACT 4 columns x 6 rows =24 isolated full sprites with generous transparent gutters. All face LEFT (truck driver approaches player on left). Row1: idle, 3 heavy slow walk poses with alternating legs. Row2: 4 burlap sack overhead slam poses, lifting from floor, shoulder, overhead warning, ground smash. Row3: shoulder charge windup, 2 charging poses, dizzy clutching head after crashing. Row4: 2 whistling poses with fingers at mouth, then 2 drinking coffee from small thermos poses. Row5: climbing into cab, upper body leaning out window shouting, upper body throwing an egg carton, seated on invisible bumper resigned pose. Row6: two hurt poses, falling, seated exhausted defeat with towel. Consistent body proportions, all full limbs and items inside each own cell, zero overlaps. Genuine transparent alpha, no floor, shadows, lettering, logos, extra people, truck or background. Clothing has no writing.

### Don Reversa — mula

Use case: stylized-concept. Transparent arcade boss vehicle sprite atlas, SIX isolated truck variants in TWO columns by THREE rows. Side/three-quarter side view, ALL vehicles face LEFT. Same broad battered RED semi-truck cab with small rear flatbed loading platform, no long trailer (compact gameplay truck), dented red paint, metal front engine grille without any logo or letters, a small devotional Virgin Mary sticker in windshield, white reverse lights at rear RIGHT, exhaust behind cab, boxes of ice, flowers and beverage crates tied on flatbed. Crisp detailed 1990s beat-em-up pixel art, dark outlines. Same canvas cell dimensions, identical truck position and scale across all six variants, transparent gutters, full vehicles and wheels not clipped. Row1 left: driver door closed, normal parked. Row1 right: near-side driver door swung open, empty cab. Row2 left: door closed with heavyset driver gray shirt/beige cap leaning upper body out side window, ready to toss eggs. Row2 right: rear liftgate lowered to road as loading platform. Row3 left: raised liftgate, white reverse lights brightly ON. Row3 right: disabled truck, slight gray steam above hood (no explosion), driver gray shirt and beige cap seated resigned on front bumper. No text, no brands, no signs, no floor, no shadows, no background, no separate people except specified driver. Truly transparent alpha, ample empty spacing between whole truck sprites.

### Don Reversa — intro

Use case: illustration-story. Create a polished 16:9 arcade boss introduction card for the pixel-art game Bogotropeles, matching 1990s beat-em-up look. Location: green steel covered Colombian produce market, crates flowers and vegetables, wide red battered truck with small Virgin sticker in windshield and ice/drink crates behind. Foreground: broad heavyset trucker Don Reversa gray short tee with belly, sweaty beige cap, brown leather work gloves, white towel on shoulder, same character as first reference; second reference is his red truck. Dramatic amber/green lighting. Clear high contrast title typography in the upper left with EXACT text: "PLAZA DE PALOMOJAO" and large "DON REVERSA". Under the title a readable dark plaque with EXACT Spanish text: "Mientras yo no termine, aquí no pasa ni el de la DIAN". Bottom small caption EXACT: "PACHO PAGÓ EL FLETE. LA SALIDA ES SU PARQUEADERO." No extra text, logos or watermarks. Use right half for the boss and truck, text on left, no clipping, preserve chunky pixel art, opaque full background.

### Caja de huevos

Use case: stylized-concept. Transparent arcade projectile prop, single whole cardboard egg carton with six white eggs, viewed side/top in crisp chunky 1990s beat-em-up pixel art dark outline. Small rough beige-gray tray with open lid behind, exactly six intact white eggs, no writing or logos. Complete object centered with ample empty transparent margin. Genuine transparency outside object, no floor, shadow, glow, particles, extra objects, hands or background.
