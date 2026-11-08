# Escape de los jefes ante golpes repetidos

La protección anterior compartida se activaba solamente cerca de las esquinas.
Ahora también se detectan interrupciones repetidas en el centro del escenario.

- Cuatro impactos recibidos a distancia corta dentro de 1800 ms activan el escape.
- Un jefe aturdido bajo presión continua durante 1100 ms escapa aunque el hitstop
  impida avanzar su animación. La detección usa tiempo de combate, no la edad de
  la pose que se reinicia con cada golpe.
- Distancia corta: 170 px en horizontal y 48 px de profundidad. Estar cerca sin
  atacar ni aturdir no provoca por sí solo el escape central.
- Se reutiliza el salto existente de 600 ms hacia el interior del área y un
  carril separado 42 px del jugador. Se cancelan ataques, marcadores, agarres y
  tokens mediante la limpieza propia de cada jefe.
- Protección al aterrizar tras presión central: 450 ms; después vuelve a recibir
  daño. La regla previa de esquinas conserva sus dos golpes, aviso y cooldown.
- Las entradas, escudos, ataques aéreos y cambios de fase no se cancelan. Los
  saltos y fases protegidas limpian el historial de presión para no sumar golpes
  antiguos al aterrizar.

Cobertura común: The Chiken Gomez, Palomera, Pinturita, Coladín, Esmadiego,
Brayatan, Don Pacho Plomo y Jugo Espinas. Don Reversa conserva su escape propio
de tres impactos en la fase a pie; su camión sigue usando las ventanas de daño
existentes. Dormilón no utiliza el aturdimiento de estos controladores.

Verificación: pruebas con pulsaciones reales repetidas de puño contra los ocho
jefes humanoides; escape central con hitstop, cambio de carril, protección
temporal, retorno a la IA y vulnerabilidad posterior. Regresión de escape de
Don Reversa y pruebas existentes de esquinas y fases. Reproducción en navegador
con Brayatan: escapó tras 1217 ms, se desplazó 275 px y cambió 42 px de carril.
