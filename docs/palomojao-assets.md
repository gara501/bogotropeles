# Palomojao · assets

Nombre actualizado a **Plaza de Palomojao**, incluyendo el letrero del fondo y la capa de puestos. Edición con la herramienta integrada de imágenes.

Prompt del cambio: `Use case: text-localization. Change ONLY the central cream market sign lettering to exactly "PALOMOJAO" (P A L O M O J A O), in the same dark green chunky pixel font, centered in the existing sign. Preserve the entire original 1672x941 canvas, exact object positions, scale, colors, architecture, produce, other signs FRUTAS and VERDURAS and crisp pixel art. No crop, no zoom, no new details. Preserve existing transparency in the stalls layer; keep the full background opaque.`

## Incorporación a la campaña

Las cuatro capas se revisaron superpuestas en Phaser y con desplazamiento lateral. Techo y puestos comparten el factor .75 para conservar la unión entre columnas y cerchas; piso 1 y primer plano 1.2. El primer plano deja transparente la zona de combate. El atlas final contiene doce objetos desconectados por transparencia, con recortes medidos individualmente.

Vista de desarrollo: `http://127.0.0.1:5173/docs/palomojao-preview.html`. Permite alternar fondo completo/capas, recorrer el escenario y marcar el área de combate.

### Ajuste final del atlas

Use case: precise-object-edit. Correct the spacing of the supplied transparent 12-prop market atlas only. Keep its 1448x1086 full canvas, same pixel-art style, same twelve objects in the same 4-column by 3-row order. Preserve colors/materials/details of every object.
Two precise corrections:
1. The top-right onion sack and the hanging weighing scale directly below it currently touch through a thin dangling line. They MUST be two completely independent objects with a visibly EMPTY TRANSPARENT gap. Keep the sack within x1110..1430,y35..340. Keep the ENTIRE scale, including its own free top hook, within x1180..1405,y390..740. No rope/line/pixels may connect the sack to the scale. Transparent gap from y341 to y389 in column four.
2. Shrink the bottom-left wooden vegetable table uniformly so its complete object fits within x25..350,y800..1060, centered in that first cell. Keep its proportions and all four feet. It currently spills into the flower bucket's cell; make a clean transparent gap between table and flowers. Preserve the flower bucket within its own second cell, fully isolated from the table.
All other props stay in their current positions and proportions. Exactly twelve isolated props, no shadows, no background, no borders, no writing. Outside objects remains genuinely transparent. Do not add anything, no extra sprites. This edit is to make clean game-sprite cutouts.


Preparados con la herramienta integrada `image_gen` a partir de las dos fotos del usuario y del estilo de los escenarios existentes. El escenario usa una vista lateral, no la perspectiva de pasillo de la fotografía, para permitir desplazamiento horizontal y combate en profundidad.

## Archivos

- `src/scenes/palomojao/background.png`: vista completa, fondo para intro y referencia visual.
- `src/scenes/palomojao/game/roof.png`: techo, cerchas y claraboyas.
- `src/scenes/palomojao/game/stalls.png`: puestos, columnas, canastas y mercancía.
- `src/scenes/palomojao/game/floor.png`: pasillo de concreto despejado.
- `src/scenes/palomojao/game/front.png`: decoración ligera en los bordes, sin tapar el combate.
- `src/scenes/palomojao/props/market.png`: atlas transparente de doce utilerías.
- `src/data/palomojao.js`: rutas, capas, recortes y tamaños de las utilerías.

La zona de combate sugerida es y=390–500 en la resolución lógica 960×540. El atlas separa decoración de utilerías; todavía no asigna colisiones, vida, botín ni enemigos a esos objetos. Los enemigos y la posición del nivel en la campaña quedan pendientes de las indicaciones del usuario. El mercado de las Pulgas de Usaquén está registrado en `docs/campaign-story.md` para una incorporación posterior.

## Prompts

### Fondo completo

