# Gomelo / Player 1: iPhone

Se conserva Phaser + JavaScript, sin dependencias nuevas. Gomelo mantiene
puños, patadas, dash, velocidad 205 y altura 116. La acción especial existente
es **K**. Una pulsación inicia un lanzamiento; mantener K no repite el especial.
H (puño), J (patada), Shift y espacio siguen funcionando. Los demás personajes
conservan sus habilidades y asignaciones.

## Balance

Todos los parámetros están en `src/data/iphone.js`:

| Parámetro | Valor |
| --- | --- |
| Daño | 54, equivalente a 1,8 × puño de 30 |
| Cooldown | 5000 ms desde la liberación |
| Alcance desde la mano | 672 px, 70 % del canvas de 960 |
| Velocidad | 600 px/s |
| Duración de animación | 700 ms |
| Liberación | cuadro 18, a los 280 ms nominales |
| Recuperación tras soltarlo | 420 ms |
| Retroceso / reacción de enemigo normal | 24 px / 250 ms |
| Vida máxima | 1600 ms; normalmente termina antes por alcance o impacto |
| Carril | ±26 px sobre el suelo |
| Tamaño visual / altura de vuelo | 24×17 px / 86 px |

El HUD indica `K / IPHONE LISTO` o el tiempo restante. Pulsar K durante la
recarga muestra brevemente `ESPERA` sin empezar otra animación. La pausa P
congela tanto el vuelo como la recarga.

El proyectil sale de la mano, guarda su posición de suelo y orientación y gira
en el aire. Recorre un segmento barrido por frame y golpea el primer enemigo,
jefe, cono o valla compatible de ese carril; no perfora ni golpea al jugador.
Un escudo consume el teléfono sin transferir daño al siguiente objetivo.
`Vuelva mañana` y la guardia frontal del paraguas usan la posición de llegada
del teléfono, no la posición posterior de Gomelo.

Antes de la liberación, recibir daño o cancelar con dash evita el lanzamiento
y no consume cooldown. Después, recibir daño o hacer dash conserva el vuelo
independiente. Muerte, victoria, reinicio o cambio de escena limpian los teléfonos
y el listener de animación. El especial no se inicia durante daño, otra acción,
dash, salto, pausa ni derrota.

## Sprites y limitaciones reales

`player_1.png` mide 1199×1312 y tiene alfa real. Se mantiene intacto. El atlas
usa 28 recortes y anclajes, con las siete filas de cuatro: caminar, puño, patada,
dash, iPhone, daño y derrota. Se recortan los márgenes transparentes de cada pose
antes de alinearla por su borde inferior; la escala es única para todas las
animaciones, incluidas las caídas. Los anclajes de lanzamiento mantienen el torso
estable cuando se extiende el brazo.

La animación especial usa `[16,17,18,19,4]`, terminando en la guardia existente.
El teléfono separado se extrae del rectángulo `(863,803,49,35)`. El cuadro 18
termina en x=841, antes del teléfono: el personaje ya no lleva la copia flotante
tras liberarlo. El evento `animationupdate` del cuadro 18 crea el único proyectil;
un temporizador independiente no intenta adivinar cuándo aparece esa pose.

**Limitación artística de caminar:** los cuadros 0 y 2 representan zancadas
muy parecidas con el mismo apoyo visible. Se usa `[0,1,3,1]` a 8 fps para
intercalar las poses válidas de paso y evitar repetir ambas zancadas casi iguales.
Esto no crea el apoyo de pierna contrario que falta en el arte. El ciclo no se
presenta como una alternancia de piernas plenamente corregida: hace falta una
pose adicional para completarla.

**Limitación de anticipación:** el cuadro 16 disponible es una guardia con la
mano junto al pecho; no muestra claramente la mano entrando en el blazer.
Se utiliza como anticipación y después el cuadro 17 levanta el teléfono. No se
ha inventado ni pintado una pose nueva de sacar el teléfono del bolsillo.

## Verificación y desarrollo

`npm test` ejecuta los controladores reales con reloj y renderizador mínimos:
liberación única, cooldown al soltar, bloqueos de estado, interrupciones,
direcciones, independencia del jugador, colisión barrida, objetivo más próximo,
escudos, obras, salida de pantalla, alcance, expiración, pausa y limpieza.
Las pruebas del jefe comprueban además el escudo y la dirección del paraguas
con la posición del proyectil. `npm run build` compila el juego de producción.
El proyecto usa JavaScript; no hay un compilador TypeScript configurado.

Para revisar las animaciones con Phaser, abre `/?playerPreview=1` mediante
`npm run dev`. Aparece un panel de prueba con caminar en ambas direcciones,
puño, patada, dash, lanzar iPhone, daño, derrota y reinicio. Usa el motor y
las colisiones reales, pero detiene la IA enemiga y concede protección al
jugador para inspeccionar las poses. El cooldown sigue siendo real. `Daño`
y `Derrota` fuerzan daño para probar interrupciones. `Ocultar pruebas` retira
el panel y devuelve la IA y la protección a su funcionamiento normal.
Este panel y sus accesos no están disponibles en producción.

Para probar el especial contra Dormilón usa la consola de desarrollo existente:
`streetDebug.start('office')`, después `streetDebug.attack('shield')` o
`streetDebug.attack('rain')`, y lanza con K desde ambos lados. La partida normal
continúa usando los seis niveles existentes, ahora en orden de campaña.

## Archivos

- `src/data/iphone.js`: balance, extracción y cuadro de liberación.
- `src/data/characters.js`: animación, recortes, anclajes y acción especial.
- `src/data/spriteSheets.js`: recorte de márgenes y textura independiente.
- `src/projectiles/IPhoneSpecial.js`: acción, HUD, vuelo y ciclo de vida.
- `src/projectiles/iphoneCollision.js`: colisión barrida y primer objetivo.
- `src/scenes/StreetScene.js`: entrada K, pausa, daño y limpieza.
- `src/boss/BossController.js`, `Hazards.js`: origen de daño y objetos destructibles.
- `src/debug/playerPreview.js`, `src/main.js`: revisión opcional en desarrollo.
- `index.html`: controles accesibles y descripción en el selector.
- `tests/iphone.test.js`, `tests/boss.test.js`: regresiones del especial y escudos.
