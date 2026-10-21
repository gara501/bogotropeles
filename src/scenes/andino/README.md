# Escenario Andino

Escenario inspirado en la foto `ejemplos/andino.jpg`, con arte pixelado compatible con los fondos del juego.

Todos los PNG de `game/` usan un lienzo completo de **960 × 540 px**. Se superponen en `(0, 0)`; no recortar los márgenes transparentes.

Orden de dibujo, del fondo al frente:

| Archivo | Contenido | Factor de parallax sugerido |
| --- | --- | --- |
| `sky.png` | Cielo y nubes; fondo opaco | 0.06 |
| `skyline.png` | Ciudad distante y cerros | 0.18 |
| `buildings.png` | Fachada, letrero, vitrinas, escalinata y terraza del Andino | 0.55 |
| `floor.png` | Piso peatonal despejado | 1.00 |
| `streetlights.png` | Faroles independientes, detrás de los personajes | 0.85 |
| `front.png` | Ramas y jardineras de las esquinas, delante de los personajes | 1.25 |

Zona de combate sugerida: `x = 65…895`, `y = 415…500`. Mantener los personajes entre los faroles y el primer plano.

`preview.png` muestra las capas superpuestas. `reference.png` conserva el diseño completo inicial. `parallax.json` documenta dimensiones, orden y factores; este paquete no sustituye ningún nivel de la campaña.

La fachada es un punto de referencia único. Para un nivel largo, prolongar el entorno lateral o colocar la fachada una sola vez; revisar las uniones antes de repetir las imágenes horizontalmente.
