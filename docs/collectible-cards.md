# Tarjetas coleccionables

Acceso desde **MIS TARJETAS** en la selección de personajes. La matriz muestra siete tarjetas y su contador de progreso. Las bloqueadas muestran su condición sin cargar su ilustración; las conseguidas se pueden abrir en detalle. La recompensa del nivel abre la nueva tarjeta antes de continuar al resultado.

| Tarjeta | Condición |
| --- | --- |
| El perdido de la Peña-Lisa | Monserrate sin contactos; conserva sus 5000 puntos |
| Las damas de la montaña | Nivel 1 / Transmilleno exterior sin perder vidas |
| Boda en transmilleno | Ciclovía sin perder vidas |
| El 2x1 | Plaza de Palomojao sin perder vidas |
| Toreto | Plaza de Bolívar sin perder vidas |
| Tapabocas | Transmilleno · Estación (interior) sin perder vidas |
| Semáforo | Calles del centro (Samber) sin perder vidas |

Los niveles se identifican por `combatIndex` o `mode`, independientemente del orden de la campaña. Las seis nuevas tarjetas permiten daño y no añaden un bono de puntos. Se cuentan las muertes reales; monedas y continues no pueden compensarlas. Reiniciar un checkpoint del jefe conserva el historial; una nueva partida completa del nivel inicia otro intento. Entrar directamente al jefe sin un intento completo no da tarjeta.

Guardado local permanente bajo `street-bogota-cards-v1`, compatible con la colección anterior de Monserrate. Las herramientas de desarrollo que ya usan el guardado QA mantienen su clave separada.

## Arte

Seis ilustraciones generadas con PixelLab MCP `image_to_pixelart`, usando las fotos facilitadas por el usuario con autorización explícita para enviarlas. Misma receta que Peña-Lisa: 512×288, faithful=false, init_image_strength=0, text_guidance_scale=9, seed=69315. Se prepararon recortes de las fotos como entradas de generación; no se modificaron los originales. Los marcos, títulos y sellos se renderizan en HTML/CSS, manteniendo el estilo dorado del original. Cada PNG tiene un JSON de procedencia con el job y asset de PixelLab.

Prueba visual aislada: `/tmp/cards-preview.html` en Vite; usa exclusivamente `street-bogota-cards-matrix-qa`, nunca el progreso real del jugador.
