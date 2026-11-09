# Giros y patadas aéreas

Los cinco personajes tienen ocho poses de voltereta y cuatro de patada aérea. El giro hacia atrás reproduce la rotación inversa manteniendo la orientación del despegue; el salto con dirección usa la secuencia a lo largo de los 39 ticks del vuelo. La patada interrumpe el giro con rodilla preparada, dos poses de extensión de talón y recogida. Sus contactos usan las fases activas existentes y cada objetivo recibe un único impacto por ataque. El dash aéreo y rebote propios de Maca Demia conservan su comportamiento.

Assets finales (PNG RGBA de 3072×256, doce celdas de 256×256):

- `src/data/players/office_air_roll_v1.png`
- `src/data/players/student_air_roll_v1.png`
- `src/data/players/teleperforman_air_roll_v1.png`
- `src/data/players/gymbro_air_roll_v1.png`
- `src/data/players/magolita_air_roll_v1.png`

Se generaron con la herramienta integrada **image_gen**, utilizando referencias del arte actual de cada personaje. Prompts completos, referencias, origen y fuentes: `prompts/air-roll/generation.json`. La normalización reproducible está en `scripts/prepare-air-roll.py`: elimina restos de alfa/croma del borde, conserva una escala anatómica por personaje y coloca las poses alrededor de un pivote compartido. Requiere Pillow, NumPy y SciPy.

`frameBaselines` conserva el suelo virtual de la celda tras recortar la transparencia, de modo que los pies o la cabeza invertida no se pegan al suelo al girar. Las poses se añaden al final del atlas sin alterar los índices anteriores.

Vista animada de los cinco personajes: `docs/all-players-air-roll.gif`. Capturas reales: `docs/air-roll-game.png` y `docs/air-kick-game.png`.

Verificación: 783 pruebas aprobadas. Se ejercitan ambos sentidos y orientaciones para los cinco jugadores, las ocho poses del vuelo, la interrupción con patada, el aterrizaje, la inversión visible del cuerpo, el margen de las celdas y el pivote vertical. Compilación HTML5 completada; ZIP para itch actualizado y revisado por CRC, contenido y presencia de las cinco hojas nuevas.
