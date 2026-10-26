# Audio en Safari / itch.io

Reporte: juego sin sonido en iPhone 17 Pro, abierto desde Safari dentro de itch.io. No se dispuso del teléfono físico para reproducir y confirmar el fallo en ese modelo.

## Cambios
- `AudioActivation` escucha los eventos de entrada dentro del propio documento del juego, en fase de captura. `AudioContext.resume()` y una muestra vacía se ejecutan sin esperar promesas, dentro del toque original; no dependen de que un evento llegue a los listeners en burbujeo de Phaser.
- Se reintenta en `touchend`/`click` aunque un intento anterior haya fallado. No se consumen ni bloquean los gestos de juego.
- Cuando está disponible, se solicita `navigator.audioSession.type = 'playback'`. La ausencia o rechazo de esa API no impide jugar.
- Recupera contextos `suspended` o `interrupted` al regresar y en el siguiente toque. No crea otro AudioContext ni reinicia pistas; no reproduce audio si el jugador eligió silencio. Las pausas del juego siguen vigentes.
- Botón **ACTIVAR SONIDO / SONIDO: ON / SONIDO: OFF** en la barra superior, también durante las introducciones. El estado de silencio se toma del evento de Phaser y de la intención del usuario, evitando depender de la actualización diferida de `AudioParam.gain.value`.
- La música espera a que el contexto esté en ejecución. Los sonidos de combate bloqueados se descartan; solo el efecto de interfaz pendiente se reproduce al activarse el audio.
- Se eliminan los listeners al destruir el juego o los propietarios de música/efectos.

## Verificación
**358 pruebas correctas**, incluida la actualización diferida del valor de ganancia. Incluyen activación síncrona, rechazo/reintento, interrupción con Phaser desbloqueado, pausa, silencio explícito, cambio entre finger-down y click, recuperación y limpieza.

Comprobación en navegador local: **ACTIVAR SONIDO → SONIDO: ON → SONIDO: OFF → SONIDO: ON**, usando el contexto real de audio. Captura: `docs/audio-activation-preview.png`. Esto no sustituye una prueba audible en Safari/iPhone físico.

## Prueba pendiente en el iPhone
1. Sustituir el ZIP anterior de itch.io por `releases/street-bogota-itchio.zip` regenerado y recargar Safari.
2. Tocar **ACTIVAR SONIDO** dentro del juego; comprobar sonido al continuar la intro, música del nivel y golpes.
3. Salir de Safari y volver. Tocar otra vez el juego si el navegador mantiene el audio bloqueado.
4. Comprobar que **SONIDO: OFF** conserva el silencio mientras se juega, hasta volver a activarlo con el botón.

## Referencias
- [WebKit: reproducción iniciada desde un gesto del usuario](https://webkit.org/blog/6784/new-video-policies-for-ios/).
- [W3C: tipos y estados de Audio Session](https://www.w3.org/TR/audio-session/).
- [itch.io: juegos HTML5 incrustados y audio al iniciar](https://itch.io/docs/creators/html5).
- [WebKit: Ogg Opus y Vorbis soportados desde Safari/iOS 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/). No se atribuyó el fallo del iPhone 17 a Ogg ni se cambiaron los formatos existentes.
