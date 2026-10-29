# Superpoder y ajustes de enemigos

Q / botón móvil ★ SUPER activa un poder cargado con **20 impactos que hacen daño sin recibir un golpe**. Los puños, patadas, armas y especiales contribuyen si realmente dañan a un enemigo. Golpes al aire, impactos contra invulnerabilidad y la propia onda no recargan el contador. El contador se satura en 20; recibir daño válido reinicia incluso una carga ya lista. La pausa congela la secuencia. Cambiar de personaje, morir, ganar o reiniciar limpia carga y efectos.

El poder es independiente del especial K: no consume vida. Solo empieza estando en el suelo y libre. Durante la animación el personaje permanece protegido y no se mueve ni encadena otros ataques. En el fotograma 30 lanza una onda que quita el **50% de la vida actual** a cada enemigo visible y lo derriba; no afecta a los que están fuera de pantalla. El daño se redondea hacia arriba (un enemigo con 1 punto puede morir). La onda atraviesa escudos e invulnerabilidades temporales, cancela ataques y agarres, y no se aplica más de una vez. Los enemigos se levantan y sus controladores reanudan la pelea. En la fase de vehículo de Reversa, el golpe interrumpe el ataque y abre su recuperación.

Incluye seis poses nuevas por personaje (preparación, concentración, carga, descarga, sostener la descarga y recuperación), una onda expansiva, flash de cámara y barra numérica. La identidad y el vestuario se conservan a partir de las hojas de panela. Se usa ImageGen integrado y se guardan las imágenes originales con alfa, sin editar el dibujo:

- `src/data/players/player_1_super.png`
- `src/data/players/player_2_super.png`
- `src/data/players/player_3_super.png`
- `src/data/players/player_4_super.png`
- `src/data/players/player_5_super.png`

Todas son 1536×1024 RGBA. Recortes y pivotes en `src/data/superPlayers.js`; mecánica en `src/game/SuperPower.js`. Se carga solo la hoja del personaje elegido.

Prueba de desarrollo: `?campaignPreview=super&character=office`. También acepta `student`, `teleperforman`, `gymbro`, `magolita`. El botón «Cargar super» permite repetir sin completar 20 impactos. En esa vista el jugador es invulnerable.

## Otros ajustes solicitados

- Yulitza (`enemy_12`) recibe seis poses de muerte reales en `src/data/enemies/enemy_12_defeat.png`, anexadas como cuadros 24–29 sin desplazar sus ataques ni esquivas. La secuencia termina tumbada en el suelo con el machete caído. Sprite 1536×1024 RGBA, generado con ImageGen a partir de su hoja original. La escala se compensa para mantener la altura del cuerpo.
- Homeless conserva sus tres vueltas y dos segundos de mareo; se desplaza al 55% de su velocidad base durante el giro (antes 125%).
- Panela en el suelo: 20×14 px (antes 34×24), sombra y aro más pequeños; el proyectil conserva su tamaño y daño.
- Gallina: 33 px de altura (antes 25), sin cambiar velocidad o daño.

Validación: pruebas de daño/carga reales con StreetScene/Player/Enemy/ArcadeRuntime, alcance visible por carriles, daño único, escudos, pausa, derribo y reanudación de Jugo y Homeless, Q y botón móvil, cancelación y limpieza, seis poses de los cinco personajes, límites de los PNG y muerte real de Yulitza. Las revisiones previas del navegador de herramientas están bloqueadas para localhost; estas animaciones se validaron por inspección de imágenes y simulación del juego.

## Prompts de ImageGen

### Cada personaje (una generación por su referencia)

Use case: stylized-concept. Production 1990s arcade pixel-art full body SUPER POWER animation sheet for Street Bogotá. Reference image identifies this exact playable character: preserve face, hair, skin, outfit, proportions, shoes. Remove panela entirely. EXACTLY SIX poses in 3 columns by 2 rows, same character body scale and foot baseline, full body head to toes visible, generous transparent separation, faces RIGHT. Row1: (1) grounded preparation, fists near waist, (2) crouch slightly charging energy with fists clenched, (3) rise pulling both fists inward at chest. Row2: (4) explosive heroic power-release stance with both arms thrown outward and palms open, (5) hold powerful open stance, (6) recover to ready fighting guard. Bare hands visible; NO items, weapons, energy aura, particles, glow, trails or scenery: effects will be drawn by engine. NO text, labels, shadows or grid. Genuine transparent background. Crisp pixel outlines matching reference exactly, consistent anatomy.

### Muerte de Yulitza

Use case: stylized-concept. Production 1990s arcade pixel-art animation sprite sheet for Street Bogotá. Reference identifies YULITZA, the long black-haired woman with white visor, gold hoops, tattooed arms, white cropped top, open black jacket, ripped blue jeans, white sneakers and machete. Keep this exact identity, outfit, detail and pixel style. Create SIX full-body death / knockout poses, 3 columns by 2 rows on a genuine transparent background. Same body pixel scale in every pose, whole body and weapon visible, wide margins and no cell overlap. Row1: (1) recoiling from final blow, (2) staggering backward arms loose with machete dropping from hand, (3) knees buckling as she falls. Row2: (4) landing on side, (5) settling on ground on side/back, (6) fully fallen motionless on back with bent knees, machete lying beside her. Non-graphic arcade knockout, NO blood, wounds or dismemberment. NO text, grid, shadows, backdrop, effects or labels. Match reference character; poses progress naturally from standing to fully flat.

## Partículas, luz y sonido

La carga atrae partículas de energía al cuerpo y aumenta una luz local. La descarga emite destello central, 44 chispas radiales, anillo expansivo y una luz de 560 ms; se adapta al límite de partículas y luces existente. Paletas: Gomelo dorado, estudiante violeta, Teleperforman cian, Gymbro naranja y Magolita verde menta. Los aros de Graphics comparten ese color y quedan como efecto básico si se desactivan las partículas.

`public/assets/sounds/special.mp3` suena una sola vez en el fotograma 30, junto con el daño y la onda. Las emisiones avanzan con el reloj fijo, se congelan al pausar y se limpian por propietario al terminar/cancelar; no borran efectos ajenos. En calidad baja se reduce el número de partículas a la mitad y en OFF se respeta la desactivación. Las luces usan sprites aditivos con el sistema de iluminación 2D existente.
