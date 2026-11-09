# Gomelo: PPP y sacudida

PPP (H, H, H; X, X, X en gamepad) enlaza un recto con torsión, un cruzado bajo y un remate amplio en zancada. La referencia `ejemplos/comnbo.jpg` guía el giro del torso, los apoyos abiertos y el recorrido de los brazos. Gomelo conserva traje azul oscuro, gafas y zapatos blancos. PPKKK sigue disponible y comparte los primeros dos golpes. Solo el tercer puño de PPP derriba.

Al agarrar, pulsar puño una vez inicia una sacudida: alterna tirones y empujes, vibra al rival rápidamente, dibuja trazos blancos y celestes y lo suelta con un destello. Dura 32 ticks, suelta en el 26 y aplica daño una sola vez (48) con 400 ms de aturdimiento. La vibración afecta al dibujo, manteniendo estable el cuerpo de colisión. Pausa congela la secuencia; daño, reinicio y muerte limpian el efecto y liberan el agarre. J proyecta delante y atrás + J detrás.

`src/data/players/office_punch_shake_v1.png`: 24 poses, seis columnas y cuatro filas de celdas 320×320. Primeras tres filas: puños, contacto en columna 3. Última fila: sujetar, tirar, empujar, tirar, empujar y soltar. Misma escala corporal y suelo 304. Se añade al atlas conservando los índices anteriores.

Reproducir el procesamiento: `python scripts/prepare-gomelo-punch-shake.py SOURCE.png`. Prompt completo y fuente: `gomelo-punch-shake-generation.json`. Vista de contactos: `gomelo-punch-combo-preview.png`; animación: `gomelo-punch-combo.gif`.

Prueba en juego: `?playerPreview=office`, botones «Combo PPP» y «Sacudida». Esta última pausa durante los tirones; «Continuar animación» deja terminar la liberación.

Sonido: `public/assets/sounds/shaking.wav` se reproduce una sola vez al empezar la vibración, en el tick 4; se conserva el impacto al soltar. Sigue el control general de sonido y pausa.
