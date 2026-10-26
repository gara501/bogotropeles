# Intros de los jefes

## Integración

Al despejar las oleadas se pausa el combate y la música del nivel, se limpian ataques pendientes y se muestra la tarjeta del jefe correspondiente. La primera pulsación se habilita después de 1,5 segundos; una tecla o un toque inicia la entrada normal del jefe. El reloj no avanza durante la tarjeta. Los reinicios en el checkpoint de un jefe ya encontrado conservan su entrada directa.

El impacto original de 2,1 segundos está en `public/assets/sounds/boss_intro.wav`: grave descendente, golpe de ruido, tonos metálicos y cola breve, sintetizados con NumPy y guardados como PCM estéreo de 44,1 kHz. Cada intro posee y libera su sonido; respeta silencio y desbloqueo de audio. Un destello y una sacudida breve acompañan la entrada de la tarjeta. Solo se conserva en GPU la tarjeta del jefe actual.

Pruebas: 362 casos aprobados; revisión visual en navegador de Chiken Gomez y Pacho, incluyendo el retorno al combate y la entrada de la camioneta. Capturas: `docs/boss-intro-preview.png` y `docs/boss-intro-pacho-preview.png`.

Vista de desarrollo: `?bossIntroTest=barra` (también `palomera`, `grafitero`, `cabecilla`, `antidisturbios`, `brayatan`, `pacho`). Usa el flujo real al terminar las oleadas y no afecta el récord de la partida normal. Esta ruta se elimina de la compilación de producción.

Siete tarjetas generadas con la herramienta integrada `image_gen`, con los sprites de cada jefe como referencia. El primer escenario usa «Transmilleno» por el cambio de marca previo.

## CHIKEN GOMEZ

Archivo: `src/scenes/boss-intros/barra.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Shirtless tattooed young man with blue bucket hat, white shorts with blue stripes, blue sneakers and a small knife, identical to reference. Blue football-supporter crowd behind him, red articulated city bus and station gates, stormy Bogotá afternoon, cold cobalt and amber accents.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "Transmilleno". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "CHIKEN GOMEZ". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Chiken Gomez y la barra cobran la puerta. Sin articulado no hay ciudad."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## PALOMERA

Archivo: `src/scenes/boss-intros/palomera.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Older stocky woman in brown worn brimmed hat, burgundy coat, dark scarf and gloves, brown crossbody satchel, smiling ominously with pigeons perched on her shoulders, identical to reference. Cathedral and Plaza de Bolívar behind, a huge flock of grey and white pigeons sweeping over the plaza, overcast teal grey skies and warm ochre lights.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "Plaza de Bolívar". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "PALOMERA". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Palomera no espanta las palomas. Las manda. La plaza queda inservible."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## PINTURITA

Archivo: `src/scenes/boss-intros/grafitero.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Tattooed male graffiti painter in all-black T-shirt and shorts, backwards black baseball cap and white respirator mask, spray can in hand, identical to reference. Colonial narrow Bogotá street with colored walls drenched in cyan and magenta spray paint, pink and turquoise aerosol haze, ominous night lighting.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "La Candelaria". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "PINTURITA". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Pinturita firma el barrio. El que no está pintado en la pared no cruza."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## COLADÍN

Archivo: `src/scenes/boss-intros/cabecilla.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Young short dark-haired man in vivid red zip jacket, navy T-shirt, blue jeans, grey sneakers and black backpack, identical to reference, commanding a crowd with one hand pointing. Crowded transit station turnstiles and ticket window behind him, silhouetted students and long queue, harsh fluorescent lights, red and pale yellow accents.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "La estación". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "COLADÍN". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Coladín es la fila y la ventanilla. Aquí se oye el nombre de Pacho por primera vez."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## ESMADIEGO

Archivo: `src/scenes/boss-intros/antidisturbios.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Heavily armored black riot policeman with opaque dark visor, shield and gas launcher, identical to reference. Small Chorro de Quevedo cobblestone square and fountain behind, colonial houses and string lights, clouds of tear gas under eerie yellow-green light, dramatic charcoal and sulfur palette.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "Chorro de Quevedo". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "ESMADIEGO". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Esmadiego no pregunta. El orden, hoy, huele a gas y trabaja para la fiesta."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## BRAYATAN

Archivo: `src/scenes/boss-intros/brayatan.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Young man with black sunglasses, lime-green floral cap, teal oversized jacket with white-orange arm stripes, magenta shirt, baggy jeans and big sneakers, large knife, identical to reference, poised in a menacing street-dance step. Carrera Séptima downtown Bogotá behind, concrete pavement and storefronts, teal and magenta reflected street lights, diagonal motion energy.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "El centro". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "BRAYATAN". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Brayatan baila la Séptima. Cuchillo, pisotón, y el andén deja de ser de nadie."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.

## PACHO

Archivo: `src/scenes/boss-intros/pacho.png`

Use case: identity-preserve. Transform the supplied boss sprite sheet (character identity/style reference, NOT a sheet to reproduce) into ONE finished cinematic boss-introduction title card for an existing Bogotá arcade beat-em-up.
Output: single opaque LANDSCAPE 16:9 composition, ideally 1536x864. Detailed crisp 1990s arcade pixel-art illustration matching the reference, dramatic lighting and chunky pixel clusters, no photorealism or vector look. All seven cards in this series use the same editorial layout.
Scene and identity: Powerful middle-aged man with slicked long black hair, beard and moustache, gold earrings/watch/chains, colorful blue Hawaiian shirt with yellow red shapes, dark jeans and black shoes, identical to reference. He steps out of a black luxury SUV laughing arrogantly in Zona Rosa at night, neon nightclub lights and velvet ropes, rich gold, burgundy and deep blue lighting.
Composition: one imposing large waist-up or three-quarter boss portrait in the RIGHT 55 percent, full scenario behind, left 45 percent falls into deep near-black shadow to make text perfectly readable. One boss, not repeated animation poses. No gore.
Typography baked INTO the image, LEFT aligned within safe margins of at least 6 percent. Small warm-cream location heading near upper-left EXACTLY "Zona Rosa". Below it, very large heavy condensed arcade headline in golden yellow, EXACTLY "PACHO". Beneath the name, the following Spanish narrative in generous, clean, large warm-white sans-serif/pixel-compatible lettering, wrapped into short lines so every word is legible at 960x540. Exact narrative, no omissions or additions:
"Pacho baja de la camioneta riéndose. No pelea por Bogotá. Bogotá ya la pagó. Tú eres el que no estaba en la lista."
Keep text entirely on the dark LEFT, away from the face and hands. Use the bottom 10 percent as dark unobstructed space for an in-game continue prompt (do NOT print the prompt). Do not add any other words, level numbers, logos, branding, borders, UI or watermarks. Preserve all Spanish accents and punctuation exactly. The words must be readable and spelled correctly. Never use the old transit brand; the first location is Transmilleno.
