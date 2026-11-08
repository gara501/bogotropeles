# El perdido de la Peña-Lisa

Tarjeta coleccionable MON / 001. Se obtiene al llegar al final de Monserrate con **cero choques**, tanto con caminantes como con vendedores. Los contactos durante invulnerabilidad también cuentan; reaparecer conserva el contador. Reiniciar el nivel comienza un nuevo intento.

El ascenso perfecto entrega **5000 puntos extra**, además de los puntos normales de meta y de esquivar. La recompensa se suma una sola vez en `MonserrateStage.finish()`. Después de la celebración aparece un modal con la tarjeta; Continuar o Escape lleva al resultado normal y desde allí se avanza a La Candelaria. Ver de nuevo la tarjeta no entrega puntos.

El fondo es una ilustración generada por PixelLab en `src/data/collectibles/pena-lisa-pixellab.png` (512 × 288). La fotografía proporcionada en `ejemplos/peñalosa.avif` se usó únicamente como referencia para redibujar la escena; la tarjeta ya no importa la fotografía original. Se muestra con escalado de píxeles sin suavizado. El marco, el título y el valor son elementos de la interfaz. Los parámetros y el identificador de generación están registrados en `src/data/collectibles/pena-lisa-pixellab.json`.

La colección se guarda localmente en `street-bogota-cards-v1`, independiente de la partida. Se abre desde **MIS TARJETAS** en la selección de personajes. Antes de conseguirla se muestra bloqueada junto a la condición de desbloqueo. El modal usa el diálogo nativo, foco contenido, botón enfocado al abrir y restauración del foco al cerrar.

Las rutas de desarrollo `/?monserrateTest=1&monserrateRewardTest=clean` y `/?monserrateTest=1&monserrateRewardTest=crash` ejercitan el final con cero choques o uno, respectivamente. Usan una colección QA separada, `street-bogota-cards-qa`; el atajo no existe en producción.

Validación: persistencia y lectura de la colección, tolerancia a almacenamiento no disponible/corrupto, choques protegidos por invulnerabilidad, continuidad del contador tras reaparecer, exclusión del bonus tras un choque y premio único al terminar. Se corrigió además el límite superior de la carga de dash al final, que podía interrumpir el render y bloquear el modal de recompensa.
