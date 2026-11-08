# Peregrinos de rodillas y carrera más rápida

Cuatro variantes de NPC vistas desde atrás, inspiradas en `ejemplos/rodillas.jpg`: hombre de camiseta azul, hombre de camiseta gris, mujer de sudadera vinotinto y hombre de chaqueta amarilla. Cada una tiene ocho fotogramas de avance de rodillas, con torso erguido, piernas dobladas hacia atrás y pequeños pasos alternados. Mantienen las rodillas bajas durante todo el ciclo.

Referencias generadas con image_gen; movimiento generado con PixelLab PixMiniMax. Las fuentes y los identificadores están en `src/scenes/monserrate/source/kneelers-reference.png`, `references/kneeler-*.png`, `kneeler-jobs.json` y `motion/kneeler-*`. Los PNG de juego miden 1536×256 (ocho celdas de 192×256), con silueta máxima de 136 píxeles, baseline 240 y alpha binaria. Reproducción con `prepare-monserrate-kneelers.py` y `fetch-monserrate.py --jobs src/scenes/monserrate/source/kneeler-jobs.json`.

Los peregrinos avanzan a **0,28 m/s**, frente a **1,2 m/s** de los caminantes. Cada tercer grupo es de rodillas; estos grupos mantienen sus carriles. Aparecen ligeramente más lejos para conservar el mismo tiempo de llegada que un grupo normal: `distanciaVisible × (velocidadPlayer − velocidadNPC) / (velocidadPlayer − velocidadCaminante)`. Así las filas lentas no se juntan de forma inesperada con las siguientes.

La carrera pasa de **14–23 a 17–28 m/s** (aproximadamente 21–22% más rápida). El recorrido conserva sus 1100 metros y tarda unos 50 segundos sin dash. La distancia visible sube a 90 metros, con al menos 2,2 segundos de lectura incluso durante el dash máximo. Los intervalos entre oleadas bajan gradualmente de 1100 a 700 ms y el control lateral sube a 7 unidades por segundo. Junto a los vendedores se reserva un hueco central durante una ventana proporcional a la velocidad.

Los nuevos NPC usan las mismas reglas de choque, vida, dash y puntos que los caminantes. Un choque con ellos también impide conseguir la tarjeta de ascenso perfecto.

Verificación: 80 recorridos con semillas y tasas de fotogramas diferentes, sin daño al seguir los huecos visibles; velocidad real de cada población, tiempo de llegada equivalente, grupos de rodillas sin cambios de carril, ocho poses distintas, tamaño, alpha y anclaje de los sprites. Vista de animaciones en `docs/monserrate-kneelers.gif`.
