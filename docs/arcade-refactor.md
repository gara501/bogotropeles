# Refactor arcade

## Diagnóstico, por impacto en la sensación

1. Daño y animaciones avanzaban con relojes diferentes: `hitAt` / `elapsed` frente al reproductor de Phaser. Un contacto podía suceder antes o después de la pose de impacto.
2. Faltaban hitstop local, flash blanco e impacto breve. Los golpes iniciales y los remates tenían poco contraste visual.
3. Mantener H repetía ataques. La cola de Gymbro admitía pulsaciones durante todo el golpe, sin buffer con caducidad ni ventana de cancelación.
4. La IA compartía `nextGroupAttack`; espaciaba ataques, pero no representaba dos permisos simultáneos ni una espera alrededor del jugador.
5. El estado del jugador se deducía de `playerAttack`, `hurtUntil`, `dashUntil` y otros campos. Las interrupciones exigían limpiar varias variables.
6. Se recortaba `delta` a 50 ms y las animaciones de Phaser seguían el render. Cambiar los FPS alteraba el avance de la simulación.
7. El movimiento normal ya arrancaba y frenaba directamente. La lluvia era la excepción: añadía aceleración y frenado progresivo. Los límites de carril ya existían y se conservaron.
8. Faltaban `roundPixels` y un paso de simulación fijo. La profundidad por Y y la sombra separada ya existían y se mantuvieron. Se restauró la resolución original 960×540 tras revisar el resultado visual de 384×224.

## Código, archivo por archivo

| Archivo | Responsabilidad |
| --- | --- |
| `src/data/arcade.js` | Configuración común: resolución, reloj, velocidades, carriles, buffer, cajas, salto, dash, tokens, hitstop e invulnerabilidad. Adaptación de cámara y texto. |
| `src/data/attacks.js` | `PLAYER_ATTACK_FRAMES`, `PLAYER_CONTACT_POSES`, construcción de timelines y ataques de enemigos. Cada frame contiene `pose`, `phase` y `cancel`. |
| `src/actors/Player.js` | FSM de jugador, movimiento inmediato, Z de salto, buffer, cancelación de Gymbro, ataque aéreo y especiales. |
| `src/actors/Enemy.js` | FSM approach/circle/windup/attack/recover/hurt; adquisición y liberación de token; cargas, proyectiles y combos según datos. |
| `src/combat/CombatSystem.js` | Hitbox/hurtbox independientes, umbral de carril, deduplicación por ataque desde Player, pausa por actor, flash, impulso, impacto y tokens. |
| `src/input/InputBuffer.js` | Entradas con caducidad de ocho frames y consumo único. |
| `src/game/FixedClock.js` | Acumulador a 60 Hz con hasta seis pasos de recuperación por render. |
| `src/game/ArcadeRuntime.js` | Orquestación de actores, reloj, proyectiles, jefe, vidas, celebración e instrumentación de cajas. |
| `src/scenes/StreetScene.js` | Integra el runtime con recursos, HUD, campaña, audio, cambio de personaje y continuación. Los métodos anteriores se conservan como fachada de compatibilidad; la partida creada ejecuta el gameplay por ArcadeRuntime. |
| `src/data/characters.js` | Sprites y balance de cada jugador; las velocidades comunes se toman de ARCADE. Solo Gymbro tiene combo. |
| `src/data/enemies.js` | Vida, velocidad, alcance, cooldown y ataques de cada tipo; añade configuración de fases y poses activas de carga. |
| `src/main.js` | Phaser 960×540, pixelArt, roundPixels, FIT, autoCenter y objetivo de render de 60 FPS. Limpia entradas al perder foco. |
| `src/scenes/IntroScene.js` | Conserva las intros en el mundo existente con la cámara y texto adaptados. |
| `src/boss/BossController.js` | Ataques del jefe con activación por frame mostrado, cajas comunes e hitstop local. Sus sistemas ambientales siguen independientes. |
| `src/boss/Weather.js` | Movimiento instantáneo también bajo lluvia. |
| `src/boss/balance.js` | Poses de contacto y balance de los sistemas del jefe. |
| `src/combat/specialEnergy.js` | Consume el costo de vida configurado al activar el especial. |
| `src/input/TouchInput.js` | Conserva multitouch y toma la zona muerta de la configuración común. |
| `src/debug/playerPreview.js`, `src/debug/combatPreview.js` | Herramientas de desarrollo: estado, fase, frame, combo, contador de tokens, cajas y control de IA. No se incluyen en producción. |
| `tests/campaign.test.js`, `tests/boss.test.js` | Pruebas de pasos fijos, buffer, fases, colisiones, combos, IA, hitstop, salto, costo de vida y flujo de campaña. |

