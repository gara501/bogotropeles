# Street Bogotá

Beat ’em up web con Phaser 3.90 + Vite, en JavaScript. Requiere Node.js 22.15+ y npm.

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:5173 (o el puerto indicado por Vite).

```sh
npm test
npm run build
npm run preview
```

La compilación queda en `dist/` para hosting estático.

## Contenido y controles

Personajes seleccionables y peleas contra la fauna urbana por las calles de Bogotá.
Teleperforman (player 3) golpea con la diadema usando K: alcance 185, daño 40.
Gymbro (player 4) tiene dash con Shift y pisotón con K:
afecta a todos los enemigos en un radio de 145, delante o detrás, hace 45 de daño
y aturde durante 850 ms. Recarga en 1400 ms desde el inicio del ataque.
Gomelo hace más daño; la Universitaria corre y ataca más rápido y su escala es un 10 % menor que antes.
El arranque muestra `intro_juego`, después `intro_1` y luego la selección de personaje: un clic en el personaje inicia
la partida; también puedes elegir con flechas y jugar con Enter.
El combate solo comienza después de confirmar la selección.
Los PNG originales de personajes y enemigos se conservan en `src/data/`.

| Acción | Tecla |
| --- | --- |
| Mover | WASD o flechas |
| Puño | H |
| Patada | J |
| Patada baja (universitaria) | L |
| Libros orbitales (universitaria) | K, una pulsación por activación |
| Lanzar iPhone (Gomelo) | K, una pulsación por lanzamiento |
| Diadema (teleperforman) | K |
| Pisotón en área (gymbro) | K |
| Dash con parpadeo (todos los personajes) | Shift + dirección; sin dirección sigue la mirada |
| Saltar / evadir | Espacio |
| Patada aérea | Espacio + J |
| Pausar | P |
| Siguiente nivel tras ganar | Enter o botón Siguiente |
| Reiniciar | R o botón del modal; Enter también al morir |

Se puede mantener H o J para repetir ataques al terminar su recuperación.
L mantiene la patada baja de Universitaria. K requiere una pulsación por especial;
el iPhone recarga 5 s desde que se libera.
Durante el salto solo se permite J: no hay puños ni patadas bajas aéreas.
La patada en el aire permite seguir desplazándose.
El dash dura 180 ms, recarga en 850 ms desde su inicio y permite cancelar un ataque
para escapar. Tiene invulnerabilidad breve y respeta los límites del escenario.
El indicador bajo la salud muestra cuándo está listo. La pausa congela sus tiempos.

## Ritmo del combate

- Puño de Gomelo: 260 ms por ataque, impacto a los 110 ms, daño 30.
- Puño de la universitaria: 210 ms por ataque, impacto a los 90 ms, daño 20.
- Patadas: mayor alcance y daño, con más recuperación que los puños.
- Los enemigos avanzan 650 ms y descansan 450 ms, en ciclos escalonados.
- Cada ataque enemigo avisa con `!` durante 480 ms; después queda expuesto
  durante 480 ms. Los enemigos espacian el inicio de sus ataques para evitar
  golpear todos a la vez. Recibir daño concede un segundo de protección al jugador.
- La moto es más rápida que los demás enemigos (200 px/s frente a 70–90 px/s),
  pero también debe preparar el ataque y recuperarse.
- El lanzador mantiene distancia y lanza `knife_clean.png` en la pose de soltar
  el cuchillo. Golpearlo durante la preparación cancela el lanzamiento. Se puede
  esquivar con salto, movimiento entre carriles, patada baja o dash.

La campaña recorre los escenarios de Bogotá en el orden de `src/data/campaign.js`. Solo ganar habilita
Enter o Siguiente para avanzar, pasando antes por la pantalla de entrada del
nivel siguiente. Reiniciar conserva el escenario actual y restablece la salud.
Cambiar de personaje conserva el nivel, los enemigos, las vidas y los puntos; la pelea se pausa durante la selección.
Cada nivel empieza con salud completa; los jefes conservan la salud restante de su nivel.

