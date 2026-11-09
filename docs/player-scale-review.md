# Selección y escala de los cinco personajes

La selección antes dibujaba los rectángulos originales de las hojas sin aplicar las máscaras, las escalas ni los pivotes del atlas de combate. El lienzo fijo podía cortar los recortes grandes, especialmente la celebración de Teleperforman. La demostración de combos también calculaba un zoom nuevo para cada recorte.

`src/ui/playerPreviewSheet.js` prepara las hojas mediante el mismo `prepareSheet` del juego. Selección y combos reutilizan esos píxeles y ajustan el conjunto de poses visible al lienzo con margen. Cada secuencia mantiene una escala, un pivote de cadera y una línea de suelo comunes. Los retratos de fondo usan `object-fit: contain` para conservar la imagen completa. Se evita además que una carga asíncrona anterior sustituya la animación seleccionada.

Se revisaron guardia, carrera, golpes, especiales, dash, daño, caída, victoria, agarres y combos de Gomelord, Maca Demia, Teleperforman, Gymbro y Magolita. Las variaciones de silueta por agacharse, caer, levantar un brazo o extender un arma no se corrigen estirando el dibujo.

En Teleperforman, las seis poses originales de patada pasan a la referencia de guardia de 178 px. La celebración usa un factor común 0,88: su altura visible pasa de 214–233 a 188–205 px, conservando el brazo levantado. Las carreras con objetos mantienen los ajustes de escala existentes.

Material de revisión: `*-scale-review.png` y `player-scale-audit.json`. Las medidas de color de la zona superior son un diagnóstico visual que puede incluir manos; no son medidas anatómicas automáticas. Regeneración desde la raíz: `node scripts/export-player-scale.mjs` y `python scripts/audit-player-scale.py` (Pillow, NumPy y SciPy).

Verificación: los cinco personajes completos en la selección real; combo de Teleperforman con pantalla de PC; consola sin errores; 775 pruebas aprobadas. Compilación HTML5 y ZIP de itch actualizados, CRC y contenido revisados. Captura: `teleperforman-selection-fixed.png`.
