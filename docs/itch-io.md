# Version web para itch.io

Ejecuta `npm run package:itch` en Windows. Genera `dist-itch/` con rutas relativas y `releases/street-bogota-itchio.zip`, con `index.html` en la raiz, imagenes, musica y efectos. No incluye codigo de pruebas ni herramientas de desarrollo. El build normal en `dist/` permanece separado.

En itch.io, crea o edita el proyecto y selecciona **Kind of project: HTML**. Sube el ZIP y marca **This file will be played in the browser**. Configura **Embed in page** a **1280 x 720**, activa **Click to play** y el boton de pantalla completa. Tambien funciona **Click to launch in fullscreen**. Activa **Mobile Friendly**: el juego detecta dispositivos tactiles y muestra joystick y botones. En horizontal quedan a los lados del escenario; en vertical quedan debajo. Los controles de teclado siguen disponibles en escritorio.

El empaquetador comprueba el punto de entrada, las siete pistas OGG y la ausencia de las músicas MP3 retiradas, las rutas del HTML, la integridad del ZIP y los limites de archivos/tamano. Para generar una nueva entrega despues de editar sprites o sonidos, repite el comando.

Guia oficial: https://itch.io/docs/creators/html5

## Entrega del 25 de octubre de 2026

- Selector de niveles apagado (`LEVEL_SELECT = false`), además excluido del build por `import.meta.env.DEV`. Los accesos a bonus permanecen disponibles en el código para pruebas futuras.
- `npm test`: 416 pruebas aprobadas. `npm run package:itch`: compilación y ZIP correctos.
- ZIP: 312 archivos, 137.603.812 bytes (131,2 MiB). SHA-256: `fe508147798e87ce37d081a293307877be6b6e72b4e65682e188167df100e9ea`.
- Integridad comprobada del ZIP y de sus 198 imágenes. Sin selector, herramientas de pruebas ni `streetDebug` en el JavaScript de producción.
- Revisión visual en navegador: intro general, historia, selección sin selector e inicio del primer nivel en el build final servido en localhost:4173. Ciclovía (incluida meta), bonus de la chiva, ring y fases de Don Reversa revisados mediante accesos de desarrollo. Sin errores de consola en las cinco sesiones revisadas. Esta revisión es una comprobación de las pantallas indicadas, no una partida completa con cada personaje ni una prueba física en iPhone.
- Captura de selección del paquete final: `docs/itch-release-selection.png`.
