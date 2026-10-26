# Don Pico, el pollero

Enemigo de Plaza de Palomojao (nivel 7), junto con Frutatiana y Don Diablo. Una sola baja para las dos amenazas.

Sonidos: gallina `chiken.mp3` al salir y al picotear (vocalización espaciada al menos 2 segundos); Don Pico `hurt2.mp3` al recibir daño y `enemy_10_die.mp3` al morir. El archivo de la gallina está nombrado `chiken.mp3` en el proyecto.

Prueba: http://127.0.0.1:5173/?enemyTest=don_pico&character=student

- 210 HP base, velocidad 175, garrote de 14 de daño base; se aplican los multiplicadores del nivel.
- Suelta una gallina durante la pose de apertura de manos, después de 26 fotogramas de preparación. Recibir un golpe interrumpe la preparación.
- Una gallina activa por pollero, altura 25 px. Persigue los tobillos, picotea por 5 de daño base con una separación mínima de 54 fotogramas. Saltar o cambiar de carril permite esquivarla.
- El puño pasa por encima de la gallina. Cualquier patada de cualquier personaje (J o su control móvil), incluso en salto, la devuelve en la dirección del ataque y hacia un enemigo situado delante. También funciona la patada baja de Universitaria (L). El contragolpe inflige 34 y derriba a un solo enemigo; también puede alcanzar al propio Don Pico. La gallina no suma derrotas ni puntos independientes.
- Mientras está activa, Don Pico rodea al player por un carril contiguo, busca su espalda y prepara el garrotazo. La cara y la dirección del player determinan cuál es su espalda.
- Todos los personajes pueden devolver la gallina con sus patadas existentes.
- La gallina se retira al morir su dueño o a los 9 segundos. Una devolución que ya estaba en vuelo termina su contragolpe. Reiniciar, reaparecer, ganar o salir de la escena elimina las gallinas.

Assets finales: `src/data/enemies/don_pico.png` (24 poses) y `src/data/enemies/pico_hen.png` (12 poses). Generados con image_gen integrado; referencia `ejemplos/pollero.webp`.

## Prompt del personaje

Use case: stylized-concept. Production transparent pixel-art enemy sheet for Don Pico, Colombian poultry seller inspired by first reference: yellow baseball cap worn backward, yellow polo shirt, bright red/orange apron, navy trousers and dark work boots; sturdy moustached adult man, assertive expression. Second reference ONLY arcade beat-em-up art style. Carries a short rough wooden club, not knife. EXACT FOUR columns by SIX rows, 24 complete isolated body sprites on genuine transparency, equal spacious cells, facing RIGHT in three-quarter side view. Row1 four idle poses, club down beside leg. Row2 four sneaking walking poses alternating legs with club held behind back. Row3 four chicken release poses: crouch holding a live white hen with red comb, put hen down, open hands to release (no detached hen), stand back up. Row4 four wooden club attacks: club raised behind shoulder, windup, wide forward horizontal swing, recovery. Row5 two hurt then two defeat poses (falling backwards, lying on side). Row6 four forcefully grabbed struggling poses. Consistent body height and character appearance, all limbs and club fit within own cell, fully transparent gutters, no overlapping sprites, no words, logos, brand names, watermark, numbers, floor, background or cast shadows. Crisp detailed 1990s arcade pixel art dark outlines matching game style.

## Prompt de la gallina

Use case: stylized-concept. Transparent production game sprite sheet of ONE live feisty white hen, red comb and wattle, orange beak and feet, brown tail accents, facing RIGHT in side view. EXACT FOUR columns by THREE rows, twelve isolated hen sprites in equally spaced roomy cells. Row1 four fast running poses with alternate feet and slight wing bounce, hen stays low to ground. Row2 four pecking-at-ankles poses: neck forward, beak downward, peck contact, head back. Row3 four tumbling poses for when a low kick sends the hen flying (surprised wings out, sideways tumble, upside down, righted again). Non-graphic comic arcade action, no wounds. Consistent hen size across all sprites, complete bird and feet in every cell, genuine fully transparent background/gutters, no ground, shadows, labels, text, effects, people or extra objects. Crisp detailed 1990s beat-em-up pixel art with dark outlines, designed to render 25 pixels tall next to a 115px tall human fighter.

## Verificación

385 pruebas pasan y compilación correcta. Incluye J de los cinco personajes, en suelo y salto, además de los controles H y L con Player, ArcadeRuntime y el sistema de gallinas; además cubre interrupción, flanqueo, devolución contra otro enemigo, profundidad, salto, cadencia, muerte del dueño y limpieza de escena.
