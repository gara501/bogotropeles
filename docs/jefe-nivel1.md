# Jefe del nivel 1: EL BARRA

- Sprite: `src/data/boss_level1.png` (28 poses, 4×7). Ancla de cada pose en el centro de la cadera
  (`frameAnchors`) para que estocadas y preparaciones no desplacen el cuerpo.
- Datos: `enemies.barra` en `src/data/enemies.js` (`boss:true`, velocidad 250: más rápido que
  cualquier enemigo normal; corre con los cuadros 0–3).
- Combo de cuchillo de 3 golpes (`combo.hitFrames:[2,1,2]`): tajo (pose 6), revés (9) y estocada (14,
  más alcance). Suena `wave` en cada tajo.
- Balón (`throw`): lo lanza a 260–640 px de distancia, alineado en profundidad, cada 2,6 s. Mientras
  el balón está listo ronda lejos; mientras recarga entra corriendo al combo. Proyectil `balon`
  (`src/data/balon.png`, recortado de `ejemplos/balon.jpg`), gira y se esquiva saltando o con patada baja.
- Registro de jefes: `src/data/bosses.js`. `kind:'enemy'` usa la IA de enemigos + `MiniBoss`
  (barra grande, aviso de entrada, 1500 puntos, 1,3 s de animación de derrota antes de la victoria).
  Dormilón sigue siendo `kind:'controller'`.
- Música: al aparecer cambia a `public/assets/boss.mp3`. Morir en el jefe reintenta directo el jefe.

# Jefa del nivel 2: LA PALOMERA

- Sprite: `src/data/enemy_boss_3.png` (28 poses). Las palomas sueltas son manchas separadas, así que
  cada pose tiene recorte explícito (`frameRects`) que incluye su paloma, y el resto se aísla
  (`keepDetachedFrames` para las poses con palomas sueltas: 6, 10, 14, 18, 21, 24–26).
- Combo de 3 golpes con palomas: poses 6, 10 y 18 (el tercero, el empujón con paloma grande, alcanza más).
- Lanzamiento de paloma (`throw`, textura `paloma` = `src/data/paloma.png`), volteada según su vuelo, sin girar.
- Curación (`heal`): con menos del 60% de vida y el jugador a 280 px o más, alza la paloma blanca
  (poses 12–13), suena `spell` y se queda en la pose 14 recuperando 5% de su vida por segundo hasta
  5 s (máx. ~25%), con destello verde. Cualquier golpe la interrumpe; no repite antes de 4 s
  (interrumpida) o 10 s (completa).
- También salta hacia atrás tras 3 golpes seguidos (como El Barra), lo que le da distancia para curarse.
- Vida base 1300 (975 en el nivel 2), 2000 puntos, muerte con `female_grunt`, música `boss.mp3`.
- Registro: `palomera` en `src/data/bosses.js`; nivel 2 → `boss:'palomera'`.

Proyectiles de enemigos: `throw.texture` + `projectileTextures` en `src/data/enemies.js`
(`balon`, `paloma`); `StreetScene.throwProjectile` los lanza para cualquier jefe.

# Jefe del nivel 3: EL GRAFITERO

- Sprite: `src/data/enemy_boss_2.png` (24 poses, 4×6; la detección automática encuentra las 24).
- Lanzamiento de spray: lata con estela cian (`src/data/spray_can.png`, recortada de la pose 6), proyectil `spraycan`.
- Pintada del piso (rociado rosado, poses 12–15): la nube hace daño de cerca (14 cuadros en la pose 14,
  sigue en la 15) y deja 3 manchas rosadas adelante. Pisarlas hace 6 de daño (una vez cada 0,7 s por mancha);
  saltando no. Se desvanecen y desaparecen en 3 s.
- Salto (3.ª fila, poses 8–11): se echa hacia atrás 220 px, invulnerable en el aire, dejando manchas cian al
  despegar y al caer. Lo usa tras 3 golpes seguidos y justo después de pintar si el jugador sigue a <150 px.
- Sistema de manchas reutilizable: `src/game/GroundStains.js` (`scene.paintStain` / `scene.paintFloor`).
- Vida base 1500 (1275 en el nivel 3), 2500 puntos, música `boss.mp3`.

# Jefe del nivel 4: EL CABECILLA

- Sprite: `src/data/enemy_boss_4.png` (16 poses, 4×4): quieto/caminata · convocatoria (grita, alza el brazo,
  señala: 4–7) · daño · caída. Se mantiene a ~380 px (`keepDistance`), por el lado en que está; si no
  cabe, cambia de lado. De cerca solo empuja con la mano abierta (pose 3, daño bajo).
- Convocatoria (`summon`): cada 6,5 s (la primera a 1,2 s) llama oleadas alternadas de 2 y 3 estudiantes
  que entran por ambos bordes; nunca más de 4 vivos. Aparecen cuando señala (pose 6).
- Tras 3 golpes seguidos salta hacia atrás (invulnerable) y convoca de inmediato (`evade.summonAfter`).
- Estudiantes (`estudiante`, `src/data/enemy_boss_4_2.png`, 6×4): 4 variantes = 4 filas de una sola
  textura (`frameOffset` = fila × 6). Velocidad 340 (más que cualquier personaje), 90 de vida, puñetazo a la
  carrera (pose 4, suena `punch2`). Dan 50 puntos, no cuentan en las oleadas del nivel y huyen al caer el jefe.
- Vida base 1600, 3000 puntos, música `boss.mp3`.
