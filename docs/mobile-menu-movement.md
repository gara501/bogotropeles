# Menú y movimiento en celular

El menú principal usa el alto dinámico de la pantalla y conserva el espacio de la barra superior. En celular oculta la barra de acciones de partida mientras está en el menú. En horizontal de hasta 500 px de alto, las once opciones se distribuyen en dos columnas; en vertical conservan una columna compacta. Las listas largas pueden desplazarse, siguen la selección por teclado/gamepad y tienen un botón táctil para volver.

Verificación visual: 844×390 y 568×320 en horizontal, y 320×568 en vertical. Todas las opciones principales caben sin desplazamiento ni superposición. También se comprobó la dificultad «HORA PICO», la navegación hasta el último nivel y el regreso táctil al menú. Capturas: `mobile-menu-landscape.png` y `mobile-menu-portrait.png`.

El joystick táctil ignora el 10 % central y llega a velocidad máxima con el 65 % de su recorrido; mantiene control analógico cerca del centro y normaliza las diagonales. No modifica la zona muerta del gamepad. Las velocidades de desplazamiento pasan de 205/290/220/180/205 a 245/330/260/215/245 px/s (Gomelord, Maca Demia, Teleperforman, Gymbro, Magolita). Se conservan la diferencia entre personajes, los límites del escenario y la respuesta instantánea al soltar o invertir la dirección.

Validación: 772 pruebas aprobadas, incluida la respuesta de los cinco personajes al joystick; compilación HTML5 y ZIP de itch con CRC y archivos completos verificados. La ruta de desarrollo `menuPreview` queda excluida de producción.
