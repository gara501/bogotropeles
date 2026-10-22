# Vuvuzela tricolor

Arma recogible inspirada en `ejemplos/vuvuzela.webp`: boquilla roja, cuerpo azul y campana amarilla. El objeto del suelo usa `src/data/items/item_vuvuzela.png`, reducido a 48 píxeles de ancho. En reposo, caminata y golpe se usan dibujos completos de cada jugador con una vuvuzela pequeña integrada en la mano. Se usa para golpear, no como ataque sonoro.

- Aparece en la primera arena de cada nivel; las siguientes tienen un 55 % de probabilidad de incluir otra.
- H o el botón táctil de puño usa la vuvuzela: daño base del puño × 1,25 y 65 píxeles extra de alcance.
- Cada ataque que llega a sus frames activos consume un uso, incluso si falla. Alcanzar varios objetivos solo consume uno. Una preparación interrumpida no consume usos.
- Dura 10 ataques. El último conserva su daño y alcance; al terminar sus frames activos se rompe con fragmentos tricolores, destellos y el sonido de rotura existente. Después vuelve el puño normal.
- El HUD muestra los usos. Las patadas y especiales siguen disponibles. El agarre automático se desactiva mientras se sostiene la vuvuzela.
- No se puede rellenar una vuvuzela equipada recogiendo otra. Se pierde al morir, cambiar de personaje o terminar el nivel.

Balance: `VUVUZELA` en `src/game/Vuvuzela.js`. El panel de pruebas de combate incluye «Recoger vuvuzela».

## Animaciones de los jugadores

Cada personaje tiene una hoja transparente nueva, `src/data/players/player_N_vuvuzela.png` (1 Gomelo, 2 Universitaria, 3 Teleperforman, 4 Gymbro y 5 Magolita), con nueve poses:

- Una pose de reposo con la mano cerrada sujetando la vuvuzela.
- Cuatro poses de ataque: preparación, inicio del movimiento, impacto y recuperación.
- Cuatro poses de caminata conservando el agarre.

Son 45 poses en total. El arma está dibujada dentro de cada pose, con dedos y muñeca envolviendo el mango. Su tamaño no depende del alcance de la caja de daño. Se recortan siluetas completas por alfa, se alinean los pies y se usan pivotes de cadera medidos por pose; cada personaje conserva una escala corporal constante durante la secuencia.

El ataque dura 24 ticks: 8 de preparación (poses 5 y 6), 4 de impacto (pose 7) y 12 de recuperación (poses 8 y 0). Solo los cuatro ticks con el dibujo de impacto producen daño y consumen un uso. El último golpe termina antes de mostrar la rotura. Las patadas, saltos, especiales, daño recibido y derrota siguen usando sus animaciones originales; la hoja armada se oculta en esos estados.

La integración usa un dibujo alternativo completo para el jugador, ocultando el dibujo desarmado mientras corresponde. Comparte posición, orientación y parpadeo de invulnerabilidad con el actor. Al soltar o romper el arma, morir o cerrar la escena se restaura el dibujo original.

Las hojas se cargan solo para el personaje seleccionado, también al cambiarlo desde el menú de pausa. Configuración de pivotes y carga: `src/data/vuvuzelaPlayers.js`. Prompts completos y referencias de ImageGen: [vuvuzela-animation-prompts.md](vuvuzela-animation-prompts.md).

## Generación del sprite

Generado con la herramienta integrada de ImageGen; fondo transparente, conservando el alfa original. Prompt utilizado:

> Create a production game sprite asset for a side scrolling beat em up set in Bogota. A SINGLE Colombian tricolor plastic vuvuzela, faithfully based on the attached reference: narrow red mouthpiece and lower tube, cobalt blue middle tube, long yellow upper tube widening into a large flared yellow bell. Horizontal orientation, mouthpiece on LEFT and bell on RIGHT, perfectly level center axis. Side view with a little visibility into the oval dark golden interior of the bell at right. Entire object visible with small empty margin. Isolated on truly transparent background. No floor, no shadow outside object, no hand, no person, no lettering, no extra objects, no sheet of variants. Style: polished hand painted arcade game item, strong dark navy outline, crisp readable silhouette, vivid yellow blue red, carefully painted plastic highlights and shadows, like a high quality illustrated beat em up pickup. Long slender proportions about 5:1 overall. Frame the object tightly on a wide landscape canvas. Input image role: reference object only. Deliver the one usable transparent sprite.
