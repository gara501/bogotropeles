# Caminata de Teleperforman

La escala y el ciclo con vuvuzela se revisaron de nuevo en
[teleperforman-animation-fixes.md](teleperforman-animation-fixes.md).

Actualización: el ciclo activo se reemplazó por una secuencia de ocho poses
generada con PixelLab. Véase [locomotion-pixellab.md](locomotion-pixellab.md).
La integración anterior descrita abajo se conserva como fuente de los
cuadros 65–86, que ya no se reproducen durante el movimiento.

Se integra el asset proporcionado `src/data/players/player_3_walking.png` sin editar el PNG. Contiene 22 poses en una cuadrícula de cinco columnas; la última fila solo contiene dos.

Se anexan como cuadros 65–86 después de las hojas principal, combo y agarre (offset vertical 3620). Recortes por alfa >32, anclas de torso individuales y escala por pose para conservar una altura de referencia de 195 píxeles. Reproducción a 24 fps, reflejada al caminar hacia la izquierda. Los índices de ataques, agarres e inactividad se conservan.

Validación: 417 pruebas aprobadas, build correcto y comprobación de caminar en ambas direcciones y transición al puño en `?playerPreview=teleperforman`, sin errores de consola.
