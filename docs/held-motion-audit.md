# Revisión de los cinco personajes con objetos

Se sustituyen los ciclos de locomoción con vuvuzela y panela de Gomelo, Universitaria, Teleperforman, Gymbro y Magolita por diez hojas coherentes con sus movimientos desarmados: diez poses para Gomelo y ocho para cada uno de los demás. Los pasos alternan las piernas; los brazos sujetan el objeto durante todo el bucle. Se conserva la cadencia de cada personaje (3 o 4 ticks por pose).

La importación es común a ambos objetos: celdas RGBA de 256×256, pivote horizontal 128, pies en la línea 248 y escala corporal nativa. Todas las hojas están en `src/data/players/*_motion_v2.png`. Las poses antiguas de reposo y golpe/lanzamiento siguen en sus hojas de nueve poses; ambos objetos aplican el mismo ajuste de escala para Gymbro y Teleperforman. El sprite con objeto también conserva la paleta y transparencia del personaje.

La carga diferida al cambiar de personaje exige que estén listas las texturas de reposo, locomoción y súper. Las nuevas tiras se liberan junto a los demás recursos del personaje al salir de la caché.

## Arte y reproducción

Se usó la herramienta integrada `image_gen`, con los ciclos desarmados como referencias de identidad y movimiento. Fuentes, referencias y prompts completos: `prompts/held-motion/generation.json`. Magolita con panela recibió una edición adicional para eliminar marcas ajenas al personaje; se conserva la fuente corregida como `magolita-panela-clean-source.png`.

`scripts/prepare-held-motion.py` reproduce la limpieza de transparencia y normalización con una única escala por ciclo. `docs/held-motion-validation.json` registra los límites de cada pose. La comprobación de píxeles verifica que no haya fragmentos aislados, recortes en manos, objetos o zapatos, ni poses de piernas duplicadas.

Vista animada de los cinco personajes, desarmados y con cada objeto, hacia ambos lados: `docs/all-players-held-motion.gif`. Vista fija: `docs/all-players-held-motion.png`.

## Revisión en el motor

`?campaignPreview=vuvuzela&character=office` y `?campaignPreview=panela&character=office` permiten elegir cualquiera de los cinco personajes, caminar hacia ambos lados y detenerse usando los botones de prueba. El estado visible identifica la textura y pose que reproduce el controlador real. Las pruebas de juego cubren las diez combinaciones: movimiento lateral y en profundidad, cambio de dirección, reposo, contacto del ataque, daño, retirada del objeto y paletas.
