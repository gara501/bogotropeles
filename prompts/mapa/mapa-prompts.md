# Mapa de Bogotá entre niveles · prompts

Escena: `MapScene` (entre la victoria de un nivel y la tarjeta del siguiente). El código dibuja los nombres, los
marcadores, la ruta punteada y la ficha del personaje; la ilustración no debe traer texto ni pines.
Generar con ImageGen. Referencia de estilo sugerida: `src/scenes/intro_juego_v2.png` (paleta, contornos y luz).

Después de generar: guarda el mapa como `src/scenes/map/bogota_map.png` y la hoja de marcadores como
`src/scenes/map/map_markers.png`. Las posiciones de cada nivel se ajustan en `src/data/worldMap.js` mirando la imagen
final (coordenadas 0–1), así que no hace falta que la geografía quede exacta: sí que cada lugar sea reconocible.

## Ubicación aproximada de los tramos (norte arriba)

| Tramo | Zona del mapa | x | y |
| --- | --- | --- | --- |
| Transmilleno · Exterior | Av. Jiménez, borde del centro | .69 | .63 |
| Transmilleno · Estación | Estación de la Av. Jiménez | .66 | .66 |
| Monserrate | Cerro, al oriente del centro | .86 | .55 |
| La Candelaria | Casco colonial | .75 | .68 |
| Chorro de Quevedo | Plazoleta en lo alto de La Candelaria | .78 | .64 |
| Plaza de Bolívar | Catedral Primada y Capitolio | .72 | .71 |
| Calles del centro | Carrera Séptima, Torre Colpatria | .70 | .58 |
| Ciclovía | Carrera Séptima hacia el norte | .74 | .40 |
| Plaza de Palomojao | Mercado de Paloquemao, al occidente del centro | .58 | .62 |
| El Dorado | Aeropuerto, extremo occidental | .14 | .44 |
| Gran Estación | Av. Calle 26 / Salitre | .40 | .50 |
| Zona Rosa | Norte, Andino y la T | .68 | .20 |

Los seis primeros quedan apiñados en el centro: la escena hace zoom ahí. Por eso el mapa debe salir en la
resolución más alta posible y con el centro bien detallado.

## 1. bogota_map.png

```
Use case: stylized-concept. Asset type: production background illustration for the between-levels world map of a Bogotá arcade beat-em-up, matching the attached cover's palette, bold dark outlines and dramatic lighting. Highest available resolution, 16:9 landscape, OPAQUE. A stylized illustrated tourist-style map of Bogotá, Colombia, at dusk, seen from a high three-quarter bird's-eye angle with north at the top, like a classic 1990s arcade world map (Final Fight / Turtles in Time style) painted in chunky crisp pixel-art illustration. Geography, simplified but recognizable: the green Cerros Orientales mountain range runs along the whole RIGHT (east) edge, with Monserrate peak and its white sanctuary on top at right-centre and the cable car line climbing to it. At the foot of Monserrate, right-centre-low, a DENSE, HIGHLY DETAILED old downtown: the colonial red-tile roofs and narrow streets of La Candelaria, the small Chorro de Quevedo plaza with its little white chapel, the large Plaza de Bolívar with the twin-towered Catedral Primada and the neoclassical Capitolio, Carrera Séptima with the tall Torre Colpatria skyscraper, and Avenida Jiménez with red articulated rapid-transit buses on a dedicated lane. West of downtown, the covered Paloquemao market with colourful flower and fruit stalls. In the centre-west, the wide Calle 26 avenue with its median busway running towards the LEFT (west) edge, passing the modern glass Salitre / Gran Estación area, and ending at the El Dorado international airport with its terminal and a plane on the runway at far left. A long avenue (Carrera Séptima) goes NORTH from downtown along the mountains, closed to cars with tiny cyclists (Sunday ciclovía). At the top, the upscale north: Zona Rosa nightlife district with neon lights and the Andino mall. Between them, endless dense brick-red residential neighbourhoods, low-rise buildings, green parks, a little rain haze in some areas, and long red lines of brake-light traffic jams on the main avenues. Strong readable silhouettes for each landmark. Leave the areas around each landmark uncluttered so round markers can sit on top. Absolutely no text, letters, labels, street names, numbers, legend, compass rose, pins, markers, icons, UI, logos or brand names.
```

## 2. map_markers.png

```
Use case: stylized-concept. Asset type: production UI sprite sheet for the world map of a Bogotá arcade beat-em-up, chunky crisp 1990s pixel art with bold dark outlines, matching the attached cover's palette. TRUE TRANSPARENT background. EXACTLY SIX isolated drawings in ONE row, all the same size, wide transparent gutters, no overlap, no cropping. Each is a round map badge seen straight on, like an arcade stage marker, with a thick dark outline and a subtle bevel. Frame0 LOCKED: dull grey-blue badge with a small closed padlock. Frame1 CURRENT: bright golden-orange glowing badge with a white star burst inside. Frame2 CLEARED: green badge with a bold white check mark. Frame3 BOSS: crimson badge with a menacing pair of white angry eyes and eyebrows (no skull). Frame4 BONUS: cyan badge with a gift box. Frame5: a small red-and-gold arrow pointer shaped like a map pin tip, pointing DOWN. Absolutely no text, letters, numbers, background, drop shadows or glow outside each badge.
```

## 3. map.png · versión final (a partir del borrador)

Adjuntar el borrador actual `src/scenes/map/map.png` como referencia y pedir una edición, no un mapa nuevo:
las posiciones de `MAP_STOPS` (`src/data/worldMap.js`) están medidas sobre este encuadre.

```
Use case: image edit / final production version. Input image is the approved draft of the world map for a Bogotá arcade beat-em-up. Produce the FINAL version of this exact image: keep the same 16:9 framing, composition, district shapes, colours, borders, landmark icons, callout boxes, the BOGOTROPELES logo and the RUTA DE NIVELES panel exactly where they are, so every element stays at the same pixel position. Only these changes: 1) the subtitle under the logo reads exactly "MAPA DE CAMPAÑA" (remove "· BORRADOR 01"); 2) remove the footer texts "LOCALIDADES SIN NIVEL: EN GRIS" and "ESQUEMA PARA REVISIÓN" and their decorative lines, leaving clean dark background; 3) in the RUTA DE NIVELES panel remove every asterisk after the district names and remove the bottom note "* UBICACIÓN PROPUESTA", keeping the twelve rows evenly spaced; 4) finish the art to production quality: crisp chunky pixel-art edges, clean consistent outlines, no smudges or AI artefacts, all lettering sharp and correctly spelled in Spanish with accents (USAQUÉN, ENGATIVÁ, FONTIBÓN, LOS MÁRTIRES, ANTONIO NARIÑO, SAN CRISTÓBAL, CIUDAD BOLÍVAR, TRANSMILLENO, MONSERRATE, LA CANDELARIA, CHORRO DE QUEVEDO, PLAZA DE BOLÍVAR, CALLES DEL CENTRO, CICLOVÍA, PLAZA DE PALOMOJAO, EL DORADO, GRAN ESTACIÓN · AURA, ZONA ROSA · FINAL). Highest available resolution. Do not add new text, icons, markers, watermarks or UI.
```
