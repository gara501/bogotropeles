# Rótulos de sprites

En los prompts archivados se sustituyó el nombre de la marca anterior por «[rótulo anterior]».

## Nivel 1: fondo y bus que atraviesa la pantalla

Editados con la herramienta integrada `image_gen`:
- `src/scenes/level_1.png`: rótulo «transmilleno», fondo opaco 1672 × 941; el juego ya adapta el fondo a la pantalla.
- `src/scenes/level1/game/bus.png`: rótulo «transmilleno», PNG transparente 2170 × 725. El tráfico usa el recorte [0,151,2170,427] y lo muestra a 717 × 140, conservando tamaño, altura y velocidad anteriores.

### level_1.png

Use case: text-localization. Edit only the supplied 1280x720 pixel-art Bogotá street background. Replace the white bus-side lettering "[rótulo anterior]" with exactly "transmilleno" (t r a n s m i l l e n o), centered in the same red bus panel, compact white pixel-art lettering of the same visual size. Keep all other visual content unchanged: bus shape and colors, windows and passengers, street, buildings, signs, poles, railings, station, clouds, perspective, palette, lighting and crisp pixel art. Preserve the original 1280x720 canvas and all object positions. The new word is the ONLY requested change. Opaque background, no transparency, no new objects or text.

### bus.png

Use case: text-localization. Surgical lettering-only edit of this transparent side-view articulated red city bus game sprite. Replace the white side-panel label "[rótulo anterior]" with exactly "transmilleno" (t r a n s m i l l e n o). Match the white pixel-art lettering size and placement. Preserve the bus entirely: same body shape, outline, wheels, windows, passengers, doors, accordion joint, red/yellow palette, pixel-art texture and orientation facing RIGHT. Preserve the ORIGINAL canvas 717x140 and sprite scale and position if possible; do not enlarge, crop or stretch the bus. Everything outside the bus must remain genuinely transparent. No background, no shadow, no extra objects, no changes to other markings. Change only that one label.


Edición realizada con la herramienta integrada `image_gen`.

Archivos finales:
- `src/data/bosses/enemy_attacks.png`: bus con «transmilleno».
- `src/data/enemies/enemy_2.png`: maletas con «Ratti Turbo».
- `src/data/enemies/enemy_2_grab_struggle.png`: mismo rótulo durante el agarre.

Las hojas del bus y del enemigo principal conservan sus dimensiones. La hoja de agarre generada mide 2172 × 724; se configuraron seis recortes propios y una escala 256/362 para conservar el tamaño del personaje. Los 24 recortes explícitos de la hoja principal mantienen juntos al motociclista y la moto durante la caída, aunque ya no formen una sola región de transparencia.

## enemy_attacks.png

Use case: text-localization. Edit target: the supplied transparent game sprite atlas enemy_attacks.png, exact canvas 1536x1024. Make a surgical text-only change: the white word "[rótulo anterior]" on the red articulated bus in the middle must become exactly "transmilleno" (t r a n s m i l l e n o), in readable compact white lettering with the same pixel-art style and size, aligned on the same red side panel. Preserve every other pixel as closely as possible: all objects, all positions, dimensions, sprite silhouettes, colors, gaps, transparent background, all other lettering and symbols. Do not rearrange, redraw or rescale the atlas. This is used with hard-coded sprite rectangles, so canvas dimensions and all sprite boundaries MUST remain identical. Change only that single bus label. No extra objects/text/shadows. Preserve genuine alpha transparency.

## enemy_2.png

Use case: text-localization. Edit target: supplied transparent motorcycle-rider sprite atlas enemy_2.png, exact canvas 1774x887, 6 columns by 4 rows. Make a surgical text-only edit on EVERY delivery backpack visible across this entire sheet: replace the white brand word "Rappi" with exactly "Ratti" (R a t t i). Keep the second line "Turbo" unchanged. All visible red bags must consistently say "Ratti Turbo", including the tilted and fallen bags in the bottom row. Preserve all original sprite positions, canvas dimensions, poses, clothes, helmet, motorcycle, bag shapes, colors, alpha transparency and pixel-art outlines. Do not redesign or rescale or reposition anything; this game uses the original exact sprite cuts. Change only backpack brand lettering. No extra content; genuinely transparent background.

## enemy_2_grab_struggle.png

Use case: text-localization. Edit target: supplied transparent motorcycle-rider struggle-animation sprite strip, exact canvas 1536x256, six separate poses in one horizontal row. Change ONLY the backpack brand text in ALL SIX sprites, replacing white "Rappi" with exactly "Ratti" (R a t t i), keeping "Turbo" on its second line unchanged. Preserve exactly the same 1536x256 canvas, all positions within their six 256x256 cells, all silhouettes, poses, rider/motorcycle/helmet/bag details and all alpha transparency. No restyling, no extra sprites, no movement of any sprite, no cropping or resizing. All six red backpacks must consistently read "Ratti Turbo".
