# ESMADIEGO: segunda fase

Al bajar de 50% de su vida máxima, ESMADIEGO suelta el escudo durante 850 ms. Es una transición única: pierde el bloqueo frontal y aumenta su velocidad un 75% durante el resto del combate.

La segunda fase usa `src/data/bosses/enemy_boss_5_unshielded.png`, una hoja adicional con 24 poses. El sprite original y sus efectos de gas se conservan. Incluye soltar el escudo, correr, disparar, golpear, recibir daño y caer sin escudo.

Lanza cuatro bombas de gas mientras se desplaza y cambia de dirección en los límites del escenario. La primera tiene 450 ms de preparación; las siguientes, 180 ms. Cada disparo se activa en su pose de animación. La ráfaga ocupa un token de ataque y puede interrumpirse golpeando al jefe. Las bombas ya lanzadas mantienen su trayectoria y sus nubes.

Los valores de fase y el atlas están en `src/data/riotPhase.js`. La lógica está en `src/actors/ShieldBreakPhase.js`. Para revisar la transición en desarrollo: `?enemyTest=antidisturbios&character=gymbro`, botón **Romper escudo**.