Use case: style-transfer. Transform the two supplied photos of the Palomojao covered produce market in Bogotá into a complete videogame level background. Image 1 and image 2 are architectural and produce reference photos. Image 3 is ONLY the pixel-art style reference from the existing game's street layer; do not include its colonial houses.
Asset: ONE seamless horizontal side-scrolling beat-em-up background, opaque landscape 16:9 (ideally 1920x1080), detailed crisp 1990s Final Fight arcade pixel art. Sharp pixel clusters and dark outlines consistent with the game, not a photograph, not painterly, no blur.
CRITICAL perspective: STRAIGHT SIDE VIEW across the market stalls, like a theatrical side-scrolling stage. Translate the photos' deep corridor into a horizontal row of stalls. NO corridor vanishing point into the distance. Horizontal ground line, parallel to the bottom edge. Broad open combat lane.
Architecture: weathered dark-green steel columns and trusses, high corrugated metal roof with alternating translucent white skylights, hanging industrial lamps and round scales, green metal stall frames, open market counters. Distinct stalls with hanging banana bunches, potatoes/onions, leafy greens, tomatoes/oranges/papayas, red and green plastic produce crates, burlap sacks and a small flower display. Authentic lived-in Palomojao, abundant food, diffuse warm daylight under a cool green roof. Generic signs only: one small "PALOMOJAO", "FRUTAS", "VERDURAS"; no real brands or copied advertisements.
Precise game layout in percentages of canvas: roof/skylights and trusses in upper 0–35%; stall fronts, hanging produce and display counters between 25–70%; ALL stalls/crates end at the 70% ground line. Entire lower 30% is a flat wide unobstructed grey-beige concrete aisle with subtle scuffs, seams and tiny leaves, plenty of space for fighters to move up/down. No objects, posts or stalls intruding into that open aisle.
Horizontal tiling: left and right borders should have matching architecture and floor levels to repeat naturally during lateral scrolling; no strong edge vignette or corner framing. Lighting evenly distributed; no central hero object. No people or NPCs baked into this asset, no fighters, no UI, no health bars, no extra text. Keep the roof, stalls and floor visually distinct so they can later be separated into parallax layers.

### Utilerías

Use case: style-transfer. Use the two supplied Palomojao market photos for materials and produce, and the third game-art image ONLY as a crisp 1990s arcade pixel-art style guide.
Create a transparent game PROP SPRITE ATLAS for the Palomojao market beat-em-up level: EXACTLY TWELVE separate props in a regular FOUR COLUMN by THREE ROW grid, read left to right, top to bottom, with ample fully transparent gutters. Landscape 4:3 layout, ideally 1536x1152. No people or faces, no weapons, no floor/background/cast shadows. Crisp chunky pixel art, dark outlined objects, matching the existing game's perspective: mostly side-on with a little top surface visible. Weathered green steel, red/green plastic crates, beige burlap, warm colorful fresh produce. No brand logos, labels, numbers or text anywhere. No objects overlapping or touching adjacent cells; show each whole object without clipping. Consistent scale; the tallest prop is a hand truck about adult waist height.
Grid content, in this exact order:
Row 1: (1) stack of three dark-green plastic crates with red tomatoes on top; (2) one red plastic crate full of oranges; (3) yellow crate filled with earthy potatoes; (4) open burlap sack overflowing with onions.
Row 2: (5) tied off-white grain sack; (6) a hanging bunch of green-yellow plantains with a short rope loop; (7) green two-wheeled hand truck carrying stacked empty crates; (8) a hanging round analog market scale with a silver weighing pan.
Row 3: (9) low wooden vegetable display table with leafy greens and scallions; (10) metal flower bucket with sunflowers and red flowers; (11) low woven basket with papayas and avocados; (12) small wooden two-wheel market pushcart with green crate and leafy vegetables.
Important: twelve props only, absolutely transparent outside objects, no grid lines or checkerboard painted into the image. Keep outlines sharp at gameplay scale.

### roof

