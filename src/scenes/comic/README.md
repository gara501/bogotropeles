# Intro motion-comic — viñetas

## 01 · La ciudad

Archivo: `comic_01_ciudad.png`. PNG RGB opaco, resolución nativa devuelta por
ImageGen: 1672 × 941, aproximadamente 16:9. No se reescaló ni se añadieron
textos, interfaz, globos o rótulos a la imagen.

Referencia de estilo: `../intro_juego_v2.png`. Ilustración arcade con contornos
oscuros, sombreado pixelado, luces cian/violeta/naranja, lluvia y atardecer.
Vista desde la ladera de Monserrate, santuario iluminado a la izquierda,
Torre Colpatria, tejados coloniales y avenidas congestionadas con articulados.
Se reservaron márgenes visuales para el movimiento de cámara.

Dirección de animación solicitada para la futura secuencia:

- Paneo lento de izquierda a derecha.
- Zoom suave hacia las luces del trancón, en la mitad derecha.
- Textos superpuestos por el juego, no incrustados en el PNG:
  «Bogotá. Viernes, seis de la tarde.» → «Hoy no pasa nadie.»

La viñeta queda preparada como asset; esta entrega no sustituye todavía la
intro actual ni define el resto de las viñetas o su duración.

Generada con ImageGen integrado usando el prompt del usuario y la portada como
referencia. Fuente original de la sesión:
`exec-9a2b39d4-2b24-4f90-a3c4-74f7724732b6.png`. El PNG se copió intacto,
conservando su metadata de procedencia. Se comprobó visualmente el encuadre,
la ausencia de texto legible y el formato RGB opaco.

## 02 · El villano

Archivo: `comic_02_pacho.png`. PNG RGB opaco de 1672 × 941, resolución nativa
devuelta por ImageGen, aproximadamente 16:9. Copiado intacto con su metadata.

Referencias: portada `../intro_juego_v2.png`, identidad del jefe en
`../../data/bosses/don_pacho_plomo.png` y `../boss-intros/pacho.png`, y carrocería
en `../../data/bosses/pacho_camioneta.png`. Se aplicaron las diferencias
solicitadas: camioneta negra y puerta trasera abierta; puerta delantera cerrada.
Se mantienen cabello, bigote/barba, constitución, camisa geométrica y joyas.

Pacho ríe con un teléfono dorado sin marca y una lista larga sin letras ni
nombres. Portero, cuerda de terciopelo y fiesta al fondo de Zona Rosa lluviosa.
Una segunda pasada amplió el encuadre para mantener cabello, manos y punta
del papel dentro de la imagen con margen para el movimiento de cámara.

Dirección de animación solicitada:

- Zoom lento hacia la cara de Pacho.
- Entrada de la lista desde abajo, a resolver en la composición animada.
- Textos por código, no incrustados en el PNG:
  «Don Pacho Plomo no se tomó la ciudad.» → «La alquiló por una noche.»

El nombre del archivo coincide con el panel `pacho` que ya existe en
`src/data/comicIntro.js`; el loader de `ComicIntroScene` descubre el PNG por glob.
El papel forma parte de la ilustración; esta entrega no añade una capa de papel
independiente ni modifica los tiempos de animación.

ImageGen integrado. Borrador fuente: `exec-85564b70-00b0-4fad-8c79-b7ee2fd681a1.png`.
Fuente final seleccionada: `exec-c66c2a8f-01a7-4007-9255-3c39f8973acd.png`.
Se revisaron visualmente identidad, puerta trasera, ausencia de texto y márgenes.

## 03 · El operativo

Archivo: `comic_03_operativo.png`. PNG RGB opaco de 1672 × 941, resolución
nativa de ImageGen, aproximadamente 16:9, copiado con su metadata intacta.
Tres escenas en una imagen: bus azul salpicando a quienes esperan, teléfono
con X roja y carro triste sin palabras, y articulado rojo lleno con rostros
contra la ventana. Hay matones riéndose al fondo de las escenas. Referencia
de estilo: la viñeta 02 para conservar el acabado de la portada y la serie.

Dos separadores negros inclinados están dibujados en la imagen. Sus centros
medidos en los extremos son x=734 → 503 y x=1169 → 952, de arriba abajo,
sobre el ancho de 1672. `comicIntro.js` registra esos cortes normalizados.
`ComicIntroScene` los utiliza como máscaras y omite los separadores adicionales
cuando el arte ya los incluye. Este panel conserva una cámara fija a escala
de cobertura: su movimiento es la entrada de las tres franjas, para evitar
que un zoom desplace los separadores respecto de las máscaras.

Textos superpuestos por el juego, nunca incrustados en el PNG:
«No contrató un ejército.» → «Contrató el trancón.»

Fuente ImageGen integrado: `exec-5015c2c2-265b-4354-ab34-eee9a921c839.png`.
Se revisaron la lectura de las tres escenas, los dos únicos iconos del
teléfono, la ausencia de palabras y el formato opaco. Las pruebas existentes
del mapa/cómic pasan y la compilación incluye el nuevo asset.

