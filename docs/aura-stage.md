# Gran Estación · Batalla de aura

Nivel 3 de la campaña, inmediatamente después de **Ciclovía (nivel 2)** y antes de **Plaza de Bolívar (nivel 4)**. Al vencer al Gordo, Enter o el botón CONTINUAR avanza a Plaza de Bolívar. Si pierde, el jugador puede repetir el duelo sin consumir vidas. La Chiva conserva su posición después de Plaza de Bolívar y El Ring después de Chorro de Quevedo.

También sigue disponible como exhibición desde selección de personajes: activar **BATALLA DE AURA · GRAN ESTACIÓN**, luego elegir cualquiera de los cinco jugadores. La exhibición no avanza ni modifica la puntuación de campaña.

La plazoleta usa la fachada de vidrio, el pabellón blanco, las banderas, las palmeras y la fuente de `ejemplos/granestacion.jpg`. Ocho espectadores originales inspirados en `ejemplos/aura2.jpg` forman un semicírculo: presentador con micrófono, dos personas grabando, aplausos, risas y aficionados animando. Los rivales quedan delante del público, con el centro despejado.

## Duelo

- Rival: El Gordo del Aura, con Idle/Taunt, Crowd Hype y Defeat.
- Los cinco jugadores tienen Six Seven, Boat Paddle, Mewing, Chen Chupas y Sigma Finish.
- Cinco turnos: elegir el emote indicado dentro de la zona verde del pulso. Un acierto da 30 puntos, un acierto preciso da 40. Se necesitan 90 puntos.
- Teclas **1–5**, o los cinco botones en pantalla. También funcionan H, J, K, L y Espacio.
- P pausa, R reinicia, Esc o SALIR regresa a selección. Cambiar personaje conserva el turno actual.
- Desarrollo: `http://127.0.0.1:5174/?auraTest=1&character=magolita` (ajustar puerto al servidor local).

## Archivos y validación

Arte fuente y manifiesto: `src/scenes/aura/`. Jugadores v2: `game/players-v2/`, con emotes de 256×512 por pose y caminatas de ocho cuadros de 224×256, alineados a la misma escala en pantalla. Rival y público v2: `game/cast-v2/`, con rival de 256×512 por pose y NPC de 192×256. Fuentes y referencias: `source/players-v2/` y `source/cast-v2/`. Detalles: `docs/aura-player-quality.md` y `docs/aura-cast-quality.md`.

Generación mediante la herramienta integrada **image_gen**, seguida de normalización determinista con `scripts/prepare-aura-assets.py`. Prompts: `src/scenes/aura/generation-notes.md`.

Las pruebas de `tests/aura.test.js` verifican elección, precisión temporal, una respuesta por turno, finalización, victoria/derrota y geometría de los assets. Revisión visual en navegador: carga, reinicio, pausa, cambio Gomelo→Gymbro, salida, selección del modo y entrada con Magolita, sin errores de consola.
