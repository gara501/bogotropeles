# Panela arrojadiza

La vuvuzela aparece únicamente en el nivel de combate 1 (Transmilleno · Exterior). Los demás niveles de combate usan panela. Ciclovía y los bonus conservan sus mecánicas propias y no generan armas de mano.

Caminar sobre la panela en el suelo permite recogerla. H / botón de puño lanza una sola panela en la dirección del personaje. Causa exactamente dos veces el daño base del puño: Gomelo 60, y cada otro personaje según su puño configurado. El daño queda fijado al lanzar. Interrumpir la preparación conserva el objeto; soltarlo lo consume, acierte o falle. Las patadas y especiales mantienen sus ataques normales. No se puede agarrar automáticamente a un enemigo mientras se lleva panela.

La panela viaja por el carril del lanzamiento y golpea al primer enemigo que cruza su trayectoria. Se puede evitar cambiando de carril o saltando. El barrido de colisión evita atravesar enemigos entre fotogramas. No causa daño cuerpo a cuerpo adicional ni atraviesa varios enemigos; respeta las defensas e invulnerabilidad existentes. Al impactar muestra grieta, fragmentos grandes, dispersión y migas. También se rompe al salir del área visible.

Cada arena tiene la misma política de aparición que la antigua arma: primera garantizada, siguientes con probabilidad del 55%. Una recogida equivale a un lanzamiento y no rellena una panela ya equipada. Pausa y cinemáticas congelan la mecánica; muerte, cambio de personaje, victoria y cierre limpian los proyectiles. Las poses armadas sustituyen el cuerpo completo al estar listo/caminar/lanzar y restauran las animaciones normales al recibir daño o realizar otra acción.

## Recursos generados

ImageGen integrado, usando `ejemplos/panela.jpg` como referencia del objeto y las hojas `player_N_vuvuzela.png` para conservar identidad y vestuario. Se guardan sin modificar el dibujo ni su canal alfa:

- `src/data/items/panela.png`: 1536×1024, seis imágenes de objeto/vuelo/rotura.
- `src/data/players/player_1_panela.png`: Gomelo, 1536×1024, nueve poses.
- `src/data/players/player_2_panela.png`: estudiante, nueve poses.
- `src/data/players/player_3_panela.png`: Teleperforman, nueve poses.
- `src/data/players/player_4_panela.png`: Gymbro, nueve poses.
- `src/data/players/player_5_panela.png`: Magolita, nueve poses.

Recortes aislados y pivotes de cuerpo en `src/data/panela.js`; reglas en `src/game/panelaRules.js`, entidad en `src/game/Panela.js`.

Prueba rápida en desarrollo: `?campaignPreview=panela&character=office`. Cambiar `office` por `student`, `teleperforman`, `gymbro` o `magolita`; botón «Equipar panela» para repetir. Los enemigos de esta vista se quedan quietos y el jugador tiene invulnerabilidad.

Validación: pruebas de recogida, gasto/interrupción, temporización, primer impacto, daño doble, evasión, rotura, pausa y limpieza; simulación con Player/Enemy/ArcadeRuntime reales para los cinco personajes; comprobación de límites y pivotes de los seis PNG y compilación de producción. El navegador de la herramienta bloqueó el acceso a localhost, por lo que queda pendiente la revisión interactiva en pantalla.

## Prompt de personajes

Una generación por personaje, con su hoja de vuvuzela como referencia:

Use case: stylized-concept. Production animation sprite sheet for Street Bogotá, detailed 1990s arcade pixel art matching reference identity and clothing exactly. Real transparent background. EXACTLY NINE full-body poses arranged 3 columns by 3 rows, generous clear margins, equal body scale, faces RIGHT, no labels. Replace the horn entirely with ONE solid brown rectangular Colombian panela block (raw cane sugar brick, amber brown rough surface), palm-sized. Row 1: ready holding panela near waist, walking left foot forward holding panela, walking right foot forward holding panela. Row 2: walking passing stride holding panela, walking opposite stride holding panela, overhand throw WINDUP with panela held behind shoulder. Row 3: overhand throw forward preparation with panela still in hand, release with hand fully extended EMPTY (no panela, projectile drawn separately), empty-handed follow-through recovery. Whole body, hands and feet fully visible. No vuvuzela, horn, weapons, scenery, shadows, text, lines or grid.

## Prompt de objeto

Use case: stylized-concept. Production sprite sheet for Street Bogotá in detailed 1990s arcade pixel art. Reference photo shows Colombian panela sugar bricks. Create EXACTLY SIX frames in a 3 columns x 2 rows grid with generous transparent margins. All frame centers aligned. Row1: (1) single intact rectangular amber-brown panela brick in three-quarter view, (2) same brick rotated 40 degrees for flight, (3) initial impact brick visibly cracking with a few brown crumbs. Row2: (4) brick burst into 5 large angular amber-brown chunks, (5) chunks spreading farther with small crumbs, (6) finer sugar crumbs dispersing. Consistent brick scale, no ground, no shadows, no text, no labels, real transparent background. Each burst stays inside its own cell.
