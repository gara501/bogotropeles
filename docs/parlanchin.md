# Parlanchín · mimo

Enemigo exclusivo de los niveles jugables **3 (Plaza de Bolívar), 4 (La Candelaria) y 6 (Chorro de Quevedo)**. Se añade a sus grupos sin cambiar los totales, los jefes ni el orden de la campaña.

- Vida base 160 y velocidad base 305 px/s, ajustadas por el nivel. Esquiva el 70 % de los nuevos ataques cercanos que detecta, con 1,15 s de recarga entre esquivas. La esquiva dura 330 ms y puede saltar al otro lado del jugador; respeta los bordes del escenario.
- Patada voladora desde 225 px: preparación de 22 pasos, salto de 30 pasos con hasta 215 px de avance y 52 px de altura, recuperación de 30 pasos y descanso de 72 pasos. Fija el carril al despegar: cambiar de profundidad permite esquivarlo. Solo conecta una vez por ataque y puede ser interrumpido según las reglas normales de combate. Los pasos son a 60 Hz.
- Mímica cuando le queda menos del 90 % de vida y el jugador está al menos a 120 px. Preparación de 450 ms y gesto de 1350 ms. **Al terminar recupera exactamente un 10 % de su vida máxima del nivel**, hasta el máximo. No recibe energía parcial antes de terminar. Descansa 6,5 s entre curaciones; un golpe cancela la curación y retrasa el siguiente intento 4,5 s.
- Efecto: halo verde pulsante, anillo en los pies, cruces ascendentes y cartel `MÍMICA +10%`. El reloj de combate controla todo el efecto: se congela en pausa y se destruye al interrumpir, morir o salir del nivel. La barra refleja la vida recuperada.

## Assets e implementación

- `src/data/enemies/parlanchin.png`: PNG RGBA de 1060 × 1484, 28 poses en 4 columnas y 7 filas. Reposo (0–3), carrera (4–7), patada voladora (8–11), esquiva (12–15), mímica (16–19), daño y derrota (20–23), forcejeo (24–27). Se preserva el alfa original. Recortes medidos por componentes alfa; no se altera el PNG generado.
- `src/data/mime.js`: recortes, animaciones y mecánicas.
- `src/actors/HealingAura.js`: efecto dibujado con Graphics de Phaser, sin temporizadores ni tweens que continúen al pausar.
- Se reutilizan los controladores de salto, esquiva y curación de `Enemy`; la curación discreta se activa con `heal.amount`, conservando las curaciones graduales existentes.
- Prueba de desarrollo: `?enemyTest=parlanchin&character=office`. Botones de patada, mímica, interrupción y congelación, con vida y estado visibles. Solo se incluye en desarrollo.
- `docs/parlanchin-heal-preview.png`: captura del enemigo y el efecto en el nivel 3.

## Generación de arte

Herramienta integrada **ImageGen**, con fondo transparente. Referencia del usuario: `ejemplos/mimo.jpg`. Apariencia: boina negra con cinta roja, maquillaje blanco, camiseta a rayas, tirantes, pantalón negro, guantes blancos y zapatos negros. Estilo arcade coherente con los enemigos existentes.

Prompt final:

Use case: stylized-concept. Asset type: production animation sprite sheet for a Bogotá side scrolling arcade beat-em-up. Create PARLANCHÍN, a very agile adult male street mime, based on the attached photo: white face makeup with dark theatrical eyes and red lips, black beret with narrow red band, black-and-white horizontal striped long sleeve shirt, black suspenders, loose high-waisted black trousers, white gloves, black shoes. Match detailed chunky 1990s Final Fight pixel art, crisp dark outlines, readable at 120 pixels high, serious humorous street fighter. TRUE transparent background. Exactly TWENTY EIGHT separate full body poses in FOUR equally spaced columns and SEVEN rows. Consistent character scale, each cell generous gutters, every glove shoe and beret fully inside its cell; no overlap. ALL face RIGHT in side/three-quarter view. Row 1: four lively idle guard mime poses, hands up against an imaginary wall. Row 2: four distinct fast running phases. Row 3: flying kick sequence: crouched takeoff, airborne tucked knee, airborne fully extended horizontal right-leg kick, landing follow-through. Row 4: four distinct evasive acrobatic hop/dodge poses. Row 5: four clearly different MIME HEAL gestures, both white-gloved hands acting out an invisible box and pulling an imaginary rope, ending in proud chest-up pose. Row 6: recoil from hit, bent over hurt, tumbling fall, lying defeated. Row 7: four struggling poses held by an opponent (only this mime visible, arms moving, no second person). No text, no grid, no cell borders, no labels, no drawn shadows, no scenery, no VFX or objects. Transparent pixel art sprite sheet.
