# Chorro de Quevedo: público de la foto

Referencia: `ejemplos/chorroGente.jpg`. Atlas: `src/data/NPC/npc_chorro_foto.png`.
Ocho NPC decorativos estáticos: artista con chaleco amarillo y mangas a rayas,
cinco espectadores adultos y dos niños. Generados con ImageGen integrado; el atlas
anterior sirvió como referencia de estilo. No son enemigos ni tienen colisiones.

Atlas RGBA 1024×1024, cuatro columnas y dos filas, recortes ajustados a los pies.
Escala común 104/380; los niños conservan su estatura relativa. Normalización:
`python scripts/prepare-chorro-crowd.py <imagen-generada.png>`.

Los pies se colocan entre y=387 y y=391, por debajo del bordillo que termina
en y=376. Las posiciones se repiten cada 1920 px y evitan la fuente situada
entre x=1175 y x=1425. Margen de pantalla de 32 px con desvanecimiento de 24 px.
El nivel usa solamente estos NPC como props y no configura tráfico ambiental.
Los carros de lechona y merengón existentes pertenecen a La Candelaria.

Vista de revisión: `?campaignPreview=chorro` en desarrollo.

## Prompt de generación (ImageGen integrado)

Use case: style-transfer. Production sprite atlas for a 2D Bogotá beat-em-up. Reference image 1 is the supplied Chorro de Quevedo street performance photo: create eight isolated NPC spectators and the performer based on their clothing and poses. Reference image 2 sets the existing detailed pixel-art sprite style, dark outlines, warm shading and proportions. Output EXACTLY 8 separate full-body figures in a 4-column by 2-row atlas, one figure centered in each equally sized cell, ample transparent gutters, feet on the same baseline within each row. Row 1: (1) curly black-haired street performer in yellow vest over black-and-white striped long sleeves, black trousers, striped socks and yellow high-top sneakers with blue star, holding hands raised as in photo; (2) man in cream sweatshirt black trousers white sneakers watching; (3) red-haired woman in black graphic shirt, gray trousers; (4) boy in red jacket over blue shirt, beige pants. Row 2: (1) man in dark burgundy striped sweater and gray pants; (2) man in navy jacket and blue jeans watching; (3) woman in black jacket gray trousers; (4) child in light gray hoodie and gray trousers standing watching. All figures standing independently on invisible level ground, three-quarter front view, readable at 100px on-screen height; adult art about 300px tall and children proportionally smaller. True transparent background. No scenery, cars, carts, benches, text, captions, shadows, labels, grid lines, cropped limbs or touching figures. Keep the photo's distinctive costume details; match second reference's pixel-art quality.
