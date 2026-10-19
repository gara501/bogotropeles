# Dormilón: jefe final del nivel 6

El encuentro empieza tras resolver los 30 enemigos de Calles del centro y continuar desde intro_boss.
Los niveles 1–5 conservan su flujo. Vencer a Dormilón cancela los peligros,
reproduce su caída y muestra la victoria final: «BOGOTÁ DESPEJADA».

Se mantiene Phaser + JavaScript. No se añadieron dependencias. El balance tiene
tipos JSDoc en `src/boss/balance.js`; las imágenes y recortes están en `config.js`.

## Controles

Se usan WASD/flechas, H puño, J patada, K especial, L patada baja, Shift, espacio y P.
Pulsa H repetidamente para sacudir los formularios: tres pulsaciones eliminan
una acumulación. También cuentan pulsaciones de J, K y L. Mantener pulsada una
tecla repite el ataque, pero no equivale a pulsaciones nuevas para sacudir.
Gymbro conserva su pisotón con Shift/K y puede dañar varios conos y vallas
a la vez. Los demás personajes usan su dash habitual.

Al morir, el modal permite reintentar con el botón Reiniciar, R o Enter.
El checkpoint vuelve directamente a Dormilón con salud completa.

## Balance inicial

Vida: 900. Velocidad de persecución: 150 px/s. Altura: 118 px (antes 134).
Entrada: 1,8 s. Transiciones: 1,5 s sin daño.
Fases: 100–70 %, 70–35 % y menos de 35 %. Descansos mínimos entre ciclos:
1,7 / 1,3 / 1 s. Las ventanas de recuperación no se acortan al recibir golpes.

| Poder | Anticipación | Actividad | Recuperación | Cooldown | Daño |
| --- | --- | --- | --- | --- | --- |
| Pico y placa | ≥2 s, cuenta visible | 1 s | 1,5 s | 8 s | 12 + inmovilización 0,6 s |
| Obra eterna | 1,2 s | coloca obras en 0,5 s | 1,7 s | 10 s | hueco: 8 |
| Trancón | ≥1,8 s | 1,6 s + recorrido | 1,6 s | 9 s | 14 |
| Aguacero | 1,2 s | lluvia 6 s; guardia frontal 0,85 s | 1,6 s | 14 s | 0 |
| Trámite infinito | 1,1 s | 3 papeles, separados 0,26 s | 1,6 s | 7 s | 4 por impacto admitido |
| Vuelva mañana | 0,85 s | invulnerabilidad 2,5 s | 1,5 s | 16 s | 0 |

Los cooldowns se cuentan desde el inicio de la anticipación. La fase 1 permite
Pico, obras y papeles; la fase 2 añade vehículos y lluvia; la fase 3 añade escudo.
La selección pondera la distancia para los papeles, respeta cooldowns y evita
repeticiones inmediatas. El escudo no se permite durante los primeros 16 s.

Obras: máximo 6 activas y 6 restos decorativos. Conos: 40 de vida; vallas: 70.
Huecos: daño al entrar, cooldown individual 1,8 s; quedarse dentro no repite daño.
Vehículos: 560 px/s; barrera estacionada 3,2 s. Todos los vehículos tienen huella
horizontal de suelo, detección barrida y un único impacto por vehículo.
Formularios: 230 px/s, máximo 3 acumulaciones, 13 % de ralentización por papel
(máximo efectivo 39 %), expiración individual 18 s. Los impactos respetan el
segundo de invulnerabilidad existente antes de añadir una acumulación.

## Seguridad del encuentro

El corredor superior (`floor.top` a `floor.top + 32`) queda libre de obras,
restricciones y vehículos. Dormilón persigue al jugador en ambos ejes durante
sus descansos y reposicionamientos, respetando los obstáculos del suelo.
Al acercarse prepara un puño de alcance 78 px y daño 10, con aviso de 480 ms,
impacto único y recuperación de 750 ms. Se esquiva cambiando de carril, saltando
o con dash. Tras el puño vuelve a seleccionar poderes para evitar sustituirlos
por una cadena de golpes. No persigue durante recuperación, escudo o transiciones.
El corredor permite aproximarse sin romper obligatoriamente las vallas.
Pico restringe una sola columna numerada y deja otras cinco libres. Sus marcas
tienen números, bordes y un aviso «ZONA n ✕». La anticipación se amplía según
la velocidad actual, incluyendo papeles, con margen para terminar un pisotón.
Se eligen columnas sin obstáculos; si todas contienen obras, se restringe
solo la franja libre que queda por encima de sus huellas.
Trancón también calcula el tiempo para abandonar el carril con el jugador lento.

