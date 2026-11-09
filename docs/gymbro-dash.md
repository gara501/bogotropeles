# Gymbro: dash y hombrazo con el modelo del combo

El dash seguía usando las poses 16–19 de `player_4.png`, aunque reposo y agarre ya usaban el modelo del combo. Se regeneraron seis poses con imagegen, tomando `gymbro_combos_v1.png` como referencia de identidad y `player_4_shoulder.png` solo como referencia de movimiento.

La nueva hoja `src/data/players/player_4_dash_consistent.png` sirve para dash y hombrazo (índices 44–49). Mantiene las dimensiones 1920×320 del hombrazo anterior y sus seis celdas de 320×320, por lo que no desplaza ninguna hoja posterior. Todas las poses comparten una única escala corporal y el suelo en 304. La recuperación copia exactamente los píxeles de la guardia del combo, que también se usa en reposo.

Se conservan la velocidad, duración, recarga e invulnerabilidad del dash, así como el alcance, daño y contactos del hombrazo. El botón «Dash» de `?playerPreview=gymbro` pausa el controlador real durante el impulso para inspeccionar la pose; «Continuar animación» lo reanuda.

Preparación: `python scripts/prepare-gymbro-dash.py SOURCE.png`. Prompt y referencias: `docs/gymbro-dash-generation.json`. Comparación: `docs/gymbro-dash-comparison.png`.

Validación: 798 pruebas aprobadas y compilación de producción correcta. Se comprueban los índices usados por dash y hombrazo, la integridad de las seis siluetas, la escala común, la línea de suelo y la igualdad exacta de la recuperación con la guardia.
