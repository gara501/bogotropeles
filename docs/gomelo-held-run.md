# Gomelo con objeto en la mano

La vuvuzela ya usa la carrera de diez poses de Gomelo. La panela conservaba cuatro poses de locomoción de su hoja de lanzamiento, con el mismo pie adelantado y una cadencia más lenta: daba la impresión de deslizarse.

`player_1_panela_run.png` añade diez poses con apoyos alternados. Se reproducen cada tres ticks (20 poses/s), igual que la carrera desarmada y con vuvuzela. Se usa una única escala corporal y el mismo pivote, tanto a derecha e izquierda como al desplazarse en profundidad. Al detenerse vuelve al reposo con panela; al lanzar o recibir daño se muestran las poses correspondientes.

La nueva textura se carga con los niveles que usan panela y se libera al retirar el personaje de la caché. Los índices de reposo y lanzamiento permanecen en su hoja original.

Arte: edición con la herramienta integrada `image_gen` del ciclo existente de vuvuzela, sustituyendo el instrumento por un bloque de panela. Referencias, fuente y prompt están en `prompts/gomelo-*`; `scripts/prepare-gomelo-panela-run.py` reproduce la limpieza de alfa, normalización a celdas 128×128 y vista animada. Archivo final: `src/data/players/player_1_panela_run.png`.

Vista del ciclo: `docs/gomelo-held-run.gif`. Vista en juego: `?campaignPreview=panela&character=office`; mantener A/D o las flechas para desplazarse.
