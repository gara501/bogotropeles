# Campaña: Bogotá a puño limpio.

El usuario juega del nivel 1 al 6 en orden. La cabecera indica el escenario
actual; no hay desplegable ni interacción para cambiarlo. Ganar habilita
Siguiente/Enter. Reiniciar repite el nivel actual; al morir contra Dormilón se reintenta directamente el jefe con toda la salud. Cambiar de
personaje conserva exactamente el nivel y el tramo actual, las vidas y los puntos.

Flujo: `intro_juego` (pantalla principal) → `intro_1` → selección → entrada del nivel 1 → combate →
victoria → entrada del nivel siguiente. Cada pantalla de nivel usa su fondo
existente, número, nombre y objetivo. Tras los 30 enemigos del nivel 6:
`intro_boss` → Dormilón → victoria final. La intro del jefe conserva salud y
cooldowns, pausa el reloj y la música, y limpia ataques en vuelo. No se puede
recibir daño ni iniciar la pelea durante esa pantalla. No se puede avanzar
después de morir ni saltar desde el nivel 6 a un séptimo.

Se eliminó la bienvenida con botón Empezar. `intro_juego` se muestra automáticamente
al cargar, y `intro_1` presenta la historia antes de elegir personaje.
Las intros se pueden continuar por teclado o clic después de
1,5 s (inicio/jefe) o 0,9 s (entre niveles). El evento de continuación se difiere
hasta terminar la entrada actual, evitando que Enter seleccione accidentalmente
al personaje. Los listeners se retiran al salir de cada intro.

## Oleadas y dificultad

> Desde la versión con scroll, las oleadas se reparten en arenas a lo largo del nivel. Ver `docs/scroll-parallax.md`.

`src/data/campaign.js` centraliza la campaña. Las oleadas alternan 2 y 3 enemigos
vivos, y la siguiente empieza después de terminar la anterior y esperar su
intervalo. Los totales son múltiplos de cinco, por lo que no queda una última
oleada de un solo enemigo. El HUD cuenta resueltos sobre el total del nivel,
sin declarar victoria cuando termina una oleada intermedia.

| Nivel | Assets | Total | Vida × | Velocidad × | Daño × | Presión × | Intervalo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | enemy_7 / enemy_6 | 15 | 0,65 | 0,85 | 0,8 | 0,8 | 1100 ms |
| 2 | enemy_1 / enemy_2 / enemy_9 / enemy_10 | 20 | 0,75 | 0,95 | 0,9 | 0,9 | 1000 ms |
| 3 | enemy_3 / enemy_6 / enemy_7 / enemy_8 / enemy_9 / enemy_10 | 20 | 0,85 | 1 | 1 | 1 | 900 ms |
| 4 | enemy_5 / enemy_6 / enemy_7 / enemy_8 / enemy_10 / enemy_11 | 20 | 1 | 1,08 | 1,1 | 1,1 | 800 ms |
| 5 | enemy_4 / enemy_5 / enemy_1 / enemy_8 / enemy_10 / enemy_11 | 20 | 1,12 | 1,15 | 1,2 | 1,2 | 700 ms |
| 6 | enemy_4 / enemy_2 / enemy_1 / enemy_8 / enemy_10 / enemy_11 | 30 + jefe | 1,25 | 1,22 | 1,3 | 1,3 | 600 ms |

La presión divide el descanso entre ataques y la separación del grupo; se
conserva el aviso normal de 480 ms. Los combos tienen sus propios plazos y enemy_9 siempre prepara durante 1000 ms. Los multiplicadores se aplican
por instancia sin modificar las configuraciones originales compartidas.

El nivel 2 combina dos comportamientos: enemy_1 persigue y ataca al jugador con
su IA normal; únicamente enemy_2 cruza a 450 px/s. Las motos entran desde fuera
de la pantalla y mantienen su dirección y carril, con ataque repetido.
Se usa colisión barrida para que no
atraviesen al jugador entre frames. Cada pasada puede hacer daño una vez; el
salto, dash y cambio de carril permiten evadirla. Salir por el extremo opuesto
resuelve a enemy_2 sin matarlo. También se puede contraatacar. Enemy_1 debe ser
derrotado: esquivar las motos no completa la oleada mientras quede un peatón vivo.
La lista `crossingEnemies` limita este comportamiento a las motos del nivel 2;
las del nivel 6 conservan su IA normal. Se eligieron 20 enemigos en total porque
la solicitud no especificó una cantidad para este nivel.

`enemy_7.png` (1536 × 1024) tiene alfa real, aunque sus píxeles transparentes
conserven RGB marrón. El atlas utiliza el alfa existente para aislar 24 poses
(6 carrera, 6 patada baja, 6 daño, 6 derrota) sin mostrar ese fondo. El frame de
patada tiene un anclaje corporal para que la extensión no desplace el torso.

## Verificación

`tests/campaign.test.js` ejecuta el director y métodos reales de StreetScene:
composición y cantidades de los seis niveles, oleadas 2/3, progresión de
dificultad, intervalos, pausa/derrota, cruces sin persecución y salida sin matar,
colisión rápida en ambos sentidos, salto y carriles, daño único por pasada,
intro del jefe una sola vez después de 30 enemigos y avance solo al sucesor.
También ejercita las tres variantes de IntroScene y su limpieza de listeners.

Para QA visual exclusivamente en desarrollo: `/?campaignPreview=1` añade
«Resolver oleada» y «Resolver tramo». Usan el generador y el daño reales, con
protección del jugador y adelanto del reloj para recorrer la campaña sin librar
todas las peleas. El panel no se importa ni se incluye en producción. El flujo
normal conserva todos los enemigos y plazos configurados.

Ejecutar `npm test` y `npm run build`. El aviso de tamaño del bundle de Phaser
no impide la compilación.

Verificación anterior de campaña: 63 pruebas aprobadas y build de producción correcto.
Se recorrieron en navegador las seis transiciones con los atajos de QA, se
comprobaron la intro inicial, selección por clic, enemy_7 sin fondo, cruces con
ataques activos, pausa/reanudación, reinicio, bloqueo de avance tras morir e
intro_boss después del enemigo 30. Continuar desde la intro mostró a Dormilón
con su barra y fase inicial, sin errores de consola. Los cuerpos de enemigos
se ocultan antes de la intro para despejar la pelea final. Los atajos de QA se
verificaron ausentes del bundle de producción. No se afirma un balance medido
mediante partidas completas sin atajos; los parámetros iniciales son ajustables.

Enemy_9 aparece solo en niveles 2 y 3: prepara 1 segundo, carga en un carril fijo a 680 px/s, frena al borde y permanece vivo. Cada carga conecta una vez; salto, dash, cambio de carril y contraataques permiten evitarla. El sprite usa 20 recortes con snacks y polvo incluidos. QA: `/?enemyTest=vendor`, botón «Carga del carrito».

Enemy_8 realiza tres golpes y aparece en niveles 3–6. Enemy_4 es más rápido y continúa su combo solo al conectar el primer golpe. Véase `enemy-combos.md`.

Verificación de esta actualización: 75 pruebas aprobadas y compilación de producción correcta. En navegador se comprobó enemy_9 sin fondo, carga y animaciones, y el reinicio directo de Dormilón mediante botón, R y Enter.

Enemy_10 se incorpora desde nivel 2 y enemy_11 desde nivel 4, incluidos todos los niveles posteriores. Se mantienen los totales 15/20/20/20/20/30, las oleadas 2/3 y solo enemy_2 cruza y sale automáticamente del nivel 2. Los nuevos enemigos deben ser derrotados.
