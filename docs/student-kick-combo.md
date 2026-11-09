# Universitaria: KKK con remate circular

Universitaria suma una ruta exclusiva KKK (J, J, J en teclado; Y, Y, Y en gamepad; tres toques de patada en móvil). La secuencia es patada frontal, patada lateral con giro y patada circular alta. El tercer contacto muestra la pierna elevada y un arco azul completo, basado en la referencia de movimiento aportada, conservando su cabello, ropa y proporciones actuales. Los dos primeros impactos mantienen al rival cerca; solo el tercero completa el combo y derriba.

PPKKK sigue usando los dos puños y tres librazos. Se mantiene la patada aérea independiente. KKK no se habilita para los demás personajes, y las extensiones antiguas con arriba/abajo siguen retiradas.

La hoja `src/data/players/student_kick_combo_v1.png` contiene 18 poses, seis por ataque, con contacto en la tercera columna. Usa una única escala corporal de 181 px, celdas 320×320, pivote 160 y suelo 304. Se conservan los trazos azules separados del cuerpo para mostrar el arco circular sin recortarlo. La nueva hoja se agrega al final del atlas, sin desplazar los índices de los librazos ni del arte anterior.

`routesFor(character)` resuelve las rutas particulares al reconocer entradas, enlazar ataques, nombrar el remate y construir el menú. El menú permite elegir PPKKK o KKK solo en Universitaria y restablece el índice al cambiar a otro personaje.

Generación con imagegen integrado y edición para retirar el fondo conservando ropa blanca y arco azul. Prompt, referencias y fuentes en `docs/student-kick-combo-generation.json`. Preparación: `python scripts/prepare-student-kick-combo.py SOURCE.png`. Vista de contactos: `docs/student-kick-combo-preview.png`. Animación: `docs/student-kick-combo.gif`.

Validación: 775 pruebas aprobadas y compilación de producción correcta. Se verifican exclusividad de la ruta, coexistencia con los librazos, tres contactos distintos, daño una vez por golpe, derribo al tercero, orientación izquierda/derecha, teclado y controles táctiles, etiqueta KKK y arco circular completo dentro del atlas.
