# Escenarios con scroll (estilo Final Fight)

## Cómo funciona

- Cada nivel se divide en **arenas**. Las oleadas se agrupan de a `wavesPerArena`
  (2 por defecto) y cada arena está `advance` px más a la derecha (720 por defecto).
  Ver `ARCADE.stage` en `src/data/arcade.js`; un nivel puede sobrescribir
  `advance` y `wavesPerArena` en `src/data/campaign.js`.
- La cámara (`src/stage/StageCamera.js`) sigue al jugador hacia adelante, **nunca
  retrocede** y no pasa del borde de la arena desbloqueada. Mientras haya enemigos
  vivos la cámara queda bloqueada. Al limpiar la arena aparece **GO →**; la siguiente
  oleada sale cuando la cámara llega a la nueva arena (con medio intervalo de espera).
- `scene.floor.left/right` se recalculan en cada frame según el scroll
  (`floorSpan`), así que jugador, enemigos, cargas y empujes siguen usando el mismo
  clamp de siempre.
- El HUD (profundidad ≥ 999), el overlay, la barra del jefe y la lluvia usan
  `setScrollFactor(0)`. Todo lo demás vive en coordenadas de mundo.
- Para posiciones relativas a la vista usar `viewLeft(scene)` de `src/stage/scroll.js`
  (devuelve 0 en las escenas simuladas de los tests).
- El jefe aparece en la última arena; el checkpoint del jefe salta directo a ella
  (`waves.skipToEnd()` + `stage.jumpToArena()`).

Longitudes actuales: nivel 1 = 3 arenas (2400 px); niveles 2–5 = 4 arenas (3120 px);
nivel 6 y Zona Rosa = 6 arenas (4560 px) cada uno.

Todos los niveles salvo el 4 configuran `rain:{delay:[3000,60000],duration:20000}`.
`StageRain` sortea un inicio entre los 3 y 60 segundos de juego activo en cada intento,
sin depender del avance ni de la posición del jugador: puede llover desde la primera arena.
El aguacero dura 20 segundos del reloj de combate (la pausa y
las pantallas de continuación detienen el conteo), con oscurecimiento gradual, gotas y
ondas sobre el piso, debajo del HUD. Mientras llueve, el jugador y los enemigos que
caminan conservan una inercia leve al frenar o girar, sin alterar saltos, golpes, agarres
ni reacciones al daño. Al terminar la lluvia vuelve el control normal; victoria, game over
y salida del escenario limpian el efecto. Reiniciar el nivel permite que vuelva a llover.

En Plaza de Bolívar, `groundPigeons` activa `GroundPigeons` al cruzar la mitad del mundo
(x=1560). Mantiene hasta tres grupos de cuatro palomas que picotean el piso con
`NPC/pigeon_ground.png` (4 celdas de 128×128). Se distribuyen por tres franjas del suelo
y se reponen cada 4,5 segundos cuando queda un hueco, evitando aparecer encima del jugador.
Acercarse a menos de 95 px en horizontal y 32 px en profundidad las alerta: tras 450 ms
vuelan hacia la posición marcada del jugador usando `pigeon_flight.png`. Cambiar de franja
o saltar permite esquivarlas; cada grupo puede hacer daño una sola vez y luego se va.
No cuentan como enemigos de las oleadas ni otorgan puntos. Al comenzar la entrada del jefe,
incluidos los checkpoints, se retiran todas y dejan de reaparecer. Comparten el reloj de
combate para congelarse durante la pausa y las continuaciones.

## Agregar capas de parallax a un nivel

Los escenarios se registran en `src/data/campaign.js` con su carpeta de arte y sus capas.
El cargador acepta PNG en `src/scenes/levelN/game/` o directamente en `src/scenes/levelN/`,
con prioridad para `game/` si hay nombres duplicados. `level_N.png` es opcional: si falta,
la intro compone las mismas capas del nivel. La zona caminable se toma de `top` y `bottom` del escenario.

Zona Rosa usa `level7/`: `sky`, `skyline`, `buildings`, `floor`, `streetlights` y `front`.
Los factores son 0.06, 0.18, 0.55, 1, 0.85 y 1.25; `front` se dibuja delante de los personajes.
Los peatones de `npc_politicos.png`, basados en la foto de referencia, reemplazan a los gomelos y se reparten en doce posiciones con ocho personajes distintos.
Comparten factor 0.55 con la fachada, con los pies sobre el piso frente a la terraza. Los huecos de 960 px
evitan las jardineras de las esquinas. `edgeMargin:32` y `edgeFade:24` ocultan suavemente cada sprite
antes de que sus manos, zapatos o sombra alcancen el borde de la vista; esta opción solo se aplica a Zona Rosa.
Para agregar otro escenario basta con añadir su registro de campaña y sus PNG; no hay un contador fijo de niveles.

Ejemplo de capas resueltas:

```js
layers:[
  {key:'l1-cielo',   factor:.1},                 // muy lejos
  {key:'l1-edificios',factor:.35},
  {key:'l1-piso',    factor:1},                  // el piso SIEMPRE con factor 1
  {key:'l1-postes',  factor:1.25, front:true},   // delante de los personajes
]
```

- Cada capa es un `tileSprite` fijo en pantalla que se repite horizontalmente:
  pintar los bordes izquierdo y derecho para que empalmen (tileable).
- Opcionales: `y`, `height` (por ejemplo, una franja de piso de 540-380 px) y `scale`.
  Por defecto la textura se escala para llenar 960×540.
