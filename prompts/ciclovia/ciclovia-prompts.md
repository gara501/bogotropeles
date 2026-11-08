# Ciclovía · prompts para regenerar los 5 ciclistas con el diseño del juego principal

**Cómo usarlos:** en ChatGPT adjunta la imagen `referencia-<personaje>.png` de esta carpeta, que es el sprite del juego principal, y pega el bloque común seguido del bloque del personaje. Genera una hoja por personaje.

**Al terminar,** guarda cada hoja como `src/data/cycling/player_N.png`:
- 1 Gomelo
- 2 Universitaria
- 3 Teleperforman
- 4 Gymbro
- 5 Magolita

---

## Bloque común (va en todos)

```
Sprite sheet for a 2D side-scrolling beat 'em up in EXACTLY the same art style as the attached reference
sprite: same level of detail, same soft shading and smooth colour transitions, same dark outline thickness and
the same proportions. Do not make it chunkier or more pixelated than the reference.

The character must be EXACTLY the one in the attached reference: same face, hairstyle, hair length and colour,
facial hair, clothes, colours and shoes. Do not add or remove accessories. Only the pose changes.

The character rides a bicycle seen from the side, travelling to the RIGHT. Full body and the whole bicycle visible.

Layout: 8 poses on a transparent background, 2 rows × 4 columns, every pose the same size, the same scale and
standing on the same ground line (wheels touching the same baseline). Leave clear empty space between poses so
they do not touch. No text, no shadows on the ground, no background.

Row 1 (pedalling loop, 4 frames): pedals and legs at 0°, 90°, 180°, 270° of the crank; upper body steady,
slight head bob.
Row 2:
 5. leaning forward, sprinting out of the saddle (dash)
 6. leaning forward, second sprint frame (other pedal down)
 7. hit/wobble: bike tilted, character startled, one hand off the handlebar
 8. celebrating at the finish line: coasting, one fist raised, big smile
```

## 1 · Gomelo (`player_1.png`)

```
Character: GOMELO. Short black hair combed back in a tall pompadour (NOT curly, NOT long), full dark beard,
black sunglasses, navy blue blazer open over a white shirt, dark grey slim trousers, white sneakers.
Bicycle: black urban bike with thin frame.
```

## 2 · Universitaria (`player_2.png`)

```
Character: UNIVERSITARIA. Very long STRAIGHT brown hair falling down her back (NOT curly), brown eyes,
cream off-the-shoulder sweater with brown cuffs, brown belt, light blue high-waist jeans, cream sneakers.
NO backpack. Bicycle: pastel pink city bike with a front basket.
```

## 3 · Teleperforman (`player_3.png`)

```
Character: TELEPERFORMAN. Short brown hair, short beard, grey call-centre headset with microphone over his head,
NO glasses. Lavender long-sleeve office shirt, dark navy tie, black belt, dark grey trousers, black office shoes.
The tie may flutter behind him. Bicycle: black urban bike.
```

## 4 · Gymbro (`player_4.png`)

```
Character: GYMBRO. Very muscular, short black hair, full black beard, black tank top, black wristbands,
light grey sweatpants, black sneakers with white soles. Bicycle: black mountain bike with thick tyres.
```

## 5 · Magolita (`player_5.png`)

```
Character: MAGOLITA. Brown hair tied in a round BUN on top of the head (NOT a ponytail), round friendly face,
royal blue cleaning-uniform blouse with short sleeves, light blue apron tied with a white bow at the back,
purple rubber gloves, navy trousers, dark brown work shoes. Bicycle: pink city bike with a front basket.
```
