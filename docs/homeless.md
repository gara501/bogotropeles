# El Costal

`homeless` aparece una vez en la lista de tipos de los niveles 3 en adelante, incluidos los interiores. No aparece en los niveles 1 y 2.
Se conservan los totales de enemigos y los jefes. Persigue al jugador y, a 140 px, prepara
el costal durante 600 ms. La preparación se puede interrumpir con golpes o un agarre.

`SackSpin` reproduce ocho orientaciones durante tres vueltas completas: 40 pasos por
vuelta a 60 Hz. Mientras gira persigue la posición actual del jugador en horizontal y
profundidad a 1,25 veces su velocidad de caminata, respetando los límites del piso.
Solo durante el giro es invencible y no puede ser agarrado. El costal
golpea a ambos lados en un radio de 125 px y una franja de 32 px de profundidad, como
máximo una vez por vuelta; alejarse, cambiar de franja o saltar permite esquivarlo.

Tras la tercera vuelta, pierde la invencibilidad, suelta el turno de ataque y muestra
`MAREADO` durante 2000 ms del reloj de combate. Recibir golpes no reinicia el plazo ni
cancela la oportunidad de atacarlo. Puede ser agarrado, lanzado y derribado normalmente.
La pausa congela el ataque y el reloj; cerrar el escenario limpia sus banderas y turnos.

## Sprites

- `src/data/enemies/homeless.png`: 24 poses, 1280×1536, celdas de 320×256; filas de reposo,
  caminata, preparación, daño, caída y forcejeo.
- `src/data/enemies/homeless_spin.png`: 12 poses, 1280×768; ocho orientaciones de giro y
  cuatro de mareo. Se anexa debajo de la lámina principal para formar el atlas de 36 poses.
- `src/data/homeless.js`: recortes, anclas, secuencias y parámetros.

Arte generado con la herramienta integrada ImageGen, usando `ejemplos/indigente.jpg`
como referencia de apariencia y `motorata.png` para el estilo arcade. Se mantuvo el alfa
y se empaquetaron figuras separadas en celdas uniformes, ancladas por la posición de los pies.

Prompts de arte utilizados, resumidos:

1. Crear 24 poses en cuatro columnas y seis filas de un hombre adulto de piel morena,
   cabello largo enredado, cinta clara en la cabeza, barba larga entrecana, abrigo oscuro
   gastado, bufanda roja, pantalones oliva, zapatos oscuros y un gran costal negro sobre
   el hombro. Cuatro poses por fila de reposo, caminata, preparación del giro, daño,
   caída y forcejeo. Pixel art arcade detallado, cuerpo completo, personaje consistente,
   orientación derecha y fondo RGBA transparente, sin escenario ni otros personajes.
2. Crear 12 poses del mismo personaje: ocho ángulos consecutivos separados 45 grados
   que completan una vuelta con el costal extendido, incluyendo vistas de espalda y frente;
   cuatro poses de mareo con el costal bajo, cuerpo encorvado y cabeza oscilante. Cuatro
   columnas y tres filas, mismo diseño, pies y costal completos y fondo transparente.

## Audio

| Enemigo | Al recibir un golpe | Al morir |
| --- | --- | --- |
| El Costal | male_grunt4.mp3 | homeless_die.mp3 |
| Motorata | male_grunt4.mp3 | motorata_die.mp3 |
| Guitarrista | male_grunt.mp3 | guitarista_die.mp3 |
| enemy_11 | female_grunt.mp3 | enemy_11_die.mp3 |
| enemy_10 | Sonido existente | enemy_10_die.mp3 |