Al comenzar se muestra `intro_juego.png`. Las intros esperan una tecla o clic tras
un breve tiempo de lectura. Cada escenario puede tener un jefe configurado; al
vencerlo se continúa al siguiente escenario. La victoria de campaña se determina
por el último registro disponible, sin anunciar un número fijo de niveles.

| Nivel | Enemigos | Total | Objetivo |
| --- | --- | --- | --- |
| 1 | enemy_7, enemy_6 | 15 | Derrotar oleadas de 2 y 3 |
| 2 | enemy_1, enemy_2 | 20 enemigos | Derrotar enemy_1 y esquivar los cruces rápidos de enemy_2 |
| 3 | enemy_3, enemy_6, enemy_7, enemy_8 | 20 | Derrotar oleadas de 2 y 3 |
| 4 | enemy_5, enemy_6, enemy_7, enemy_8 | 20 | Derrotar oleadas de 2 y 3 |
| 5 | enemy_4, enemy_5, enemy_1, enemy_8 | 20 | Derrotar oleadas de 2 y 3 |
| 6 | enemy_4, enemy_2, enemy_1, enemy_8 | 30 + jefe | Completar oleadas y vencer a Brayatan para seguir a Zona Rosa |
| 7 · Zona Rosa | enemy_4, enemy_5, enemy_6, enemy_7, enemy_8, enemy_10, enemy_11, enemy_12 | 30 | Completar las oleadas frente al Andino |

La resistencia, velocidad, daño y frecuencia de ataques aumentan por nivel.
Solo enemy_2 cruza el nivel 2 manteniendo dirección y carril; cuenta al salir
por el extremo contrario o al ser derrotado. Enemy_1 persigue y ataca al jugador
y debe ser derrotado para completar su oleada.
Consulta [docs/campaign.md](docs/campaign.md) para balance y verificación.

## Assets y estructura

- `src/scenes/StreetScene.js`: movimiento, combate, proyectiles, pausa y HUD.
- `src/scenes/MenuScene.js`: carga inicial compartida y retratos para el menú.
- `src/data/characters.js`: velocidad, daño, habilidades y animaciones de los cinco jugadores.
- `src/data/enemies.js`: configuración de los ocho enemigos y el cuchillo.
- `src/combat/enemyAttacks.js`: impactos y combos de tres golpes.
- `src/data/campaign.js`: composición, cantidades y dificultad de cada nivel.
- `src/combat/WaveDirector.js`: oleadas limitadas, intervalos y fin del tramo.
- `src/scenes/IntroScene.js`: intros de inicio, niveles y jefe.
- `src/data/spriteSheets.js`: aislamiento de poses por transparencia y atlas en memoria.
- `src/data/levels.js`: fondos, suelo transitable y composición de rivales.
- `src/combat.js`: tiempos compartidos, dash y colisiones.
- `tests/combat.test.js`: alcance, evasión, proyectiles y ciclos de movimiento.

Las hojas no usan una cuadrícula regular. El juego detecta los componentes opacos,
ordena las poses por filas y las coloca completas en celdas uniformes. Así se evita
cortar brazos, piernas, ruedas o incluir fragmentos de poses vecinas. `rows` declara
el número de poses por fila: enemy_1 a enemy_4 y enemy_6 usan 6/6/6/6;
enemy_5 usa 4/4/4/4; Gomelo 4/4/4/4/4/4/4/4 en su hoja actual,
con recortes explícitos (caminar, puño, patada, dash, teléfono, daño, derrota y victoria;
la fila de teléfono se usa para el especial de iPhone con K);
la universitaria 4/4/4/4/4/4/4/4 en su hoja actual, también con recortes explícitos
(caminar, puño, patada, patada baja, libros, daño, derrota y victoria; la fila de libros
activa el especial con K, sin reproducir la pose con libros incrustados); Teleperforman 6/6/5/6/6/6/6
(caminar, puño, diadema, patada, dash, daño/derrota y victoria); Gymbro 4/4/4/4/4/4/4/4
(caminar, cruzado, jab/uppercut, derrota, dash, patada, daño y victoria). Una hoja nueva con otra distribución requiere actualizar
esa configuración y el mapa de animaciones. No se sobrescriben los PNG originales.

