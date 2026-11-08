# Público de la Plaza de Bolívar

Referencias del usuario: `ejemplos/plazav1.jpeg`, `ejemplos/plazav2.jpg` y
`ejemplos/plazav3.png`. Imagen generada con ImageGen integrado usando el atlas
del Chorro como referencia de estilo. Asset final: `src/data/NPC/npc_plaza_fotos.png`.

Ocho figuras/grupos decorativos estáticos exclusivos de esta plaza: vendedor
de helados con carro rojo, vendedor de snacks con sombrilla, fotógrafo, pareja
y cuatro visitantes de la feria. La asignación completa de props del nivel
contiene solamente estos ocho assets; los enemigos y las palomas conservan
su comportamiento de juego.

Atlas RGBA 1024×1024 con recortes individuales y anclaje a los pies/ruedas.
Altura de los visitantes: 104 px; heladero con carro: 100 px; vendedor con
sombrilla: 140 px. Normalización reproducible mediante
`python scripts/prepare-plaza-crowd.py <imagen-generada.png>`; elimina spill
de colores de generación en los bordes alfa y deja gutters transparentes.

Pies entre y=412 y y=416, sobre el pavimento. Posiciones fijas cada 1920 px,
espaciadas para evitar solapamientos. Margen de pantalla de 32 px y fade de
24 px. Revisión del nivel en desarrollo: `?campaignPreview=plaza`.

## Prompt de generación

Use case: style-transfer. Production transparent sprite atlas for a 2D Bogotá pixel-art beat-em-up, matching reference image 4 (existing game NPC atlas): dark outlines, crisp detailed pixel clusters, warm natural shading, full-body proportions. Use photographs 1, 2, 3 to create EXACTLY EIGHT isolated NPC assets, arranged in FOUR columns and TWO rows with generous transparent gutters. Every asset completely contained within its own equal cell, baseline aligned near bottom of each cell, no clipping or overlaps. Row 1 left to right: (1) seated ice cream vendor from photograph 2, red cap and red jacket, charcoal trousers, together with his red three-wheel ice-cream pushcart and small stool, treat man plus cart as one isolated asset; (2) snack vendor from photograph 2, blue cap, yellow-and-blue tracksuit, seated beside small purple wheeled snack trolley, colorful packets and a large blue-purple sun umbrella attached to the trolley, treat vendor plus umbrella and trolley as one isolated asset; (3) older plaza photographer from photograph 3, red cap, green vest over light shirt, black trousers, black crossbody camera pouch, holding compact camera up; (4) affectionate tourist couple from photograph 3, seen from rear three-quarter angle, man in colorful checkered shirt and blue jeans with green-accented sneakers, woman in white top, blue jeans and mint sneakers with arm around his waist, one isolated couple asset. Row 2 left to right based on photo 1: (1) woman long brown hair gray plaid jacket, dark green trousers, pale beige shoes, standing; (2) market seller man in white apron over light gray shirt, beige pants and cream brimmed hat, standing; (3) older visitor in navy jacket, tan trousers, brimmed hat, small crossbody bag, standing; (4) man blue baseball cap black sleeveless vest over white shirt, black trousers, white sneakers, standing. All humans consistent adult anatomy and proportions. Vendors' carts grounded with all wheels visible. Actual transparent background, not a checkerboard. No plaza architecture, tents, pigeons, floor, drop shadows, text, captions, lettering, labels, grid lines, unrelated props or extra people. Convert recognizable clothing and poses from the photographs into the existing game art style. Adults in plain standing cells should fill about 80 percent cell height; umbrella asset may fill 90 percent cell width and height.
