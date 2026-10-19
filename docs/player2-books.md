# Universitaria: libros orbitales

K inicia concentración y apertura de brazos. L conserva la patada baja; H puño,
J patada de pie/aérea, Shift dash, espacio salto y P pausa siguen funcionando.
El juego admite teclado. No se añaden controles táctiles ni mando inexistentes.
La Universitaria mantiene velocidad 290 frente a 205 de Gomelo, y altura 99.

## Balance y estados

`src/data/books.js` declara `BooksBalance` mediante JSDoc, siguiendo el JavaScript
del proyecto. No existe un comando de TypeScript/check de tipos en este repositorio.

| Parámetro | Valor |
| --- | --- |
| Libros independientes | 4, verde / rojo / azul / amarillo |
| Preparación | 480 ms, invocación nominal a los 240 ms |
| Duración activa | 1000 ms desde la aparición |
| Cooldown | 10000 ms desde la aparición; quedan 9000 ms tras expirar |
| Vuelta | 1200 ms |
| Radio horizontal | 62 px, aproximadamente el ancho de su postura de combate |
| Perspectiva del suelo | 0,48; semieje vertical 29,76 px |
| Altura visual | 54 px sobre el punto de colisión |
| Radio de contacto del libro | 11 px + huella del objetivo (18 normal, 22 jefe) |
| Daño | 9, equivalente a 0,45 × puño de 20 |
| Intervalo por enemigo | 600 ms, compartido entre los cuatro libros |
| Retroceso | 8 px hacia afuera; aturdimiento normal 140 ms |

Una pulsación K se consume con `JustDown`; mantenerla no encadena invocaciones.
El frame 19 de la animación real dispara la aparición una sola vez. El cooldown
no se consume si el daño o el dash cancelan la preparación antes de ese frame.
Durante la preparación no se puede atacar; el dash conserva su cancelación
existente. Una vez concluida la preparación se puede correr, saltar y atacar con
los libros activos. Recibir daño no los cancela; morir los oculta inmediatamente.
Incluso con cooldown cero no se puede invocar otra órbita mientras esté activa.

El HUD indica listo, duración activa o recarga. Todos los plazos usan
`combatTime`, que se congela al pausar. El módulo conserva cuatro objetos y un
único listener de animación, sin timers ni listeners añadidos por frame.
Shutdown elimina los sprites, el HUD, el mapa de contactos y el listener.
Cambiar de nivel, reiniciar o cambiar de personaje crea un estado nuevo.

## Colisión e integración

Los libros mantienen puntos de suelo separados de su altura visual. Su órbita
usa seno/coseno y delta time, con intervalos de 90°, sin reflejar bruscamente el
ángulo cuando la jugadora gira. La profundidad depende de la mitad posterior o
delantera de la órbita. Su huella elíptica usa la perspectiva de las calles.

Solo un libro que toque la huella de un enemigo puede dañarlo: estar dentro del
radio máximo no basta. Cada enemigo tiene su propio plazo compartido, así que
varios enemigos pueden recibir daño en la misma actualización sin duplicarlo
por libros simultáneos. Se omiten aliados, derrotados, escudos e invulnerabilidad.
El daño normal reutiliza `StreetScene.hitEnemy`, animación de impacto y barras de
vida. Dormilón recibe `BossController.hit` con el punto de suelo del libro como
origen: conserva su protección de entrada, transición, paraguas frontal y el
escudo completo de «Vuelva mañana». El jefe conserva su resistencia al retroceso.

## Sprite y límites artísticos

La hoja original `src/data/player_2.png` mide 948 × 1659 y tiene canal alfa real.
Se conservan 28 recortes individuales, no una cuadrícula regular. El atlas
mantiene una escala constante y alinea el apoyo inferior de las poses. Los
anclajes de carrera siguen el torso para reducir desplazamientos entre poses.

La activación usa `[16,17,19,4]`: concentración, brazos abiertos, regreso a postura
normal. Nunca reproduce el frame 18 que incluye libros y una estela dibujados.
Los cuatro libros limpios son representaciones provisionales creadas en Canvas
por `prepareBookTextures`; queda pendiente reemplazarlos por arte final propio
con la misma estética y perspectiva del personaje.

Se eliminan al preparar el atlas los residuos casi puros rojo/azul/cian/amarillo/
magenta, conservando los tonos menos saturados de jeans, piel, cabello y suéter.
El PNG original se conserva. Esto no constituye un repintado completo: quedan
algunos bordes grises o contaminados que requieren revisión artística manual.
En reproducción, las poses de carrera 0/2 y 1/3 son muy parecidas y no ofrecen
una alternancia de piernas inequívoca. La reproducción usa los cuatro cuadros
existentes a 13 fps y refleja correctamente ambos sentidos; queda pendiente una
zancada contraria dibujada con claridad.

## Archivos y verificación

- `src/data/books.js`: configuración tipada, órbita, contacto y filtro de residuos.
- `src/specials/OrbitingBooks.js`: entidades, estados, impactos, texturas y HUD.
- `src/data/characters.js`, `spriteSheets.js`: animación, anclajes y limpieza.
- `src/scenes/StreetScene.js`: K, daño radial, muerte, pausa y limpieza.
- `index.html`, `README.md`: controles y selector.
- `src/main.js`, `src/debug/playerPreview.js`: prueba optativa solo en desarrollo.
- `tests/books.test.js`: doce pruebas de balance, estados y combate.
- `tests/iphone.test.js`: actualiza la expectativa del especial de Player 2.

Prueba visual: `npm run dev` y `/?playerPreview=student`. El panel permite correr
en ambos sentidos, probar puño, patadas, dash, libros, acercar dos enemigos,
recibir daño, morir y reiniciar. El modo protege a la jugadora y detiene la IA;
«Ocultar pruebas» restaura el combate normal. El panel se excluye del build.

Las pruebas automatizadas ejercitan el módulo real y el daño de StreetScene:
activación única, preparación incompatible, interrupción antes/después,
duración y cooldown, cuatro posiciones y profundidad, desplazamiento/giro,
contactos simultáneos, enemigos fuera del radio, equipos e invulnerabilidad,
escudo real del jefe, pausa, expiración, muerte y destrucción/recreación sin
listeners duplicados. Ejecutar `npm test` y `npm run build`.

Verificación realizada: 54 pruebas aprobadas y compilación de producción correcta.
En navegador se revisaron carrera izquierda/derecha, K mantenida, puño, patada
y barrido con libros activos, pausa, daño recibido, derrota, reinicio y cambio
de nivel durante el efecto. Sin errores en la consola del navegador. Vite conserva
el aviso previo de tamaño del bundle de Phaser; no impide compilar.