enemy_5 usa cadena (alcance 155, daño 8) y aparece en La Candelaria y el nivel final.
enemy_6 usa patada baja (alcance 108, daño 7) y aparece en Chorro de Quevedo y el
nivel final. Ambos respetan los avisos y descansos del combate. `frameAnchors`
permite fijar el cuerpo de una pose al extender un arma sin cortar sus extremos.

La hoja de la universitaria incluye secuencias separadas de patada normal (J)
y patada agachada (L), esta última con mayor aturdimiento y evasión.
Cada entrada de nivel elige aleatoriamente una de las siete pistas `public/assets/music1.ogg` a `music7.ogg`, evitando repetir la pista anterior. Se reproduce en bucle. La música usa un volumen del 35 % (ajustable en
`src/audio/LevelMusic.js`), se pausa y reanuda con P, y se detiene al terminar
el nivel o salir del combate. Reiniciar vuelve al principio de la pista.
Solo se conserva decodificada la música del nivel actual. El navegador puede
requerir un clic o una tecla para habilitar el audio.
El jefe también incluye avisos sonoros sintetizados. Incluye controles táctiles y récord local; no incluye multijugador.

## Controlador de jefe: Dormilón

El controlador opcional Dormilón se puede asignar a un escenario con `boss:'dormilon'`. Tiene tres fases y seis
poderes: Pico y placa, Obra eterna, Trancón, Aguacero bogotano, Trámite infinito
y Vuelva mañana. H repetidamente sacude los formularios; el pisotón de Gymbro
destruye obras cercanas. El corredor superior siempre permite escapar y acercarse.

Consulta [docs/dormilon.md](docs/dormilon.md) para balance, arquitectura, recortes
de los assets y pruebas de cada poder desde la consola de desarrollo.

## Especial de Gomelo: iPhone

K lanza un único iPhone: daño 54, alcance 672 px, recarga de 5 s desde la
liberación y recuperación de 420 ms. El teléfono golpea a un solo objetivo
y respeta las protecciones de Dormilón. El HUD muestra cuándo está listo.
Consulta [docs/player1-iphone.md](docs/player1-iphone.md) para parámetros, pruebas
y las limitaciones artísticas reales de la caminata y la pose de anticipación.

## Especial de Universitaria: libros

K invoca cuatro libros independientes durante 1 s: 9 de daño por contacto,
600 ms entre impactos por enemigo y recarga de 10 s desde que aparecen.
L conserva la patada baja. Se puede correr y atacar con los libros activos;
respetan las protecciones del jefe, la pausa y la derrota. Consulta
[docs/player2-books.md](docs/player2-books.md) para balance, archivos, pruebas,
limpieza de bordes y las limitaciones artísticas pendientes.

## Derrota y combos

Al morir aparece un modal con Reiniciar y Cambiar personaje, accesible con clic
y teclado. R reinicia y Enter también permite reintentar tras morir. Morir
contra Dormilón conserva un checkpoint: la pelea vuelve a empezar con salud
completa, sin repetir los 30 enemigos. Siguiente aparece dentro del modal de
victoria; se retiró el botón aislado del fondo de la pantalla.

Enemy_8 lleva una escoba y usa tres filas de ataque distintas: estocada, barrido
lateral y remate alto. Enemy_4 se mueve a 150 px/s de base, persigue sin las
pausas normales y encadena tres golpes solo si conecta el primero. Ambos
comprueban alcance y carril por impacto. Contraatacar cancela la secuencia;
dash o salto permiten evadirla. Consulta [docs/enemy-combos.md](docs/enemy-combos.md).

