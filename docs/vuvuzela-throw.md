# Lanzamiento de vuvuzela

J (patada) con una vuvuzela equipada la lanza en la dirección del personaje.
También funciona durante el dash. Sin vuvuzela, J conserva la patada normal.
El HUD indica «J LANZAR».

El objeto gira durante un vuelo con arco de hasta 36 ticks (0,6 segundos),
a 520 píxeles por segundo. Puede impactar una vez al primer enemigo de su
carril: daño del puño ×1,25, retroceso 18 y aturdimiento de 300 ms, pasando
por las defensas y reglas de daño existentes. La colisión barre el tramo de
cada tick, respeta carriles y omite enemigos elevados o derrotados.

Al impactar, terminar el vuelo o alcanzar un límite del suelo, se rompe con
fragmentos y sonido y desaparece. Lanzarla consume el arma completa aunque
todavía tenga usos; no genera un objeto recogible. La pausa y las cinemáticas congelan el vuelo; morir, terminar
el nivel o destruir la escena elimina los proyectiles pendientes.

Prueba visual: `/?playerPreview=gymbro`, botón «Vuvuzela» y luego «Patada».
El botón de patada usa la entrada real del jugador para probar el lanzamiento.

Verificación: 511 pruebas aprobadas y compilación de producción correcta.
Las pruebas verifican rotura al impactar o aterrizar, desaparición de los
fragmentos y ausencia de un objeto que pueda volver a recogerse.
