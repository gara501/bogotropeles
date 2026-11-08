# Intro estilo cómic en movimiento · guion y prompts

Escena: `ComicIntroScene`, antes de la portada `intro_juego_v2.png`. Cada viñeta es una ilustración 16:9 opaca
(ideal 1672 × 941 o más, como la portada) sobre la que el código hace paneo y zoom lentos, desliza viñetas
y escribe los textos letra por letra. **Las ilustraciones no llevan texto**: los textos de abajo los dibuja el juego.
Cualquier tecla o toque salta el intro. Basado en `docs/campaign-story.md`.

Referencias para ImageGen:
- Estilo: `src/scenes/intro_juego_v2.png`.
- Protagonistas (identidad, ropa y proporciones): `docs/dash-attacks-engine.png` y `src/data/players/player_N_profile.png`.
- Don Pacho Plomo: `src/data/bosses/don_pacho_plomo.png` y `src/data/bosses/pacho_camioneta.png`.

Guarda los archivos en `src/scenes/comic/` con los nombres indicados.

Bloque de estilo común (va al inicio de cada prompt):

```
Use case: stylized-concept. Asset type: production cinematic panel for the animated motion-comic intro of a Bogotá arcade beat-em-up. 16:9 landscape, highest available resolution, OPAQUE. Illustrated arcade pixel-art style matching the attached cover exactly: bold dark outlines, chunky crisp pixel shading, dramatic rim lights in cyan, violet and sodium orange, rainy night atmosphere, humorous urban energy. Comic-book composition with a strong focal point and extra margin on every side so the camera can slowly pan and zoom without cutting anything important. Absolutely no text, letters, captions, speech balloons, sound effects lettering, logos, brand names, watermarks or UI.
```

## Viñeta 1 · `comic_01_ciudad.png` — la ciudad

Texto en pantalla: **«Bogotá. Viernes, seis de la tarde.»** → **«Hoy no pasa nadie.»**
Cámara: paneo lento de izquierda a derecha, zoom suave hacia las luces del trancón.

```
[bloque de estilo] Wide establishing shot of Bogotá at rainy dusk seen from the slopes of Monserrate: the dark green Cerros Orientales in the foreground with wet leaves, the white Monserrate sanctuary lights glowing at the top edge, and below the immense city spreading to the horizon under low purple clouds. Downtown towers and the Torre Colpatria lit in changing colours, red-tile roofs of La Candelaria, and every big avenue packed with endless rivers of red brake lights and stuck red articulated buses: a monumental traffic jam. Thin drizzle catching the light.
```

## Viñeta 2 · `comic_02_pacho.png` — el villano

Texto: **«Don Pacho Plomo no se tomó la ciudad.»** → **«La alquiló por una noche.»**
Cámara: zoom lento hacia la cara de Pacho; la lista entra desde abajo.

```
[bloque de estilo] Don Pacho Plomo, the exact man from the attached boss reference (same face, hair, moustache, clothes and build), leaning out of the open rear door of his black armoured SUV from the attached vehicle reference, parked on a wet neon-lit street of the Zona Rosa nightlife district. He laughs smugly while holding a long paper guest list in one hand and a gold phone in the other. A velvet rope and a bouncer silhouette behind him, a party glowing in the background. Low camera angle, he dominates the frame, menacing but ridiculous.
```

## Viñeta 3 · `comic_03_operativo.png` — el operativo

Texto: **«No contrató un ejército.»** → **«Contrató el trancón.»**
Cámara: la viñeta entra en tres cortes diagonales (el código la recorta en tres franjas que se deslizan).

```
[bloque de estilo] One illustration divided by two bold diagonal comic gutters into THREE panels, read left to right. Left panel: a blue city bus speeding past a crowded rainy bus stop without stopping, splashing a puddle over the waiting people. Centre panel: close-up of a hand holding a phone whose screen shows only a big red X icon and a sad cartoon car icon (no words), rain drops on the glass. Right panel: an overcrowded red articulated bus interior, faces squashed against the windows. In all three, shadowy henchmen figures in the background point and laugh. The diagonal gutters are thick black lines with clean straight edges.
```

## Viñeta 4 · cinco destinos (reutiliza arte existente)

Texto: **«Cinco desconocidos.»** → **«Cinco destinos.»** → **«Un mismo andén.»**
Cámara: los cinco retratos de `src/data/players/player_N_intro.png` entran uno tras otro como tarjetas inclinadas,
con el nombre de cada uno. No requiere arte nuevo. Si quieres una versión unificada, este es el prompt:

```
[bloque de estilo] FIVE tall vertical comic panels side by side separated by thick black gutters, one protagonist each from the attached character reference sheet, same identities, outfits and proportions. Panel 1: Gomelord in Chapinero staring at a phone at 1 percent battery, cancelled-ride despair. Panel 2: Maca Demia at a rainy bus stop in Bosa hugging her photocopied notes as a bus passes without stopping. Panel 3: Teleperforman stepping out of a call-centre building in Salitre ripping the headset off his ear, finally free. Panel 4: Pipe Gymbro leaving a gym in Galerías after leg day, legs trembling, protein shaker in hand. Panel 5: Magolita waking up startled inside a feeder bus at the wrong station, mop and bucket on her lap. Each panel has its own colour of rim light.
```

## Viñeta 5 · `comic_05_estacion.png` — la puerta

Texto: **«El que sigue caminando, estorba.»**
Cámara: zoom lento hacia la puerta bloqueada.

```
[bloque de estilo] Night view of the entrance of a red rapid-transit station on a wet avenue: the glass sliding doors are blocked by a rowdy football supporters' gang in striped scarves and drums, led by The Chiken Gomez from the attached boss reference, arms crossed, grinning. In the foreground, seen from behind and in silhouette, the five protagonists from the attached character sheet arrive and stop, their shapes recognisable by outline (phone, notes, headset, muscles, mop). Puddles reflect the station's red light.
```

## Viñeta 6 · `comic_06_heroes.png` — que estorben

Texto: **«Entonces...»** → **«¡que estorben!»** (y corte a la portada)
Cámara: empieza cerca y se abre de golpe; destello y temblor al aparecer la frase final.

```
[bloque de estilo] Heroic low-angle group shot of the five protagonists from the attached character reference sheet, same identities, outfits and proportions, standing shoulder to shoulder on a rain-soaked Bogotá street at night, ready to fight: Gomelord gripping his phone like a weapon, Maca Demia raising her notes, Teleperforman swinging the headset cable, Pipe Gymbro in a wrestler's guard, Magolita holding the mop diagonally. Behind them a wall of stuck traffic and angry henchmen silhouettes, neon signs and the Torre Colpatria. Rain streaks, steam from a manhole, wind in their clothes. Epic but funny.
```