Enemy_9: vendedor con carrito en niveles 2 y 3. Aviso de 1 segundo, carga recta a 680 px/s y frenado; se puede saltar, esquivar por carril, usar dash o interrumpirlo con un ataque.

Los efectos están en `public/assets/sounds`: `punch` y `kick` suenan al iniciar un ataque válido; `knife`, al lanzar el cuchillo; `bar`, en cada golpe de enemy_5 y enemy_8; `tambo`, en los golpes de enemy_4; `moto`, al entrar una moto del nivel 2 o atacar una moto normal; `running`, al comenzar la carga de enemy_9. Las muertes alternan `hurt.wav` / `hurt2.wav` (incluido Dormilón); escapar por un borde no cuenta como muerte. `lose` suena una vez al perder. La intro principal y la selección que inicia la partida usan `start`; los otros botones y continuaciones usan `button`, también por teclado.

Los efectos de combate se pausan con P, se limpian al reiniciar/cambiar de escena y no se acumulan durante el bloqueo de audio del navegador. La interfaz espera el desbloqueo para reproducir su última pulsación. Son muestras de una sola reproducción con límite de superposición, independientes de la música de nivel.

Los especiales reproducen una vez su efecto al activarse: Player 1 celuco.mp3 al lanzar el teléfono, Player 2 spell.mp3 al invocar libros, Player 3 whip.mp3 al golpear con la diadema y Player 4 stomp.mp3 al ejecutar el pisotón. Una preparación interrumpida o un intento en recarga no reproduce el efecto.

Los cuatro especiales cuestan 10 puntos de la barra de energía/vida al ejecutarse (lanzamiento del celular, invocación de libros, golpe de diadema o pisotón). La preparación cancelada no cuesta energía. Se requieren más de 10 puntos para usarlos: el costo no puede matar al jugador. La invulnerabilidad no evita el costo; puños y patadas son gratuitos. El pisotón se activa con K; Shift ejecuta el nuevo dash gratuito de Gymbro.

Gymbro usa `player_4.png` (1024 × 1536, 32 poses). Sus contactos de combo son jab 8, cruzado 6 y uppercut 10. El gameplay usa fases configuradas en frames: H se guarda hasta ocho frames y enlaza solo en los últimos seis frames de recuperación; mantener pulsado no completa el combo. Los dos primeros golpes conservan al enemigo en alcance y el remate tiene más pausa y empuje. Solo Gymbro tiene combo. Recibir daño o usar dash cancela la acción. El pisotón conserva su costo y daño usando rodilla 21 y apoyo 20. Vista de desarrollo: `/?playerPreview=gymbro` (fases, tokens, cajas e IA).

Para itch.io ejecuta npm run package:itch. El ZIP listo para subir queda en releases/street-bogota-itchio.zip. Instrucciones en docs/itch-io.md.

En celulares y tablets hay controles táctiles automáticos: joystick de ocho direcciones con intensidad analógica, puño, patada, especial, salto, dash y pausa. Universitaria incluye patada baja; Gymbro usa el especial para pisotón. En horizontal los controles están fuera del escenario, a sus lados; en vertical se ubican debajo. Se admite movimiento y acciones simultáneos y se liberan al cancelar el toque, pausar, girar o salir de la pantalla. Solo aparecen en dispositivos móviles/táctiles; reducir la ventana de escritorio no los muestra. QA de desarrollo: `ejemplos/mobile-preview.html`.

Enemy_10 aparece desde el nivel 2: cruceta a corta distancia y carga recta con barrigazo a media distancia (aviso 750 ms; carrera 510 px/s), interrumpible con un golpe. Enemy_11 aparece desde el nivel 4: persigue a 230 px/s, retrocede si te acercas demasiado y ejecuta tres golpes de correa con alcances 160/220/170 px. Cada golpe puede esquivarse saltando o cambiando de carril. Los totales de enemigos y las oleadas 2/3 se conservan. QA: `/?enemyTest=belly` y `/?enemyTest=leash`.