- Capas de fondo: profundidad −100…; capas `front`: 800… (por encima de los
  personajes, que usan `depth = y`, y por debajo del HUD).
- Recomendado: arte nativo a 960×540 (o 480×270 ×2), PNG con transparencia
  para todo lo que no sea el cielo, y tiras de máximo ~2048 px de ancho.

## Nivel 1: ejemplo real (`LEVEL1_ART` en `src/data/campaign.js`)

Originales del artista en `src/scenes/level1/*.png` (1672×941, fondo magenta).
Las versiones del juego están en `src/scenes/level1/game/` (960×540, PNG con alfa):

| Archivo | Origen | factor | Ajuste aplicado |
| --- | --- | --- | --- |
| sky.png | layer_1 | 0.08 | subido 305 px para que los cerros asomen detrás del skyline |
| skyline.png | layer_2 | 0.2 | subido 100 px |
| buildings.png | layer_3 | 0.45 | subido 30 px + franja de asfalto (y 338–376) donde pasa el bus |
| floor.png | layer_4 | 1 | andén desde y=375 (el nivel camina desde 400) |
| front.png | layer_5 | 1.3, front | postes y bolardo por delante de los personajes |
| bus.png | transmilleno | tráfico | 717×140, ruedas apoyadas en y=379 |

Proceso: magenta → transparente (con limpieza del tinte en los bordes), reducción por
promedio de área y borde de alfa duro. Para los demás niveles basta con dejar los
originales en `src/scenes/levelN/` con los mismos nombres y pedir el procesado.

`traffic` (opcional): un vehículo que pasa cada `every` ms entre la capa `after` y la siguiente.
`{file, after, factor, bottom, speed, every:[min,max], first}`. Se dibuja volteado según su dirección.

## Nivel 2: Plaza de Bolívar (`LEVEL2_ART`)

| Archivo | Origen | factor | Ajuste |
| --- | --- | --- | --- |
| sky.png | layer_1 | 0.06 | bajado 230 px; unión suavizada (912 px de ancho) |
| hills.png | layer_2 | 0.14 | unión suavizada (912 px de ancho) |
| city.png | layer_3 | 0.25 | — |
| landmarks.png | layer_4 | 0.4 | Catedral, Capitolio y Liévano; termina en y=383, justo donde empieza el piso |
| floor.png | layer_5 | 1 | piso de piedra desde y=383 (el nivel camina desde 410) |
| front.png | layer_6 | 1.3, front | faroles coloniales y bolardo |

Uniones: en capas orgánicas (cielo, cerros) se mezclan 48 px; en capas de edificios
se deja el corte, porque cae entre dos fachadas y se lee como edificios vecinos.
Script de procesado reutilizable: magenta → alfa, limpieza del tinte, reducción por
área, desplazamiento vertical y mezcla de la unión, configurado por nivel.

## Nivel 3: La Candelaria (`LEVEL3_ART`)

| Archivo | Origen | factor | Ajuste |
| --- | --- | --- | --- |
| sky.png | layer_1 | 0.06 | subido 340 px (los cerros asoman sobre la ciudad) |
| skyline.png | layer_2 | 0.2 | subido 157 px |
| houses.png | layer_3 | 0.6 | escalado 85% anclado al andén (y=365); tile de 816 px |
| floor.png | layer_4 | 1 | adoquín recortado a 944 px, donde el patrón empalma |
| front.png | layer_5 | 1.3, front | faroles y bolardo |

## Nivel 4: dentro del Transmilleno (`LEVEL4_ART`)

| Archivo | Origen | factor | Ajuste |
| --- | --- | --- | --- |
| city.png | layer1 | 0.3 + drift 140 px/s | subido 110 px; pasa por las ventanas aunque el jugador esté quieto |
| wall.png | layer3 | 0.9 | pared, ventanas y puertas del bus (layer2 no se usa: queda detrás de layer3) |
| seats.png | layer4 | 0.9 | mismo factor que la pared para que las sillas no "resbalen" sobre ella |
| floor.png | layer5 | 1 | piso desde y=352 (el nivel camina desde 355) |
| poles.png | layer6 | 1.25, front | barras amarillas delante de los personajes |

`drift` (px/s): desplazamiento automático de una capa, independiente de la cámara.

## Cámara al desbloquear una arena

`stepScroll` limita la cámara a `maxScrollStep` px por paso (8) con aceleración suave
(`ease` 0.2). Antes, si el jugador estaba en el borde derecho cuando aparecía GO,
la cámara saltaba ~400 px en un solo frame.

## Nivel 5: Chorro de Quevedo (`LEVEL5_ART`)

sky (subido 340, factor 0.06) · skyline (subido 110, 0.2) · houses (subidas 39 px para que el
piso no tape las puertas, 0.55) · floor (ladrillo desde y=356, 1) · fountain (la fuente de layer6
reducida al 60%, una sola vez en un tile de 1920 px, apoyada en y=372 detrás de la zona de pelea, 1)
· front (faroles y bolardos, 1.3).

## Nivel 6: Calles del centro (`LEVEL6_ART`)

sky (subido 300, 0.06, drift 6 px/s) · skyline (subido 130, 0.2) · buildings (recortados 7/10 px
de los bordes transparentes, 0.6) · floor: el artista no entregó piso; se usa el andén y la calle
del `level_6.png` original (filas 352–540 colocadas desde y=382).
