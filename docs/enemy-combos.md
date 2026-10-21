# Controles, reinicio y combos

H golpea con el puño, J da la patada y K activa el especial de cada personaje.
Espacio salta; Espacio + J conserva la patada aérea. L sigue siendo la patada
baja de Universitaria y Shift conserva dash/pisotón. Los libros duran 1 s.

La derrota muestra un modal HTML sobre el juego con botones grandes, foco de
teclado y navegación con Tab. Reiniciar funciona por clic, R y Enter al morir.
Siguiente solo aparece en el modal de victoria si hay un nivel posterior.
Morir contra Dormilón guarda el encuentro como checkpoint; reiniciar lo recrea
con salud completa, jefe en fase 1 y poderes/timers nuevos. No se repite la
oleada de 30 ni la intro. Los reinicios de niveles normales repiten su oleada.

## Enemy_8

`enemy_8.png` mide 1448 × 1086 y tiene alfa. Sus 24 poses se distribuyen en seis
filas de cuatro: caminar, golpe 1, golpe 2, golpe 3, daño y derrota. Se usan
recortes explícitos porque la escoba de la pose de daño 18 forma un componente
separado; el rectángulo incluye cuerpo y escoba en el mismo frame. Cada golpe
utiliza su propia fila; la segunda empieza en guardia y después hace el barrido.
Los anclajes fijan el torso cuando la escoba se extiende. El asset conserva
residuos rojos y azules alrededor del personaje; queda pendiente su limpieza
artística, sin modificar el PNG original.

Aparece desde el nivel 3 en adelante, respetando los totales configurados y el
límite de 2–3 enemigos vivos. Base: vida 110, velocidad 100, alcance 148 y daño
5 por golpe. Anticipación 430 ms, separación entre impactos 300 ms, recuperación
520 ms y cooldown 2500 ms. Aplica los multiplicadores de cada nivel. Ejecuta
las tres acciones aunque falle la primera; cada una necesita contacto real.

## Enemy_4

Base: velocidad 150 (antes 90), daño 6 por impacto, alcance 85, vida 120.
Persigue continuamente, sin el descanso de movimiento de los enemigos comunes.
Anticipación 300 ms, separación entre impactos 230 ms, recuperación 400 ms y
cooldown 1450 ms. Solo encadena el segundo y tercer golpe si el primero hace
daño; fallar por distancia, carril, salto o invulnerabilidad cancela la cadena.
Reutiliza sus poses de porra en tres secuencias de animación.

## Daño, evasión y limpieza

`src/combat/enemyAttacks.js` comparte la preparación y liberación con los
ataques normales. Mantiene una única secuencia por enemigo, con tres índices
de impacto y una breve retención de la pose de contacto. No añade timers ni
listeners. Los plazos usan el reloj de combate, que se congela en pausa.

El primer contacto respeta la invulnerabilidad normal. Solo la misma cadena
que conectó puede aplicar sus impactos siguientes durante ese segundo de
protección; otros enemigos siguen bloqueados. Cada impacto vuelve a comprobar
distancia, dirección, carril y salto. Contraatacar cancela los golpes pendientes;
el dash rompe el permiso para continuar dañando. Entre golpes hay una ventana
para actuar tras los 150 ms de reacción al daño. La derrota cancela el resto.
La entrada de otros ataques del grupo espera al final de la secuencia.

Pruebas: `tests/campaign.test.js` usa los métodos reales de StreetScene y el
controlador de ataques. Comprueba tres daños separados, primer golpe confirmado,
fallos y evasiones, interrupción, pausa, muerte, tokens vencidos, composición de
oleadas, H/J/K para los cuatro personajes y R/Enter con checkpoint del jefe.

QA visual solo en desarrollo: `/?enemyTest=sweeper` o `/?enemyTest=guard` crea
un rival quieto con botones para lanzar el combo, contraatacar, provocar derrota
y reiniciar la prueba. `/?bossTest=entry&character=office&combatPreview=1` permite
probar derrota y reinicio en Dormilón. Esos paneles se excluyen de producción.
