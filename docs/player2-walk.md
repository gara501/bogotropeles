# Universitaria: ciclo de locomoción

El ciclo anterior (`0–3`) repetía la misma pierna adelantada en sus dos
zancadas extendidas. El nuevo ciclo alterna los apoyos y conserva el aspecto
de la Universitaria: cabello castaño, suéter blanco con franja marrón,
jeans azules y zapatillas blancas.

## Procedencia

- Herramienta: PixelLab, `animate_image`.
- Job: `8d9652b3-40d2-4266-ba7d-26eeb8f0db68`.
- Asset de PixelLab: `15156507-c772-5e7c-b3aa-2221012f43fa`.
- Referencia: primera pose de `src/data/players/player_2.png`, recortada y
  centrada en un lienzo transparente de 224 × 200; sin la mota bajo los pies.
- Semilla: `20832`.
- Se suministró la misma referencia como inicio y final para cerrar el ciclo.

Prompt enviado:

> Seamless looping brisk walk / jog cycle in place facing right, side view.
> Complete one full gait cycle: left leg steps forward while right leg goes
> back, feet pass under hips, then right leg steps forward while left goes
> back, feet pass again and return to the starting pose. Both legs visibly
> alternate lead with natural knee bends and foot contacts. Opposite arm
> swing, gentle hair follow-through, minimal vertical bob. Maintain exact
> same female character, face, white off-shoulder sweater with brown stripe,
> blue jeans, white sneakers, brown flowing hair, identical proportions,
> colors and rendering style. Fixed camera and scale, body stays centered,
> consistent ground baseline, transparent background. No turning, no moving
> across canvas, no attacks, no effects.

## Integración

La tira independiente `src/data/players/player_2_walk.png` se apila después
del agarre y antes del deslizamiento. Los cuadros de combate conservan sus
índices; el ciclo nuevo ocupa `58–65`. Su cadencia es de cuatro ticks por
pose a 60 Hz (15 poses por segundo).

Se usan los ocho cuadros generados (índices 1–8 del resultado), excluyendo
la referencia inicial para no duplicar la pose al cerrar el bucle. La tira
RGBA mide 1792 × 200, con celdas de 224 × 200. El eje de cadera compartido
está en x=132 de cada celda; el importador alinea los pies y conserva una
escala común. Vista animada: `docs/player2-walk-preview.gif`.

Vista de prueba: `npm run dev`, abrir `/?playerPreview=student` y usar
«Caminar ←», «Caminar →» y «Detener».

Validación: 505 pruebas aprobadas (`npm test`) y compilación de producción
correcta (`npm run build`). Se revisaron visualmente la secuencia completa,
el movimiento hacia ambos lados y la vuelta a reposo en la vista del juego;
sin errores de consola durante esa revisión.
