# Teleperforman: puños, diadema y teléfono

PPP (H, H, H; X, X, X en gamepad) es el combo tradicional: recto, cruzado y gancho ascendente sin objeto. Usa `chainPunch1/2/3`; el último conserva el gancho inspirado en Cody. PPKKK comparte los primeros dos puños y continúa con tres patadas. Solo el último golpe de cada ruta derriba.

Al agarrar un enemigo y pulsar puño una vez, Teleperforman ejecuta automáticamente los tres latigazos de diadema de la secuencia 4 de `ejemplos/teleper.jpg` y suelta al rival. Usa las 18 poses `chainHeadset1/2/3`, cuatro ticks por pose y sonidos de látigo en los contactos 9, 33 y 57. Mantiene sujeto al rival, lo libera en el tick 68 y recupera hasta el 76. El daño se aplica una sola vez al liberar: dos puños normales, actualmente **52**, sin multiplicador de remate ni coste de energía. La vibración, las líneas de velocidad y el destello siguen el sistema de la sacudida de Gomelo. Pausa congela la acción; daño, reinicio y muerte liberan y limpian el efecto. J proyecta delante y atrás + J detrás.

KKK (J, J, J; Y, Y, Y) mantiene la segunda secuencia de la referencia: swing ascendente, giro en tirabuzón y golpe descendente contra el suelo. Usa carnet blanco, cinta azul y auricular de teléfono negro en el extremo. Sus alcances son 125/135/145 y sus impactos usan `celuco.mp3`. No gasta energía del especial K.

`src/data/players/teleperforman_weapon_combos_v1.png` conserva 36 poses en seis columnas y seis filas, celdas 384×384, pivote 192 y suelo 368. Las primeras 18 se reservan para el agarre; las últimas 18 son KKK. Los latigazos conservan la corrección de escala ×0,9 para igualar la cara con reposo (aproximadamente 668 frente a 660 píxeles de piel). Los índices anteriores se mantienen.

Normalización: `python scripts/prepare-teleperforman-weapons.py PPP_SOURCE.png KKK_SOURCE.png`. Los nombres históricos PPP de fuentes y GIF corresponden al arte que ahora se usa en el agarre. Generación con `imagegen` integrado, prompts y fuentes en `teleperforman-weapon-combos-generation.json`; informe en `teleperforman-weapon-art-validation.json`.

Prueba visual: `?playerPreview=teleperforman`, «Combo PPP» para los puños, «Agarre» y «Latigazos» para la diadema, «Combo KKK» para el teléfono y «Continuar animación» para completar una demostración pausada.
