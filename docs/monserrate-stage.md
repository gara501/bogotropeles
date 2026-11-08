# Monserrate · Ascenso

Campaña: nivel 5, después de Plaza de Bolívar y antes de La Candelaria. El bonus de la chiva mantiene su posición al terminar la plaza; después continúa Monserrate.

Carrera automática de 480 metros, aproximadamente un minuto. Se esquiva con ←/→, A/D o el eje horizontal del joystick. P pausa; R reinicia. Cada choque quita 18 de vida, ralentiza brevemente y concede 1,2 segundos de protección. Las vidas y continuaciones pertenecen a la partida compartida. Reaparecer conserva el avance y despeja los NPC cercanos. Completar entrega 1500 puntos; cada caminante esquivado entrega 25.

La velocidad aumenta de 6,6 a 9,2 m/s. Los caminantes avanzan a 1,2 m/s. Aparecen a 34 metros: más de cuatro segundos de anticipación incluso a máxima velocidad. Al principio aparecen solos; luego en parejas. Cada oleada deja un carril completo libre y el hueco siguiente está en el mismo carril o uno contiguo. Cambiar de carril requiere unos 0,28 segundos; la separación mínima entre oleadas es 1,05 segundos. Cada séptima oleada reduce la presión y los últimos 42 metros dejan de generar peatones.

## Arte

Escenario generado con image_gen a partir de `ejemplos/monserrate.jpeg`: escalones de piedra, bosque andino y barandas. La versión `background-v2.png` amplía el santuario y deja libre su silueta entre dos paneles laterales del HUD. El fondo se acerca progresivamente un 18% con el avance, conservando la cruz dentro de pantalla. El suelo en movimiento usa un recorte de las piedras del escenario original, proyectado con la misma perspectiva que los personajes.

El bosque tiene 40 objetos independientes: árboles y arbustos generados como recortes transparentes en seis variantes. Se proyectan desde posiciones de mundo junto a la escalera y pasan hacia afuera y hacia abajo al correr, aumentando de tamaño cerca de la cámara. Recirculan fuera de la vista y aparecen suavemente a lo lejos. El movimiento depende de la distancia recorrida: pausa, choque y muerte afectan a todas las capas de forma coherente. Normalización reproducible mediante `python scripts/prepare-monserrate-scenery.py`; fuentes preservadas en `source/foliage-v2.png` y `source/background-v2.png`.

## Sendero con curvas y puestos de velas

El recorrido usa una línea central suave con giros a ambos lados. El suelo, las barandas del fondo, el bosque, las rocas, los caminantes y los vendedores comparten la misma proyección de curva. En el plano del player el centro permanece fijo: el giro no desplaza al jugador ni altera las distancias de colisión. El santuario mantiene su encuadre despejado por encima del sendero.

Entre los metros 130 y 315 aparece gradualmente una escalinata de piedra natural con paredones y salientes rocosos, inspirada en `ejemplos/monserrate2.jpg`. Después regresa el bosque y se pasa por una zona de velas antes del santuario. Se mantienen las oleadas originales y el hueco alcanzable de cada grupo.

Hay nueve vendedores en posiciones fijas del mundo, con cuatro variantes de ruana, canasta o mesa de velas inspiradas en `ejemplos/velas.webp`. No caminan ni siguen al player; la carrera hace que se los deje atrás. Se ubican en las bermas fuera de los tres espacios de paso para que sus puestos no formen bloqueos inesperados. Son personajes ambientales sin colisión propia; los caminantes conservan el daño por choque.

Arte generado con image_gen y normalizado con `python scripts/prepare-monserrate-trail.py`. Fuentes: `source/vendors-v3.png`, `source/rocks-v3.png` y `source/roughstone-v3.png`. Assets: cuatro vendedores de 192×256, cuatro recortes rocosos de 256×384 y textura de escalones de 256×128, con alpha binaria y nearest.

Cinco players de espaldas, con ocho fotogramas de carrera cada uno. Ocho NPC originales de espaldas, con cuatro fotogramas de caminata cada uno. Las referencias conservan las identidades del juego; las animaciones fueron generadas con PixelLab PixMiniMax. Los originales, referencias normalizadas, identificadores y manifiesto están en `src/scenes/monserrate/source/`. Los sprites de juego están en `src/scenes/monserrate/game/`.

Cada celda mide 192×256, con escala fija por clip, altura máxima de 208 y baseline 240. Alpha binaria, margen lateral mínimo de ocho píxeles y filtro nearest. El mismo factor de perspectiva rige posición y escala; los NPC alcanzan el tamaño del player en el plano de colisión.

Reproducir normalización con `python scripts/prepare-monserrate.py` y descargar/ensamblar las animaciones con `python scripts/fetch-monserrate.py`. Este último requiere acceso a los enlaces públicos de los trabajos generados en PixelLab; los resultados ya están guardados en el proyecto.

## Verificación

Pruebas de patrones y recorridos con semillas distintas a 30, 60 y 144 Hz, colisiones, reaparición, pausa, teclado y joystick, continuación, reinicio, recompensa única y transición a La Candelaria. Validación de dimensiones, alpha, márgenes, baseline y poses distintas de todos los sprites. Revisión visual del nivel, daño, pausa, cambio de personaje y final en el navegador; sin errores de consola.

Ruta local de desarrollo: `/?monserrateTest=1&character=magolita`. Admite `office`, `student`, `teleperforman`, `gymbro` y `magolita`. `mobilePreview=1` muestra los controles táctiles.

Para revisión de arte en desarrollo, `&monserratePreview=200` abre la escalinata en pausa sin overlay; P continúa. El valor es la distancia del recorrido (0–420), no cambia la campaña ni existe en la compilación de producción.
