# Motorata · Niveles 5, 6 y 7

Motorata aparece en los niveles 5, 6 y 7. En el nivel 7, las oleadas alternan `guard` (enemy_4), `belly` (enemy_10), `motorata`,
`leash` (enemy_11), `vendor` (enemy_9) y El Costal (`homeless`). Son 30 enemigos, seguidos por Don Pacho.

Motorata entra desde cualquiera de los dos bordes con un conductor de camiseta roja y
un pasajero de camiseta blanca, ambos con casco. `MotorcycleArrivals` anima 650 ms de
entrada y 560 ms de bajada. Mientras baja, el pasajero no recibe golpes ni puede ser
agarrado; al tocar el piso recupera su barra y la IA normal lo hace correr tras el jugador
y atacar con cuchillo. El conductor mantiene su carril y dirección hasta salir de la
pantalla. Es un elemento visual: no hace daño, no suma puntos y no cuenta como enemigo.

Las entradas usan el reloj fijo de combate: se congelan con la pausa y durante la pérdida
de una vida. Se limpian al finalizar la partida o cerrar el escenario. El pasajero a pie
se puede golpear, interrumpir, agarrar, lanzar y derrotar como los demás enemigos.

## Archivos y animaciones

- `src/data/enemies/motorata.png`: RGBA transparente, 1280×1536, 4×6 celdas de 320×256.
  Filas: reposo, carrera, cuchillada (contacto en frame 10), daño, caída y forcejeo.
- `src/data/enemies/motorata_entry.png`: RGBA transparente, 1280×960, 4×3 celdas de 320×320.
  Filas: moto con dos ocupantes, conductor solo, pasajero bajándose.
- `src/data/motorata.js`: recortes, anclas, estadísticas y secuencias.
- `src/actors/MotorcycleArrivals.js`: entrada, bajada y salida del conductor.

## Generación de sprites

Se utilizó la herramienta integrada ImageGen, con `ejemplos/motorata.jpg` como referencia
de ropa y cascos y `enemy_4.png` como referencia del estilo arcade. Se conservaron los
originales generados; las versiones del proyecto se empaquetaron en celdas uniformes,
aislando cada figura por su alfa y manteniendo una escala común dentro de cada lámina.

Prompts utilizados (resumen de las instrucciones de arte):

1. Crear 24 poses en una cuadrícula de cuatro columnas y seis filas del pasajero con
   camiseta blanca, casco negro, jeans y tenis negros, siempre consistente y mirando
   hacia la derecha. Cuatro poses por fila de reposo, carrera, cuchillada, reacción al
   daño, caída y forcejeo. Estilo pixel art arcade de los años noventa, figuras completas,
   cuchillo corto, sin armas de fuego, sin moto ni otros personajes, fondo transparente.
2. Eliminar únicamente el fondo gris de la lámina de combate, conservando las 24 poses,
   sus colores, contornos, posición, ropa y cuchillo; PNG RGBA realmente transparente.
3. Crear 12 poses en cuatro columnas y tres filas con el mismo pasajero. Primera fila:
   cuatro frames de la moto negra con conductor rojo y pasajero blanco; segunda fila:
   la misma moto con el conductor solo; tercera fila: el pasajero solo, sentado, pasando
   una pierna, aterrizando y quedando listo para combatir. Misma orientación y estilo,
   ruedas, pies y cuchillo completos, fondo transparente, sin escenario, texto ni pistolas.