## Partida arcade, vidas y récord

Cada partida comienza con 3 vidas. Perder una vida congela brevemente el combate, conserva el tramo y restaura la energía; la reaparición protege durante 3000 ms con parpadeo, incluso frente a combos. Las vidas restantes se conservan al pasar de nivel. Al perder la tercera vida, «Continuar» cuenta de 10 a 0 mediante una fecha límite real; pausar u ocultar la pestaña no extiende el plazo. Continuar restaura 3 vidas y conserva puntos, enemigos y la vida/fase del jefe. También se puede continuar eligiendo otro personaje. A cero aparece Game Over; Nueva partida borra el progreso y vuelve al nivel 1.

Cada enemigo abatido vale 100 puntos; esquivar una moto sin matarla no otorga puntos. Dormilón vale 2000. El HUD muestra vidas y puntos. Al terminar la campaña o llegar a Game Over aparece la puntuación y el récord con el nombre del personaje; el récord se guarda en localStorage, con funcionamiento seguro si el navegador bloquea el almacenamiento.

Las cuatro hojas incluyen victoria. La pose se muestra durante 1,1 s antes del modal del nivel. Player 1 y Player 2 tienen 32 cuadros; Teleperforman tiene 41, con victoria 35–40; Gymbro tiene 32, con dash 16–19 y victoria 28–31. Los sprites originales no se modifican.

Los atlas filtran las poses vecinas antes de calcular sus límites. Teleperforman usa anclajes de cadera por cuadro para evitar desplazamientos al extender la diadema, los brazos o las piernas. Gymbro conserva altura de referencia 106, con recortes y anclajes adaptados a las ocho filas nuevas; la victoria se ajusta a la escala del cuerpo en combate. Para revisar todos los recortes y comparar las proporciones reales, abre `/ejemplos/player-atlas.html` con `npm run dev`; esa página no se incluye en la compilación.


## Runtime arcade

La partida ejecuta Player, Enemy y CombatSystem mediante ArcadeRuntime a 60 pasos/s, con canvas 960×540, pixelArt, roundPixels y escala FIT. La cámara usa zoom 1 para conservar el detalle original de sprites y textos. No hay inercia, tampoco bajo lluvia. Las motos siguen como peligros independientes; los demás enemigos comparten dos tokens de ataque.

Configuración común: `src/data/arcade.js`. Fases y poses de contacto: `src/data/attacks.js`. Balance por tipo: `src/data/characters.js`, `src/data/enemies.js` y `src/boss/balance.js`. Diagnóstico, archivos, tuning y checklist completo: [docs/arcade-refactor.md](docs/arcade-refactor.md).

## Efectos y luces (`src/fx`)

Partículas e iluminación comparten un solo atlas generado por código (sin assets nuevos):

- `ParticleSystem`: pool de sprites reutilizados, sin geometría por frame. Tope por calidad.
- `Lighting`: una sola capa MULTIPLY (color ambiente + viñeta) y luces aditivas con pool (`flash` para destellos, `lamp` para luces que siguen a un proyectil o nube). La lluvia enfría el ambiente.
- `Fx`: fachada (`scene.fx`) con `hit`, `quake`, `burst`, `flash`, `lamp`. Vigila los FPS y baja la calidad solo (high → low → off) si no se sostienen ~60.
- Calidad manual: `?fx=high|low|off` en la URL (fija la calidad y desactiva el ajuste automático). En móviles empieza en `low`.
- Luces estáticas por nivel: `lights:[{x,y,color,radius,intensity,factor,flicker}]` y `ambient:0xRRGGBB` en el registro del nivel.
- Sin textura canvas (tests, escenas simuladas) todo es no-op y el combate usa el dibujo anterior con `Graphics`.
