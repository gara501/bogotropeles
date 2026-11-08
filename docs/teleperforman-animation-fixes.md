# Teleperforman: escala y caminata con vuvuzela

La locomoción se calibra con la guardia de 178 px. El agarre usa ahora el
mismo modelo corporal de esa guardia: la hoja anterior tenía cabeza y torso
más anchos y no podía corregirse igualando únicamente su altura total.

## Cambios

- Caminata sin arma (93–100): escala compartida 178/195, igualando la altura
  de referencia de la guardia. El ciclo anterior 65–86, que se conserva en
  el atlas, también queda calibrado a 178 px.
- Vuvuzela en reposo/golpe: factor corporal 178/195. El ciclo nuevo de ocho
  pasos usa exactamente la misma altura corporal de referencia, sin cambiar
  la velocidad de juego. Se reproduce a 15 poses/s, con giro y cadera x=127.
- Deslizamiento: las cinco primeras poses se ajustan con la anchura del rostro
  de la guardia (29 px). Las medidas originales son 16, 15, 18, 16 y 23 px.
  La última pose se reemplaza por la guardia original, normalizada dentro de
  su celda, evitando el cambio brusco de proporciones al levantarse.
- Agarre: `player_3_agarre_consistent.png` recrea las doce poses desde la
  guardia original a escala nativa, sin ampliar cabeza ni torso. Celdas de
  362 × 362, cadera x=181 y apoyo y=340, en una hoja de 1448 × 1086.
  Los índices 53–64 y los contactos 59/63 conservan su función y daño.
- Dash (23–28): ajustes de volumen de rostro por pose, con factores
  0,935 / 0,889 / 0,958 / 0,909 / 0,832 / 0,904. La cabeza ya no crece en
  las poses de carrera inclinada. Las posturas bajas conservan su altura natural.
- Combo H,H,H: conserva el ajuste corporal actual 178/308 y su arte original.

La tira corregida del deslizamiento es `player_3_slide_clean.png` (936 × 122).
El original se conserva. La tira armada nueva es `player_3_vuvuzela_walk.png`
(2048 × 256), ocho celdas de 256 × 256.

## PixelLab y referencia

La referencia final se recorta por alfa de la pose de reposo de la hoja
armada original y se normaliza con vecino más cercano de 317 a 195 px de
alto, conservando sus proporciones y el tamaño relativo de la vuvuzela.
Se coloca sobre transparencia, cadera x=127 y suelo y=240.

Herramienta: PixelLab `animate_image`. Job
`3ad27ff3-02d5-45cc-835c-fc9e28ea5110`; asset
`a16c4023-ab9d-5912-8741-13d9381772f1`; semilla 60835.
La misma imagen fija el inicio y el final del ciclo. Se conservan los cuadros
generados 1–8, excluyendo la referencia inicial duplicada.

Prompt:

> Seamless 8-frame brisk WALK loop in place facing RIGHT, side view. Exactly one full gait: left leg leads, feet pass under hips, right leg leads, feet pass again and return to start. Clearly alternating legs with heel contacts and bent knees. Keep the upper body and head steady. BOTH hands firmly hold the SAME rigid vuvuzela near waist height throughout. Preserve its EXACT length, bell size, colors, grip and position relative to his torso from the reference; yellow bell points right. No attacks or blowing. Preserve EXACT man's face, head size, beard, hair, grey headset, lilac shirt, black tie, charcoal trousers, black shoes, body proportions and source art style. Fixed camera, body scale, hip axis and ground baseline, no travel, turning, effects or shadow. Transparent background.

## Agarre desde la guardia

PixelLab `animate_image`, job `dcfa21d7-cc97-4684-93f5-198872ddca7f`, asset
`baf8f254-9f1a-5e43-9805-d4de4e247a1a`, semilla 70833. Referencia: guardia
original recortada sin redimensionar, en un lienzo de 224 × 192. Se seleccionan
las poses de alcance, sujeción, elevación de rodilla y lanzamiento y se ordenan
según las fases del juego. La pose de contacto usa un ajuste de brazos con
PixelLab `edit_image_pixen`, job `7bce7db9-58c7-48aa-ba0c-cd64615f61ef`,
asset `7fd85e5b-4144-5662-8de4-83c1a28876b0`, semilla 70835. Este ajuste
conserva la rodilla levantada y extiende los brazos para sujetar al enemigo.

Prompt de la secuencia base:

> 12-frame beat-em-up grapple sequence, facing RIGHT, fixed camera and scale. Frame1 reach both hands forward; frame2 arms extended grabbing; frames3-4 hold an invisible opponent in front with both fists together at chest height, knees bent; frames5-6 keep arms forward while driving front knee upward; frame7 knee at peak; frame8 return to two-feet hold; frame9 pull hands inward and pivot torso for a throw; frame10 twist torso and sweep arms forward; frame11 release with both arms reaching forward right; frame12 recover to the original guard. One fighter ONLY, no opponent, no props or effects. Preserve EXACT same man, face, head size, slim build, torso and limb proportions as input, grey headset, brown hair/beard, lilac shirt, black tie, dark trousers and black shoes. Do not enlarge head, shoulders, hands or shoes during grab. Constant anatomical scale throughout. Hip stays centered, support foot baseline stays fixed. Transparent background, no shadow.

## Verificación

Las pruebas recorren el ciclo armado completo, giro, reposo y golpe, y
comparan límites alfa y volumen real del rostro. La prueba del agarre recorre
las doce poses y comprueba que el contacto mantiene una sola pierna apoyada.
No se usa la altura total de una postura agachada como sustituto de la escala.
Vista local: `/?playerPreview=teleperforman`, botones «Vuvuzela»,
«Caminar ←/→» y «Detener».

Verificación automatizada: 520 pruebas aprobadas y compilación de producción
correcta. Vista actual: `teleperforman-body-consistency-preview.gif`.
Se revisó en el juego la caminata armada hacia ambos lados y la vuelta a
reposo, sin errores de consola.
También se comprobó el agarre real de un enemigo y el rodillazo con la hoja
reconstruida, sin errores de consola.
