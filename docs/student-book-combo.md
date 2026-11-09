# Identidad de Universitaria: PPKKK con tres librazos

El comando común es H, H, J, J, J (PPKKK; X, X, Y, Y, Y en gamepad). Universitaria conserva sus dos puños iniciales y ejecuta tres golpes de contacto con un libro rojo: barrido horizontal con giro, librazo ascendente y remate descendente a dos manos. Las torsiones, cambios de apoyo y recorridos de brazos siguen la referencia de movimiento `ejemplos/unive.jpg`, conservando su identidad, ropa y proporciones de `student_combos_v1.png`.

La hoja `src/data/players/student_book_combo_v1.png` contiene quince poses seleccionadas, cinco por golpe, con contacto en la tercera columna de cada fila. Se omiten los seguimientos generados que soltaban el libro para mantenerlo visible durante toda la secuencia. Las poses se escalan juntas a partir de una guardia corporal de 181 px; las alturas menores se deben a flexionar las piernas.

`comboRouteAnimations` resuelve las animaciones propias de cada personaje tanto en el controlador como en el menú. Los librazos conservan K como entrada, pero usan impacto `book`: sonido de golpe y destello en el torso. Solo el quinto impacto completa el combo y derriba. No gasta energía ni activa el especial de libros orbitales. La patada normal y la aérea siguen siendo patadas fuera del combo.

Se eliminaron las demás rutas de entrada, sus demostraciones y los atajos de cadenas anteriores. El movimiento vertical del joystick ya no convierte P/K en modificadores de las rutas retiradas.

Preparación: `python scripts/prepare-student-book-combo.py SOURCE.png`. Generación con la herramienta integrada imagegen; prompt completo, referencia y selección de poses en `docs/student-book-combo-generation.json`. Animación: `docs/student-book-combo.gif`. Contactos: `docs/student-book-combo-preview.png`.

Validación: 771 pruebas aprobadas, compilación de producción correcta y remate descendente revisado con el controlador real en `?playerPreview=student`. Las pruebas verifican cinco contactos únicos, tres impactos de libro con sonido de puño, ausencia de gasto de energía, derribo solo al quinto impacto, ambas orientaciones, rechazo de rutas retiradas e integridad del atlas.
