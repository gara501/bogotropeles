# Pantalla Game Over

La derrota definitiva (`game-over`) abre una pantalla completa que reutiliza `src/scenes/gameOver.png`: seis poses de burla animadas mediante posiciones de fondo en CSS, sin modificar la imagen original. El fondo es `src/scenes/level_6.png`, una calle del juego, con oscurecimiento gradual y líneas sutiles para mantener legibles los textos.

Texto solicitado, conservado literalmente: **jijiji juep... le quedó grande?**

Se mantienen la puntuación, el récord local, la entrada de iniciales, el ranking y el botón de nueva partida. La imagen y el texto exclusivo de derrota permanecen ocultos en los resultados de nivel, bonus y continuación. El lector de pantalla recibe la burla, el motivo de derrota y el puntaje como descripción del diálogo.

La composición usa dos columnas en escritorio y se adapta a móvil. El ranking tiene desplazamiento propio cuando crece; no hay desplazamiento horizontal. Los seis gestos de la cara se repiten en un bucle infinito de 1,05 segundos, también con `prefers-reduced-motion`, según la preferencia explícita del usuario; en ese caso solo se elimina la transición de entrada. Se verificaron el guardado de iniciales y el regreso a selección en escritorio y en un viewport de 390 × 660.

Implementación: `index.html`, `src/style.css` y `src/main.js`. Solo se reutilizan imágenes existentes; no se generaron ni reemplazaron assets.

Prueba de desarrollo: `?gameOverTest=1`. Abre la derrota con 12500 puntos ficticios y usa las claves de ranking/récord de QA, sin modificar los récords reales. La ruta de prueba se elimina del código de producción.

Capturas: `docs/gameover-preview.png` y `docs/gameover-mobile-preview.png`.
