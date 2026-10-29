# Música y vuelo de palomas

Revisión adicional: Phaser 3.90 programa dos buffers finitos para mantener el bucle WebAudio. Ambos pueden terminar durante una suspensión prolongada del render mientras `isPlaying` sigue activo. El controlador observa el final real de los buffers, las fuentes ausentes y las posiciones que exceden la duración para reiniciar la pista agotada. Un buffer de relevo todavía activo no provoca reinicios. Pausa y detención definitiva conservan prioridad. Esta ruta se verifica mediante simulaciones; falta confirmar la incidencia concreta en el dispositivo del usuario.

`pidgeon.mp3` suena una vez al despegar cada grupo de palomas del escenario, al lanzar una nube de La Palomera, al crear su escudo volador y al lanzar una paloma individual. No se reproduce de nuevo en cada fotograma.

La selección aleatoria incluye diez pistas y evita repetir inmediatamente la anterior: `music1.ogg` a `music7.ogg`, más `music8.mp3`, `music9.mp3` y `music10.mp3`. No se encontró `music7.mp3` en el proyecto; se conserva `music7.ogg`. El primer nivel y las peleas de jefe mantienen sus temas específicos. El empaquetador de itch verifica los formatos actuales.

## Diagnóstico y recuperación

Las diez pistas disponibles se decodificaron por completo con PyAV: duran entre 72 y 197 segundos, sin errores ni silencios prolongados. No se reprodujo la incidencia en el dispositivo del usuario.

El controlador anterior solo intentaba reproducir al construirlo, desbloquear audio o cambiar la pausa. Si el arranque fallaba, la pista se detenía inesperadamente o llegaba tarde a la caché, podía quedarse sin música hasta otro evento externo. Además, el código de HTMLAudio de Phaser captura el rechazo de `HTMLMediaElement.play()` sin corregir necesariamente su indicador `isPlaying`; ese estado puede decir que la pista suena aunque la etiqueta esté pausada.

`LevelMusic` ahora sincroniza al recuperar el contexto, volver al juego, reanudar la escena y recibir una entrada de caché, y revisa el estado una vez por segundo mientras la escena está activa. El modo HTMLAudio comprueba también la etiqueta real y reintenta en el gesto del usuario, conservando la posición. Las pistas que ya suenan no se reinician. Pausa, cinemáticas y fin del nivel siguen respetándose; detener o destruir elimina los listeners para impedir música de escenas anteriores.

Validación: pruebas de arranque fallido con reintento limitado, recuperación de detención, carga tardía, contexto interrumpido, rechazo HTMLAudio, pausa, victoria y limpieza; sonidos de vuelo en los sistemas reales de palomas; existencia de las diez pistas y compilación de producción.