El arte y las posiciones de escenario permanecen en el mundo original 960×540. Se renderizan con zoom 1 sobre un canvas real 960×540 para conservar el detalle de sprites y HUD. Las distancias de tuning se expresan en unidades de mundo: 24 unidades son 24 píxeles del canvas. La simulación arcade a 60 pasos/s se conserva independientemente de esta resolución.

El render tiene objetivo de 60 FPS; la simulación ejecuta pasos de 1/60 s aunque se renderice a 30 o 120 FPS. Un atasco mayor de 100 ms limita la recuperación a seis pasos para evitar una espiral de actualizaciones. Las transiciones de combate y los contactos no usan el delta variable del render.

### Ejemplo de datos

```js
PLAYER_ATTACK_FRAMES.punch = { startup: 6, active: 3, recovery: 11 };
PLAYER_CONTACT_POSES.gymbro = {
  punch: 8, punch2: 6, punch3: 10, kick: 22, stomp: 20,
};
```

Las fases aceptan una pose o una secuencia de poses intermedias, que se distribuye sobre sus frames. Player muestra `timeline[index].pose` y solo habilita contacto cuando ese mismo frame tiene `phase === 'active'`. Cada ataque conserva un Set de víctimas, por lo que sus tres frames activos no infligen tres daños. Gymbro crea un ataque nuevo para cada etapa enlazada.

Los números compartidos están en `arcade.js`; las fases y poses por ataque en `attacks.js`; el balance particular y los recursos permanecen en `characters.js`, `enemies.js` y `boss/balance.js`.

## Tuning inicial

| Parámetro | Valor | Efecto al cambiarlo |
| --- | --- | --- |
| Simulación | 60 Hz | Duración de todos los frames de combate. |
| Velocidades X: Gomelo / Universitaria / Teleperforman / Gymbro | 205 / 290 / 220 / 180 u/s | Rapidez de desplazamiento. |
| Multiplicador Y | 0,60 | Menor valor exige comprometerse más con el carril. |
| Buffer | 8 f ≈ 133 ms | Mayor valor perdona entradas más anticipadas. |
| Cancelación Gymbro | Últimos 6 f de recovery | Mayor ventana facilita enlazar. |
| Puños 1 y 2: startup / active / recovery | 6 / 3 / 11 f | Startup da anticipación; active tolerancia; recovery compromiso. |
| Puño 3 | 8 / 3 / 15 f | Remate más deliberado. |
| Patada terrestre | 10 / 4 / 14 f | Más lenta y con mayor ventana de contacto. |
| Patada aérea | 5 / 5 / 12 f | Respuesta rápida durante el salto. |
| Diferencia máxima de carril | < 24 u | Menor valor exige más precisión de profundidad. También se requiere solapamiento de cajas. |
| Hurtbox: semiancho / semiprofundidad | 18 / 8 u | Tamaño físico independiente del sprite. |
| Hitstop normal / remate | 3 / 5 f | Mayor valor hace el impacto más contundente. |
| Knockback normal / remate | 8 / 24 u | Distancia de separación. Los dos primeros puños de Gymbro usan 0 para conservar alcance. |
| Flash / efecto de impacto | 3 / 3 f | Persistencia visual del contacto. |
| Sacudida | 45 ms / 0,0015 | Intensidad visual sin mover cuerpos ni cajas. |
| Tokens de ataque | 2 | Presión simultánea. Windup reserva el token; recover, hurt y muerte lo liberan. |
| Windup normal | 29 f ≈ 483 ms | Legibilidad del aviso. Los tipos con combo/carga tienen sus propios datos. |
| Cooldown normal / lanzador | 126 / 168 f | Frecuencia de presión por enemigo. |
| Reacción tras recibir daño | 30 f de cooldown | Menor valor hace más rápido el contraataque tras el stun. |
| Entrada de oleada | 60 f + 18 f por puesto local | Se divide por presión de nivel; no aumenta con el índice acumulado del enemigo. |
| Salto | 39 f, altura Z 72 u | Tiempo aéreo y altura visual; la sombra permanece en suelo. |
| Dash | 11 f, cooldown 51 f | Escape y tiempo entre usos. |
| Invulnerabilidad al levantarse | 30 f | Margen para reposicionarse tras knockdown. |
| Invulnerabilidad al reaparecer | 180 f | Conserva los tres segundos del sistema de vidas. |
| Especial | 10 de vida | Se cobra una vez al activarse; requiere más de 10 para no causar suicidio. |