## 04 · Cinco destinos

Reutiliza los cinco archivos `src/data/players/player_N_intro.png`, en orden:
Gomelord, Maca Demia, Teleperforman, Pipe Gymbro y Magolita. No necesita un PNG
unificado ni un archivo `comic_04_*.png`. Los retratos entran como tarjetas
inclinadas alternando −3.5°/+3.5°, con una animación de 420 ms y entradas
escalonadas cada 330 ms. El nombre se dibuja en la banda inferior de la tarjeta.

Se corrigió el recorte: las imágenes fuente son panoramas de 1280 × 720 con
los protagonistas fuera del centro. El foco horizontal por retrato se guarda
en `CARD_FOCUS_X` dentro de `comicIntro.js`: .35, .275, .43, .43 y .40.
Las máscaras siguen las tarjetas durante su entrada e inclinación. Así Maca
Demia aparece en su tarjeta y los otros retratos conservan cabeza y cuerpo.

Textos consecutivos, centrados bajo las tarjetas:
«Cinco desconocidos.» → «Cinco destinos.» → «Un mismo andén.»

Verificación con el flujo normal en Chrome: cinco imágenes presentes, cinco
nombres correctos y dentro de las bandas (ancho máximo medido 122 px frente
a 156 disponibles), tarjetas asentadas en y=236 y último texto completo.
Ningún error de página. Pasan las seis pruebas existentes de mapa/cómic y la
compilación. Vista previa capturada del juego: `docs/comic04-cards.gif` y
`docs/comic04-cards.png`.

## 05 · La puerta

Archivo: `comic_05_estacion.png`. PNG RGB opaco de 1672 × 941, resolución
nativa de ImageGen, aproximadamente 16:9. Copiado sin modificar su metadata.

Estación roja de transporte rápido bajo lluvia; puerta de vidrio bloqueada por
Chiken Gomez con los brazos cruzados y su barra con bufandas azules/blancas y
tambores. Cinco protagonistas de espaldas en primer plano, reconocibles por
el teléfono, apuntes, diadema, musculatura y trapero. El foco de la imagen es
la puerta y el jefe; hay reflejos rojos, cian, violeta y naranja sobre el piso.

Referencias: `../boss-intros/barra.png` para Chiken Gomez; la primera pose de
cada fila de `docs/dash-attacks-engine.png` para los protagonistas; viñeta 03
para la continuidad de iluminación y acabado arcade pixel art.

Dirección solicitada: zoom lento hacia la puerta bloqueada. El panel `estacion`
ya existe en `comicIntro.js` y el loader descubre este nombre de archivo.
Texto por código, no incrustado: «El que sigue caminando, estorba.»

Fuente ImageGen integrado: `exec-2aa8a06b-34f1-4eb8-b966-9ec621a4ebc1.png`.
Se comprobó visualmente la presencia de los cinco protagonistas, el jefe con
los brazos cruzados, la puerta visible y la ausencia de texto legible.

## 06 · Que estorben

Archivo: `comic_06_heroes.png`. PNG RGB opaco de 1672 × 941, resolución
nativa de ImageGen, aproximadamente 16:9. Copiado intacto con su metadata.

Grupo frontal de los cinco protagonistas, en orden: Gomelord con su teléfono,
Maca Demia levantando apuntes, Teleperforman con el cable de la diadema, Pipe
Gymbro en guardia de luchador y Magolita con el trapero en diagonal. Conserva
identidades, vestuario y proporciones de los sprites y la portada. Trancón,
articulado rojo, siluetas hostiles, Colpatria, lluvia y vapor completan el fondo.
Referencias: portada, `docs/dash-attacks-engine.png` y viñeta 05.

Fuente ImageGen integrado: `exec-bd1ee973-991e-4de2-9550-b825942134d9.png`.
La ilustración no tiene subtítulos ni frase final incrustados.

### Cierre animado

- «Entonces...» aparece con el encuadre cercano fijo a zoom 1.42.
- «¡que estorben!» abre el encuadre a zoom 1 en 220 ms, con destello de 160 ms
  y temblor de 260 ms. Se retira la caja de la primera frase.
- Al terminar normalmente, corte directo a la portada opaca, sin fundido.
- Confirmar esa portada abre el selector; no reinicia el cómic. Saltar el cómic
  sigue llevando directamente al selector como antes.

Se conserva el encuadre completo al abrir para no cortar el extremo del trapero.
El texto se dibuja por código respetando la frase y su puntuación solicitadas.

Verificación: 645 pruebas aprobadas y compilación correcta. Chrome reprodujo
el flujo normal completo: zoom cercano constante 1.42, apertura a 1, flash y
shake activos, portada con alpha 1 y selector abierto al confirmar. Ningún
error de página. Capturas: `docs/comic06-close.png` y `docs/comic06-reveal.png`.
