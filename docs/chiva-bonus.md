# Bonus: destruye la chiva

Aparece una vez por partida, después de Plaza de Bolívar (nivel 3), al continuar hacia La Candelaria (nivel 4). La campaña contiene ocho niveles, incluida la nueva Ciclovía como nivel 2. También se puede probar en desarrollo con `?bonusTest=chiva&character=gymbro`.

- Cuenta de preparación de tres segundos; después hay exactamente 30 segundos de juego activo.
- La chiva recibe 50 golpes confirmados. Cada ataque cuenta una sola vez, independientemente de sus frames activos. También funcionan el iPhone y los libros mediante la misma interfaz de los destructibles.
- Destruirla antes del límite paga **5000 puntos totales** de bonus. Agotar el tiempo paga **100 por golpe conectado**, hasta 4900. Las recompensas son excluyentes y se abonan una sola vez.
- La pausa y la selección de personaje detienen el reloj. El bonus no quita vidas al agotar el tiempo. Se bloquea el reinicio durante el intento para evitar duplicar premios.
- Se usan los diez estados de `src/scenes/chiva.png`, con golpes, destellos, sacudidas, humo y el estado final destruido.
- Ocho espectadores rodean la chiva con hojas nuevas en `src/data/NPC/chiva/`, basadas en las identidades de `npc_gomelos.png`. Cada persona tiene cuatro fotogramas de baile y cuatro de susto. Bailan con ritmos desfasados hasta el primer golpe válido; entonces reaccionan con un pequeño desfase y permanecen asustados. La pausa congela las animaciones. Se mantiene una escala fija de 128 píxeles de referencia por persona, con sombras proporcionales. Los haces de colores se mueven lentamente sobre el escenario. Los prompts completos están en `docs/chiva-crowd-prompts.md`.
- Si se destruye, Coste entra por la derecha, se acerca a los restos, se arrodilla y llora usando `src/scenes/coste.png`. La secuencia dura siete segundos antes de mostrar el resultado. Si se agota el tiempo, el resultado aparece después de tres segundos y Coste no entra.
- La chiva y el humo se dibujan detrás de toda la franja jugable para mantener visible al jugador al atacar. Coste conserva su capa delante del público.
- La carrocería tiene una caja sólida de aproximadamente 420 × 205 píxeles, ajustada a su tamaño visible. El cuerpo del jugador se detiene en sus bordes y puede deslizarse hacia el pasillo frontal; caminar, saltar y hacer dash no permiten atravesarla. Los golpes siguen conectando desde fuera y los restos conservan la colisión.
- El botón de siguiente nivel o Enter continúa la campaña con el premio sumado al puntaje. La marca de bonus jugado se conserva al continuar y se limpia al empezar una partida nueva.

Balance y reglas: `src/bonus/chivaRules.js`. Escenario y reacción: `src/bonus/ChivaBonus.js`. Recortes de las hojas: `src/data/chivaBonus.js`. La ruta de prueba usa el ranking de QA; los botones para golpear, destruir y agotar el tiempo solo existen en desarrollo.