Carriles Y por nivel: 400–500, 410–500, 415–500, 355–500, 375–500 y 410–500. Se editan en `ARCADE.lanes`.

## Checklist jugable

Ejecuta `npm run dev`; abre `/?playerPreview=gymbro`. El panel muestra estado, fase, frame, tokens y la resolución real. Usa **Enemigos cerca**, **Hitboxes** y **Activar / pausar IA**. Las cajas verdes son hurtboxes; amarillo indica ataque no activo y rojo frame activo.

- [ ] Pulsa y suelta WASD/flechas: arranque y frenado inmediatos; Y más lento; diagonales sin aceleración adicional.
- [ ] Recorre los extremos superior e inferior de los seis escenarios: no se sale del carril.
- [ ] Con IA detenida, golpea a un enemigo a la misma Y y después desplázate a otro carril: el segundo golpe falla aunque los sprites se solapen visualmente.
- [ ] Observa el cambio amarillo/rojo: solo la pose activa causa daño; una víctima recibe un impacto por etapa.
- [ ] Un toque de H produce un jab. Mantenerlo no completa el combo. Enlaza H cerca del final de la recuperación para cruzado y uppercut.
- [ ] Pulsa demasiado pronto: la entrada caduca tras ocho frames. Pulsa en los últimos frames: se conserva y enlaza.
- [ ] Comprueba el mismo comportamiento con el botón de puño móvil.
- [ ] Salta y pulsa J: la patada aérea usa su timeline; sombra en suelo y orden de dibujo por Y, incluso en el aire.
- [ ] Usa K con cada jugador: resta 10 al activar; interrumpir la preparación no cobra; con 10 de vida se bloquea.
- [ ] En un impacto se congelan atacante/víctima, pero otro enemigo o una moto sigue moviéndose. El tercer golpe tiene más pausa y empuje.
- [ ] Activa IA con tres enemigos: contador máximo 2/2; el restante rodea o espera. Golpear/matar a uno libera su token.
- [ ] Prueba cuchillos, tres golpes, carrito, barriga y cruceta; las motos conservan su paso independiente.
- [ ] Verifica aviso visible antes de cada ataque y ausencia de daño durante windup.
- [ ] Prueba al jefe: puño por pose activa, guardia, lluvia sin inercia y sistemas ambientales persistentes.
- [ ] Fuerza knockdown: caída, recuperación e invulnerabilidad breve al levantarse.
- [ ] Pierde una vida, continúa y cambia de personaje: conserva nivel, campo de batalla y puntos; no se ejecutan entradas antiguas.
- [ ] Pausa, pierde foco y vuelve: se vacía el buffer; no sale un ataque guardado por accidente.
- [ ] Compara 30/60/120 FPS: misma distancia y secuencia para el mismo número de pasos.
- [ ] Completa nivel y campaña: victoria, récord y modal siguen funcionando; revisar móvil horizontal/vertical e intros.

Validación automática: `npm test`, `npm run build`, `npm run package:itch`.

Validación de esta entrega: 136 pruebas aprobadas, compilación de producción y paquete itch.io generados.
