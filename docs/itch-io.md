# Version web para itch.io

Ejecuta `npm run package:itch` en Windows. Genera `dist-itch/` con rutas relativas y `releases/street-bogota-itchio.zip`, con `index.html` en la raiz, imagenes, musica y efectos. No incluye codigo de pruebas ni herramientas de desarrollo. El build normal en `dist/` permanece separado.

En itch.io, crea o edita el proyecto y selecciona **Kind of project: HTML**. Sube el ZIP y marca **This file will be played in the browser**. Configura **Embed in page** a **1280 x 720**, activa **Click to play** y el boton de pantalla completa. Tambien funciona **Click to launch in fullscreen**. Activa **Mobile Friendly**: el juego detecta dispositivos tactiles y muestra joystick y botones. En horizontal quedan a los lados del escenario; en vertical quedan debajo. Los controles de teclado siguen disponibles en escritorio.

El empaquetador comprueba el punto de entrada, las siete pistas OGG y la ausencia de las músicas MP3 retiradas, las rutas del HTML, la integridad del ZIP y los limites de archivos/tamano. Para generar una nueva entrega despues de editar sprites o sonidos, repite el comando.

Guia oficial: https://itch.io/docs/creators/html5