Se admiten como máximo dos sistemas de peligro, incluyendo obras y lluvia.
Solo obras/lluvia pueden persistir al empezar otro ataque; si ambas están
activas se retrasa el siguiente. No se inicia una embestida durante una
inmovilización. Siempre existe el corredor superior. Las transiciones limpian
los peligros para conceder una pausa clara.

La lluvia usa aceleración/frenado limitados, no reduce la velocidad máxima ni
oculta los avisos. El paraguas bloquea de frente durante una ventana señalada;
se puede golpear por detrás o al cerrarse. El escudo no refleja daño. Los golpes
bloqueados muestran «BLOQUEADO» y una señal sonora.

Los avisos son tonos sintetizados mediante el contexto de audio de Phaser;
el navegador debe desbloquear el audio tras una interacción. No hay voces ni
música añadidas. Los tiempos dependen de `combatTime`, que se congela con P.
La pausa detiene las animaciones, tweens y tonos; muerte, cambio de personaje,
reinicio, cambio de nivel y victoria eliminan peligros y ralentizaciones.

## Desarrollo y pruebas manuales

Ejecuta `npm run dev`. Solo en desarrollo están disponibles estos comandos
en la consola del navegador:

```js
streetDebug.start('gymbro')       // Nivel 6, sin oleada, entrada del jefe
streetDebug.start('office')      // También student y teleperforman
streetDebug.attack('pico')       // Aísla el poder, limpia los anteriores
streetDebug.attack('works')
streetDebug.attack('traffic')    // Variante embestida o barrera aleatoria
streetDebug.attack('traffic', {barrier: false}) // Embestida aislada
streetDebug.attack('traffic', {barrier: true})  // Barrera aislada
streetDebug.attack('rain')
streetDebug.attack('paper')
streetDebug.attack('shield')
streetDebug.attack('melee')       // Puño cuerpo a cuerpo
streetDebug.phase(2)             // También 1 o 3, con transición
streetDebug.boss()               // Estado, vida, fase, peligros y velocidad
```

También puedes abrir `/?bossTest=pico&character=gymbro`; el parámetro `bossTest`
admite los seis identificadores y `entry`. `character` admite `office`,
`student`, `teleperforman`, `gymbro`. Estos accesos y comandos se eliminan de
la compilación de producción. En el juego normal no hay botones de prueba.

Verificación automática: `npm test`. Los controladores reales se ejecutan con
un renderizador mínimo y reloj determinista: seis poderes, estados, fases,
escapes a las cuatro velocidades y combates hasta la derrota con los cuatro
personajes usando su configuración real, invulnerabilidad, pisotón contra obras,
límites de obras/restos, daño por entrada, barrido de vehículos, salida de
barreras, acumulaciones y expiración, sacudidas, lluvia, bloqueo, recuperación,
pausa y limpieza. No sustituye una prueba de dificultad con jugadores humanos.
Compilación de producción: `npm run build`.

## Archivos y assets

- `src/boss/balance.js`: constantes con tipos JSDoc.
- `src/boss/config.js`: animaciones, atlas de Dormilón y efectos.
- `src/boss/BossController.js`: máquina de estados, selección, daño, audio, HUD.
- `src/boss/Hazards.js`: zonas, obras, vehículos, formularios y pools.
- `src/boss/Weather.js`: lluvia, salpicaduras y movimiento.
- `src/boss/StatusEffects.js`: papeles adheridos, expiración y sacudidas.
- `src/boss/rules.js`: planificación, selección y colisiones comprobables.
- `src/scenes/StreetScene.js`: integración con combate, pausa, entrada y victoria.
- `src/data/spriteSheets.js`: recortes explícitos además del detector existente.
- `src/data/levels.js`: jefe de Calles del centro.
- `src/main.js`: accesos de desarrollo.
- `tests/boss.test.js`: pruebas de regresión del encuentro.

`enemy_boss.png` mide 1024×1536; `enemy_attacks.png`, 1536×1024. Ambas tienen
alfa real. No se modifican los PNG originales. La hoja del jefe tiene 36 poses
en nueve filas de cuatro, con halos, papeles y señales que conectan algunas
filas. Se usan 36 rectángulos explícitos y anclajes del cuerpo, no una cuadrícula
regular. Los efectos usan recortes con nombre. Se descarta alfa ≤32 para evitar
restos suaves del fondo. Algunos halos se recortan en el límite de su pose para
evitar arrastrar la pose vecina. Lluvia, bordes de peligro y cuentas se dibujan
con Phaser; huecos, conos, vallas, vehículos, papeles y escudo usan el asset.
