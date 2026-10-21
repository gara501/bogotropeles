# Brayatan: jefe del nivel 6

Brayatan reemplaza a Dormilón en la campaña actual. Aparece después de los 30 enemigos del nivel 6, con la música y la barra de jefe. Su derrota completa la campaña actual y otorga 4000 puntos. Dormilón conserva sus fuentes y su ruta de pruebas `bossTest`, pero no aparece en el recorrido normal.

Su hoja `src/data/bosses/brayatan.png` contiene 28 poses basadas en la referencia: gorra verde, gafas oscuras, chaqueta turquesa, camiseta magenta, jeans y machete. El atlas y los valores de combate están en `src/data/brayatan.js`; la máquina de estados está en `src/actors/BrayatanController.js`.

- **Cuchillos:** dos lanzamientos separados; los proyectiles usan el sonido y las colisiones habituales.
- **Baile de machete:** tres contactos independientes, con preparación visible y remate con retroceso.
- **Carga de machete:** avisa, corre hacia el jugador y golpea durante la pose de machetazo. Se detiene en los límites del escenario.
- **Salto y stomp:** prepara el salto y fija la última posición del jugador al despegar. Desaparece durante 66 frames. Sólo su sombra se mueve hasta ese punto; la caída nunca vuelve a apuntar al jugador. Al aterrizar hay daño de área con poca profundidad en Y, onda de impacto, sacudida y sonidos de estruendo. Apartarse o saltar evita el golpe; después de caer queda expuesto.

Al llegar al 50% de energía, entra una sola vez en furia: aumenta 45% la velocidad, reduce sus descansos y lanza cinco cuchillos por ráfaga, con más ataques a distancia en su secuencia.

Las acciones usan frames de simulación a 60 pasos/s y un token de ataque. Recibir daño puede interrumpir sus ataques en el suelo. En el aire es invulnerable. La muerte, el respawn y el cierre del escenario limpian la sombra y los efectos pendientes.

Prueba de desarrollo: `?enemyTest=brayatan&character=gymbro`. El panel permite ejecutar cada ataque y activar la furia.
