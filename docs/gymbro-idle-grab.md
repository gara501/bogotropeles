# Gymbro: mismo modelo en reposo, combos y agarre

El reposo anterior venía de `player_4.png` (pose 4), con una silueta más delgada que las poses de puños de `gymbro_combos_v1.png`. El agarre usaba otro dibujo y además aplicaba `198/305 * .88`: un cuerpo de unos 175 px frente a los 198 px de la guardia del combo.

El reposo ahora reutiliza exactamente `chainPunch1[0]`, sin redibujar ni reescalar la guardia. La nueva hoja `src/data/players/player_4_agarre_consistent.png` contiene doce poses regeneradas con imagegen: alcance, sujeción, rodillazo y proyección, con la identidad y musculatura del combo de puños como referencia. Una sola escala normaliza la secuencia; las variaciones de altura proceden de flexionar las piernas o girar, sin estirar cada pose por separado.

La hoja conserva las dimensiones 1536×1024 y los índices 32–43. Los rectángulos son celdas separadas de 384×340, con pivote horizontal 192 y suelo 330. Se elimina el factor de reducción de agarre. Se mantienen las posiciones del resto de las hojas, los impactos, los tiempos y los controles de combate.

Reproducir la preparación con `python scripts/prepare-gymbro-idle-grab.py`. El prompt completo, las referencias y la fuente generada están en `docs/gymbro-idle-grab-generation.json`. Comparación a la misma escala: `docs/gymbro-idle-grab-comparison.png`.

La prueba `?playerPreview=gymbro` ofrece «Reposo», «Agarre», «Rodillazo» y «Proyectar», junto a los botones de combo. Estas acciones usan el controlador real y pausan la animación para comparar el modelo.

Validación: 797 pruebas aprobadas y compilación de producción correcta. Se comprueban la reutilización exacta de la guardia, la escala de los doce agarres, sus pivotes y líneas de suelo, la ausencia de recortes y las dimensiones del atlas.