Use case: precise-object-edit. Edit target: the supplied pixel-art Palomojao game background. Create a TRANSPARENT PARALLAX LAYER from it, preserving EXACTLY the full original 1672x941 canvas, pixel scale, x/y placement, architecture and sharp pixel-art style of retained content. Do NOT crop, zoom, recenter or resize the retained scene. This layer must align when drawn over the original image. Truly transparent everywhere outside the requested band/objects, no solid black or green fill, no checkerboard, no labels or extra text, no people. Keep horizontal repeating edges level. Retain only the ceiling, skylight panes, roof beams, green trusses and hanging ceiling lamps in the TOP 26 percent of the image (y=0 through about y=245). Remove all market stalls, food, ground and every pixel below that band to transparency. The upper ceiling remains opaque where it was opaque; erase everything below its lower horizontal beam. This is only the far ceiling layer.

### stalls

Use case: precise-object-edit. Edit target: the supplied pixel-art Palomojao game background. Create a TRANSPARENT PARALLAX LAYER from it, preserving EXACTLY the full original 1672x941 canvas, pixel scale, x/y placement, architecture and sharp pixel-art style of retained content. Do NOT crop, zoom, recenter or resize the retained scene. This layer must align when drawn over the original image. Truly transparent everywhere outside the requested band/objects, no solid black or green fill, no checkerboard, no labels or extra text, no people. Keep horizontal repeating edges level. Retain only the horizontal market-stall band from roughly y=220 to y=625 (23–67% of the full image): green shop fronts/columns/signs, deep dark stall interiors, hanging bananas and scales, produce displays, crates, sacks and flowers. Keep all those details at exactly their original coordinates. Remove the ENTIRE roof/ceiling above y=220 to transparency, and remove the entire pavement below y=625 to transparency. The original dark shop interiors should remain opaque, not be cut out. This is a continuous stall-front layer with a perfectly clear upper sky/ceiling region and lower walking region. No new objects.

### floor

Use case: precise-object-edit. Edit target: the supplied pixel-art Palomojao game background. Create a TRANSPARENT PARALLAX LAYER from it, preserving EXACTLY the full original 1672x941 canvas, pixel scale, x/y placement, architecture and sharp pixel-art style of retained content. Do NOT crop, zoom, recenter or resize the retained scene. This layer must align when drawn over the original image. Truly transparent everywhere outside the requested band/objects, no solid black or green fill, no checkerboard, no labels or extra text, no people. Keep horizontal repeating edges level. Retain ONLY the broad concrete walking surface at the BOTTOM, beginning around y=615 (65% canvas height) and continuing to the bottom edge y=940, preserving its existing seams and tiny scattered leaves. Remove EVERYTHING above y=615 to transparency, including the complete roof, all posts, all market stalls, all crates, all signs and all produce. Keep the bottom concrete band opaque, flat, continuous and unobstructed. The entire upper 65 percent must be completely empty transparent alpha. Do not put a wall, crates or any other tall objects on this floor layer.

### front

Use case: precise-object-edit. Turn the supplied Palomojao pixel-art scene into an extremely SPARSE foreground overlay with genuine transparency, keeping its FULL 1672x941 landscape canvas and pixel-art palette. Remove the entire scene. Draw ONLY: a narrow weathered dark-green metal pipe along the very top edge, a few short leafy herb/garlic strands hanging at the extreme upper-left and upper-right corners, confined to the upper 12% of the canvas; and a few tiny scattered vegetable leaves at the very bottom edge, confined to the lower 5% (y>=894). These decorations should occupy less than 10% of the canvas. All middle space including the entire combat region from y=250 to y=890 must be perfectly transparent. No vertical posts, no stalls, no roof panels, no baskets, no crates, no ground surface, no people, no text, no cast shadows. The fighters must never be hidden by this layer. Original palette of green market steel and green leaves, crisp chunky arcade pixel art. Do not center/enlarge the decorations or crop the canvas; keep full transparent gaps.
