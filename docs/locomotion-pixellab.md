# Teleperforman, Magolita y Gymbro: locomoción con PixelLab

Teleperforman y Magolita usan nuevos ciclos de caminar de ocho poses con
piernas alternadas. Gymbro usa un ciclo de correr de ocho poses en su estado
de locomoción (`walk`): braceo, rodillas e impulso más marcados.

Cada ciclo parte de una pose original del personaje, recortada por alfa y
centrada sin redimensionar en un lienzo transparente de 256 × 256. La misma
imagen se entrega como inicio y destino para cerrar el bucle de caminar.
La carrera usa PixelLab PixMiniMax con el final libre para permitir poses
aéreas más marcadas. Se conservan
los cuadros generados 1–8; se excluye el cuadro 0, que es la referencia,
para evitar repetir una pose al cerrar el ciclo.

Las tiras RGBA de 2048 × 256 se apilan antes de la hoja de deslizamiento o
carga de hombro. Los índices de combate se conservan; solo cambia la
secuencia de locomoción y el offset de las hojas posteriores.

| Personaje | Archivo | Cuadros del atlas | Poses/s |
| --- | --- | --- | --- |
| Teleperforman | `src/data/players/player_3_walk.png` | 93–100 | 15 |
| Magolita | `src/data/players/player_5_walk.png` | 57–64 | 15 |
| Gymbro | `src/data/players/player_4_run.png` | 50–57 | 20 |

La velocidad de desplazamiento mantiene el balance del juego. La cadencia
de la animación coincide entre Phaser y el reloj fijo del combate.

Las poses mantienen una escala común (Gymbro conserva el factor 0,96 de su
locomoción anterior) y un ancla horizontal de cadera: Teleperforman x=127,
Magolita x=145 y Gymbro x=128 dentro de cada celda. El importador alinea
los apoyos inferiores. En la carrera se eliminó el mate gris generado por
PixMiniMax mediante un relleno conectado al exterior: el pantalón gris
encerrado por el contorno permanece intacto.

Vistas animadas: `docs/teleperforman-walk-preview.gif`,
`docs/magolita-walk-preview.gif` y `docs/gymbro-run-preview.gif`.

Prompts completos, semillas e identificadores de PixelLab:
[locomotion-pixellab.json](locomotion-pixellab.json).

Vistas de prueba: `/?playerPreview=teleperforman`, `/?playerPreview=magolita`
y `/?playerPreview=gymbro`, con `npm run dev`.

Verificación: 507 pruebas aprobadas, compilación de producción correcta y
revisión visual en el juego de los tres personajes hacia ambos lados y
al detenerse. Sin errores de consola en las tres vistas de prueba.

Corrección de escala con vuvuzela: la hoja armada de Gymbro tiene un cuerpo
más grande que el arte base. `ARMED_BODY_SCALE.gymbro` aplica un factor 0,91
a todas sus poses armadas, incluidas reposo, movimiento y golpe. Las otras
escalas se conservan. Se verificó en la vista del juego y con 508 pruebas
aprobadas y compilación correcta. Comparación: `gymbro-vuvuzela-scale.png`.
