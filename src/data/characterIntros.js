// Story screens per character (CharacterIntroScene):
// - text: intro shown after picking the character, before level 1 (art: src/data/players/player_N_intro.png).
// - ending: shown after beating the last level (art: src/data/players/player_N_final.png).
// nameSide: 'left' (default) or 'right' — where the name plate goes so it doesn't cover the character's face.
// If an illustration is missing the scene falls back to the profile portrait.
export const characterIntros = {
  office: {
    player: 1,
    name: 'JUANPIS GOMELO',
    text: 'Pidió un uber, le cancelaron tres veces y el celular quedó en 1 %. Por primera vez, Juanpis Gomelo tendrá que cruzar Bogotá usando una función que desconocía: caminar. Entre huecos, trancones y charcos sospechosos, descubrirá que sobrevivir a la ciudad exige algo más que decir «¿tú no sabes quién soy yo?».',
    ending: {
      nameSide: 'right',
      text: 'Cruzó Bogotá, embarró los tenis y llegó antes que el Uber. Celebró con una empanada y un tinto que costaban menos que el envío de su desayuno. Ahora dice que le encanta caminar. Eso sí: solo por rutas con empanadas.',
    },
  },
  student: {
    player: 2,
    name: 'JUANA UNIVERSITARIA',
    nameSide: 'right',
    text: 'El profesor dijo: «Cinco minutos tarde y no entra». Ella salió con una hora de sobra. Bogotá se lo tomó como un desafío. Con los apuntes bajo el brazo y un tinto como desayuno, Juana Universitaria deberá cruzar la ciudad antes del parcial. Estudió toda la noche, pero este examen de supervivencia no estaba en el programa.',
    ending: {
      nameSide: 'right',
      text: 'Esquivó charcos, conquistó andenes y llegó lista para el parcial. Corriendo mientras el profesor miraba desde lejos con una sonrisa malévola, mientras cerraba la puerta del salón… ¡NO ESTA VEZ!',
    },
  },
  teleperforman: {
    player: 3,
    name: 'TELEPERFORMAN',
    text: 'Después de escuchar «su llamada es muy importante» durante ocho horas, Teleperforman solo quiere llegar a casa. Pero Bogotá tiene otra solicitud pendiente: hacerlo atravesar el caos en hora pico. Con café en las venas y paciencia en saldo rojo, enfrentará una misión que ningún supervisor sabe resolver. Y esta vez no podrá ponerla en espera.',
    ending: {
      text: 'Sobrevivió al turno, al trancón y al viaje de regreso. Por fin llegó al sofá… donde su gato lo esperaba con una queja por falta de comida. Intentó ponerlo en espera. El cliente respondió clavándole las uñas y solicitando atención inmediata.',
    },
  },
  gymbro: {
    player: 4,
    name: 'PIPE GYMBRO',
    text: 'Pipe Gymbro salió del gimnasio convencido de que nada podía detenerlo. Entonces recordó que había entrenado pierna… y le tocaba subir una loma. Con el batido en el estómago y las rodillas negociando su renuncia, deberá conquistar Bogotá paso a paso. Hoy descubrirá por qué ningún entrenador recomienda decir: «El cardio lo hago después».',
    ending: {
      text: 'Conquistó la loma y recuperó el aliento con un batido de proteína. Se sentía invencible hasta que un perrito subió las mismas escaleras sin despeinarse. Decidió contratarlo como entrenador. Primero tendría que convencerlo de aceptar el pago en croquetas.',
    },
  },
  magolita: {
    player: 5,
    name: 'MAGOLITA',
    text: 'Magolita dejó la casa reluciente… se quedó dormida en el alimentador y resultó en el otro extremo de la ciudad, ahora para volver a su hogar le esperan calles imposibles y obstáculos por montones. Entre chirretes y peligros, ella va a limpiar la ciudad.',
    ending: {
      nameSide: 'right',
      text: 'Dejó el barrio tan limpio que los vecinos salieron a aplaudirle. Le regalaron flores, un tinto y cinco minutos de descanso. Entonces una paloma se acercó con intenciones sospechosas. Magolita apretó la escoba: la paz había durado cuatro minutos.',
    },
  },
};
