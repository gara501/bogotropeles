# Magolita: escala, agarre y vuvuzela

## Correcciones

- La hoja de agarre original tiene cabezas y zapatos de filas consecutivas
  tocándose. Los recortes de rodillazos y lanzamiento empezaban demasiado
  abajo y cortaban la coronilla. `player_5_agarre_clean.png` separa las doce
  poses originales en celdas de 512 × 288, cuatro columnas y tres filas,
  con cadera x=256 y suelo y=276. Se recupera el cabello original; no se
  regenera la cabeza. El alfa excluye el zapato vecino que toca la coronilla.
- Los cuadros 39–50 conservan los índices y las fases de contacto. Su escala
  común pasa a 34/61, tomando como referencia la anchura de rostro de 34 px
  de la hoja base. Esto evita igualar por altura una postura agachada y otra
  erguida, lo que agrandaría el cuerpo durante la acción.
- El deslizamiento usa `player_5_slide_clean.png`. Las primeras cinco poses
  se ajustan por el tamaño del rostro (20, 21, 19, 22 y 22 px en el original).
  La sexta recupera la guardia original de Magolita, normalizada en la celda,
  para evitar cambiar de proporciones al levantarse. Se conservan los índices
  51–56, las fases del ataque y el daño.
- `player_5_vuvuzela_walk.png` contiene ocho poses nuevas de locomoción con
  el arma sujeta y piernas alternadas. Se reproduce a 15 poses/s como su
  caminata sin arma, con el mismo factor de escala y ancla de cadera x=145.
  Reposo y golpes conservan las poses de la hoja armada original.

Las hojas originales se conservan. Panela, super, ataques básicos, reposo,
derrota y victoria se contrastaron con la referencia corporal; no se fuerza
la misma altura total a gestos con brazos levantados, saltos o posturas bajas.

## Procedencia de la caminata armada

PixelLab `edit_image_pixen` parte de la pose de caminar original usada para
el ciclo sin arma, añade la vuvuzela y acorta el objeto conservando el cuerpo.
Jobs de referencia: `8ca8c086-da1d-447a-934c-2d4d56635377` y
`8df7a1be-c8e9-45a3-8626-acdd92236c8c` (semillas 50835 y 50836).

Animación: PixelLab `animate_image`, job
`fa811ba0-52f3-4b8f-bc97-4ba7c32f56c1`, asset
`8fe6086b-2db2-56d5-9fa0-812df29ac2d0`, semilla 50837. Se usa la misma
referencia al inicio y al final; los ocho cuadros generados 1–8 forman la
tira RGBA 2048 × 256, sin repetir el cuadro 0 de entrada.

Prompt:

> Seamless 8-frame brisk WALK loop IN PLACE facing RIGHT. Exactly one full gait cycle: left leg forward, feet pass under hips, right leg forward, feet pass again, return to start. Clear alternating heel contacts and bent knees, steady upper body, minimal head bob. She firmly holds ONE small red-blue-yellow vuvuzela at waist height throughout, narrow red handle in front glove and yellow bell pointing right. Horn stays rigid, same size and attached to her hand; no swinging attack or blowing. Preserve EXACT woman, face, bun, head size, stocky body proportions, blue shirt, blue apron, purple gloves, dark trousers and black shoes. Keep same pixel detail, palette and outline. Fixed camera, scale and hip position, ground baseline, transparent background. No extra objects, effects or shadow.

## Verificación

Las pruebas comparan los píxeles del cabello recuperado con la hoja original,
comprueban los márgenes transparentes de cada celda y ejercitan la secuencia
armada completa, el giro y las transiciones a reposo y golpe. La suite completa
tiene 514 pruebas aprobadas; la compilación de producción termina correctamente.
La revisión visual también detectó un fallo previo de reinicio: la limpieza
del súper intentaba actualizar un texto que Phaser ya había destruido. La
destrucción ahora libera el estado sin volver a dibujar ese HUD, con una
comprobación de regresión en la prueba de limpieza del súper.

Vista de prueba: `/?playerPreview=magolita`. «Vuvuzela» equipa el arma;
«Caminar ←/→» muestra la secuencia y «Detener» permite comparar el reposo.
