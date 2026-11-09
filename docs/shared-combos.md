# Combos comunes

Los cinco personajes comparten **PPKKK**. Universitaria además dispone de **KKK**, tres patadas que terminan en una circular alta. P = H (puño), K = J (botón de patada; su animación depende del contexto). En gamepad, PPKKK = X, X, Y, Y, Y y KKK = Y, Y, Y. En móvil se pulsan los mismos botones en pantalla.

| Entrada | Resultado |
| --- | --- |
| PPKKK · Gymbro | Dos puños, patada baja en giro, patada ascendente y remate lateral |
| PPKKK · Universitaria | Dos puños, librazo horizontal con giro, librazo ascendente y remate descendente a dos manos |
| KKK · solo Universitaria | Patada frontal, patada lateral y remate circular alto con arco de movimiento |
| PPKKK · otros personajes | Dos puños y tres patadas, conservando el arte propio de cada personaje |

Gomelo además dispone de **PPP**: recto con torsión, cruzado bajo y remate en zancada, basado en `ejemplos/comnbo.jpg`. Comparte los primeros dos puños con PPKKK; la tercera entrada decide la continuación. Se retiraron PPP + KK, KKK + abajo K y PP + KK + arriba P. KKK está habilitado para Universitaria (patadas) y Teleperforman (teléfono), y PPP para Gomelo y Teleperforman mediante sus rutas por personaje. El movimiento vertical no transforma P/K en entradas direccionales.

Para enlazar, pulsar durante la recuperación del golpe anterior o hasta 28 ticks después de terminarlo (`ARCADE.input.comboLinkFrames`). Pulsar demasiado pronto expira con el búfer habitual. Una entrada incorrecta rompe la ruta; recibir daño la cancela. Los ataques especiales conservan su propio botón y coste; los librazos del combo no gastan energía especial ni invocan libros orbitales.

Los primeros golpes salen a velocidad normal; el remate acelera la anticipación a ×1,60 y multiplica el daño por 1,25. Los ticks activos se conservan para que el contacto siempre se muestre y cada ataque dañe una sola vez.

Dash: SHIFT o adelante, soltar, adelante en 18 ticks (300 ms). Funciona con teclado, joystick táctil y gamepad a través de la entrada común de movimiento. Mantener la dirección no repite dash. Se conservan recarga, invulnerabilidad y restricciones de estado. Pausar o reiniciar limpia el gesto.

Proyección para los cinco personajes: caminar contra un rival normal lo agarra; patada lo proyecta hacia delante y atrás + puño hacia atrás (en Gomelo, atrás + patada). El rival se eleva sobre el hombro durante la preparación, conserva su altura al soltarse y describe un arco hasta caer. Puede derribar a otros enemigos durante el vuelo; el daño al rival proyectado se aplica una vez al aterrizar. Una interrupción antes de soltarlo lo devuelve al suelo. Los jefes conservan sus restricciones de agarre.

Solo el último golpe de cada ruta completa el combo y derriba: el quinto de PPKKK o el tercero de KKK/PPP. Las defensas e invulnerabilidades existentes siguen determinando si un golpe conecta. Los golpes intermedios mantienen al rival cerca para enlazar la secuencia.

Gomelo agarrando: un toque de puño inicia una sacudida de 32 ticks con líneas de velocidad blancas/celestes, vibración visual y destello al soltar. Daño único de 48 y aturdimiento de 400 ms. Patada proyecta delante; atrás + patada proyecta detrás. Los demás personajes conservan sus controles de agarre. Arte, reproducción y prompt en `docs/gomelo-punch-shake.md`.

Teleperforman suma PPP de puños con gancho final y KKK con carnet y teléfono (secuencia 2 de `ejemplos/teleper.jpg`). La diadema como látigo (secuencia 4) se ejecuta solo con agarre + puño: tres latigazos, daño total de dos puños y liberación del rival. PPKKK comienza con dos puños y continúa con tres patadas. Detalles en `docs/teleperforman-weapon-combos.md`.

## Arte

