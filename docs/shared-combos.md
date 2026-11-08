# Combos comunes

Los cinco personajes tienen las mismas entradas. P = H (puño), K = J (patada).
Las direcciones se capturan al pulsar el ataque, tanto con teclado como con controles táctiles o gamepad.

| Entrada | Resultado |
| --- | --- |
| PPP | Tres puños y derribo |
| PPP + KK | Tres puños y dos patadas, derribo con la segunda |
| KKK | Tres patadas y derribo |
| KKK + abajo K | Cuarta patada rastrera con estela en el suelo |
| PP + KK + arriba P | Gancho con objeto y explosión |

Gomelo usa celular, Universitaria libro rojo, Teleperforman monitor de PC, Gymbro mancuerna y Magolita cepillo de limpieza.

Para enlazar, pulsar durante la recuperación del golpe anterior o hasta 20 ticks después de terminarlo (según `ARCADE.input.comboLinkFrames`). Pulsar demasiado pronto expira con el búfer habitual. Una entrada incorrecta rompe la ruta; recibir daño la cancela. Los ataques especiales conservan su propio botón y coste.

Cada enlace correcto acelera un 15 % adicional la anticipación y recuperación del ataque: ×1,15, ×1,30, ×1,45 y ×1,60. Los ticks activos se conservan para que el contacto siempre se muestre y cada ataque dañe una sola vez. Una estela celeste y blanca acompaña cada enlace. Al romper o terminar la cadena, un ataque nuevo vuelve a ×1.

PPP y KKK comparten prefijo con sus extensiones: el tercer impacto hace daño inmediatamente; su caída se confirma al cerrarse la ventana para continuar. Si se añade el remate, el enemigo cae con ese último golpe. Los jefes alcanzados también usan su animación de caída, sin aplicar el daño del súper. Las defensas e invulnerabilidades existentes siguen determinando si un golpe conecta.

## Arte

Cinco hojas `src/data/players/*_combos_v1.png`: RGBA, 1024×2048, celdas 256×256, cuatro columnas y ocho filas (32 poses por personaje, 160 en total). Filas: jab, cruzado, gancho, patada frontal, circular, alta, rastrera, gancho con objeto. Contacto: tercera columna. Origen: centro horizontal y pies, escala compartida por personaje.

Generadas con la herramienta integrada `image_gen`, tomando las hojas originales como referencia; prompts completos y archivos fuente registrados en `combo-art-generation.json`. `scripts/prepare-shared-combos.py` reproduce la normalización y la vista previa. `comboArtLayout.js` conserva los índices anteriores y agrega las nuevas poses al final.

La normalización aísla por transparencia cada personaje antes y después de escalarlo. Así elimina restos de celdas vecinas sin recortar manos, pies u objetos sostenidos. `combo-art-cleanup.json` registra los píxeles retirados por pose.

Prueba visual: `?playerPreview=teleperforman` (o el identificador de cualquier personaje). Los botones Combo reproducen la secuencia mediante el controlador real y la pausan en el contacto final. «Continuar animación» reanuda.