Universitaria KKK: `student_kick_combo_v1.png`, 18 poses, tres filas de seis celdas de 320×320. La tercera columna de cada fila marca contacto. La última fila muestra la patada circular y conserva su arco azul completo, incluidos trazos separados del cuerpo. Las rutas se consultan por personaje mediante `routesFor`, también al elegir continuaciones, resolver el nombre del combo y construir el menú. Documentación, GIF y referencias en `docs/student-kick-combo.md`.

Universitaria: `student_book_combo_v1.png` añade 15 poses (tres golpes × cinco poses), con el contacto en la tercera columna. Su ropa, cuerpo y libro rojo siguen `student_combos_v1.png`; `ejemplos/unive.jpg` aporta las torsiones, apoyos y recorridos de brazos, sin cambiar su identidad por la del personaje de la referencia. Se seleccionaron únicamente poses con el libro sostenido y se normalizó toda la secuencia a una única escala corporal de referencia de 181 px. Las celdas son 320×320, con pivote 160 y suelo 304. `comboRouteAnimations` permite que la ruta compartida use `chainBook1/2/3` solo en Universitaria. `impactType: book` elige sonido de golpe y destello a la altura del torso, conservando K como entrada.

Preparación: `python scripts/prepare-student-book-combo.py SOURCE.png`. Prompt completo y selección de poses: `docs/student-book-combo-generation.json`. Vista de contactos: `docs/student-book-combo-preview.png`; secuencia animada: `docs/student-book-combo.gif`.

Cinco hojas `src/data/players/*_combos_v1.png`: RGBA, 1024×2048, celdas 256×256, cuatro columnas y ocho filas (32 poses por personaje, 160 en total). Filas: jab, cruzado, gancho, patada frontal, circular, alta, rastrera, gancho con objeto. Contacto: tercera columna. Origen: centro horizontal y pies, escala compartida por personaje.

Las cinco tiras `src/data/players/*_uppercut_v1.png` añaden 20 poses de gancho ascendente sin objeto: cuatro por personaje (Gomelo, Maca Demia, Teleperforman, Gymbro, Magolita). Se agregan al final de cada atlas, conservando los índices anteriores, y sustituyen la animación `chainPunch3`. Cada personaje carga solo sus cuatro poses. Vista conjunta: `docs/cody-uppercuts-preview.png`. Generadas con `imagegen` tomando las cinco hojas anteriores como referencia; `scripts/prepare-cody-uppercuts.py SOURCE.png` detecta las bandas reales, aísla por alfa, normaliza escala y alinea los pies. Fuente original: `C:/Users/gandr/.codex/generated_images/01a1be31-fac4-7270-916e-3864593af3f3/exec-85b0120c-fa77-4eb5-b88b-e07291da2394.png`.

`gymbro_mobile_kicks_v1.png` añade 12 poses de giro para Gymbro (4×3): patada baja con torsión, circular ascendente y remate lateral. Las dos primeras recuperaciones mantienen la rodilla recogida para enlazar el giro. La referencia `ejemplos/combo_4.png` guía el movimiento; `gymbro_combos_v1.png` conserva identidad, ropa y escala. Fuente: `C:/Users/gandr/.codex/generated_images/01a1be31-fac4-7270-916e-3864593af3f3/exec-e47b46d1-2dce-4e5f-9db3-5892ccb5b416.png`; normalizar con el mismo script y `--gymbro-kicks`. Se reemplazan las animaciones compartidas de patada de Gymbro, también usadas por KKK y las otras rutas.

Generadas con la herramienta integrada `image_gen`, tomando las hojas originales como referencia; prompts completos y archivos fuente registrados en `combo-art-generation.json`. `scripts/prepare-shared-combos.py` reproduce la normalización y la vista previa. `comboArtLayout.js` conserva los índices anteriores y agrega las nuevas poses al final.

La normalización aísla por transparencia cada personaje antes y después de escalarlo. Así elimina restos de celdas vecinas sin recortar manos, pies u objetos sostenidos. `combo-art-cleanup.json` registra los píxeles retirados por pose.

Prueba visual: `?playerPreview=teleperforman` (o el identificador de cualquier personaje). Los botones Combo reproducen la secuencia mediante el controlador real y la pausan en el contacto final. «Continuar animación» reanuda.
