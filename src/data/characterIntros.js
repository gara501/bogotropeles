// Story screens per character (CharacterIntroScene):
// - text: intro shown after picking the character, before level 1 (art: src/data/players/player_N_intro.png).
// - ending: shown after beating the last level (art: src/data/players/player_N_final.png).
// nameSide: 'left' (default) or 'right' — where the name plate goes so it doesn't cover the character's face.
// If an illustration is missing the scene falls back to the profile portrait.
export const characterIntros = {
  office: {
    player: 1,
    name: 'JUANPIS GOMELO',
    description: 'Chapinero. Nunca había bajado del carro. Pelea con el iPhone, que es lo único en lo que confía.',
    text: 'Juanpis pidió el Uber con la misma fe con la que pide el desayuno: que alguien más resuelva. Le cancelaron tres veces, el de InDriver le escribió «ya casi» y se esfumó, y el iPhone quedó en 1 %. Por primera vez tiene que bajar de Chapinero y cruzar Bogotá caminando: huecos, charcos que parecen lagunas y gente que no se impresiona cuando suelta «¿tú no sabes quién soy yo?». El celular es lo único que le queda. Hoy hasta eso lo va a tener que lanzar.',
    ending: {
      nameSide: 'right',
      text: 'Llegó a la Zona Rosa con los tenis color arequipe y el pelo hecho un chicharrón. Nadie le creyó que había cruzado el centro a pata. Pagó la empanada con la tarjeta, le salió error, y por primera vez dijo «qué pena» sin que se lo dictaran. Ahora presume que le encanta caminar. Mentira. Solo si hay andén parejo y una panadería a la vuelta.',
    },
  },
  student: {
    player: 2,
    name: 'JUANA UNIVERSITARIA',
    description: 'Bosa. Parcial a primera hora. Pelea con los apuntes: si los suelta, pierde el semestre.',
    nameSide: 'right',
    text: 'El profesor fue clarito: «Cinco minutos tarde y no entra, y no me vengan con el cuento del tráfico». Juana salió de Bosa con hora y media de ventaja, el tinto en un vaso que quema y los apuntes en una carpeta que ya conoce la lluvia. El SITP no paró. El alimentador sí paró, pero en la estación que no era. Entre la 26, La Candelaria y un parcial que no perdona, va a abrirse paso con lo único que no puede perder: los libros. Fotocopiados, subrayados y más bravos de lo que parecen.',
    ending: {
      nameSide: 'right',
      text: 'Llegó al salón con el corazón en la boca y una media empapada. El profesor ya tenía la mano en la puerta. Juana no rogó: entró, se sentó y abrió el cuaderno como si el resto de Bogotá hubiera sido el calentamiento. Sacó tres punto ocho. Al salir, el SITP otra vez no paró. Esta vez ni le importó. Ya había ganado el examen que no estaba en el programa.',
    },
  },
  teleperforman: {
    player: 3,
    name: 'TELEPERFORMAN',
    description: 'Turno en Salitre, casa en Kennedy. Pelea con la diadema: ocho horas de script, y por fin puede gritar.',
    text: 'Ocho horas de «su llamada es muy importante para nosotros», la diadema pegada a la oreja y el supervisor mirando el reloj del break. Teleperforman solo quiere llegar a Kennedy antes de que el gato decida que la casa es de él. Pero Bogotá le abrió un ticket nuevo: trancón en hora pico, articulado lleno y una ciudad que no acepta ser puesta en espera. Hoy no hay script. Si alguien lo busca, que deje el mensaje después del tono. El tono va a ser un grito.',
    ending: {
      text: 'Cruzó la 26, la estación y el centro sin colgar. Llegó, se quitó la diadema y por fin hubo silencio. Duró cuatro segundos. El gato maulló con urgencia de cliente premium y le clavó las uñas en la pantorrilla: atención inmediata, sin transferencia. Teleperforman suspiró, abrió la lata y dijo, por costumbre: «¿en qué le puedo colaborar?». El gato no calificó la llamada.',
    },
  },
  gymbro: {
    player: 4,
    name: 'PIPE GYMBRO',
    description: 'Galerías. Día de pierna. Pelea con el pisotón: la sentadilla que no debió hacer antes de una loma.',
    text: 'Pipe salió del gimnasio sintiéndose una bestia. Luego recordó dos cosas: que había hecho pierna, y que para llegar a la casa le tocaba la loma. El batido le baila en el estómago, las rodillas están en asamblea y algún desadaptado le dijo «bro, el cardio es de cobardes». Bogotá se lo tomó personal. Hoy el peso no está en la barra. Está en el andén, en la cuesta y en cada piso que va a tener que reventar para que lo dejen pasar.',
    ending: {
      text: 'Subió lo que había que subir y celebró con un batido que sabía a vencido. Se sintió invencible hasta que un perrito callejero trepó la misma escalera sin despeinarse y se sentó arriba, juzgándolo. Pipe lo miró con respeto de competidor. «Parce, ¿cuántas series haces?» El perro no contestó. La croqueta sí la aceptó. Pipe decidió que el siguiente mesociclo incluye humildad. Y menos día de pierna antes de una loma.',
    },
  },
  magolita: {
    player: 5,
    name: 'MAGOLITA',
    description: 'Madrugó a las cuatro. Se quedó dormida en el alimentador. Pelea con el trapero: si el andén está sucio, se limpia.',
    text: 'Magolita dejó la casa reluciente, el trapero escurriendo y el balde oliendo a jabón. Se subió al alimentador «un momentico» y se quedó dormida, como se duerme quien lleva despierta desde las cuatro. Despertó en el otro extremo de Bogotá, con el uniforme arrugado y la ciudad hecha un desorden. No va a llegar tarde a donde la esperan. Y de paso, si el andén está sucio, se limpia. En esta ciudad hay gente que ensucia por deporte. Magolita cobra con el trapero.',
    ending: {
      nameSide: 'right',
      text: 'Dejó el barrio tan limpio que hasta el de la tienda salió a decirle «Dios le pague». Le alcanzaron un tinto, una arepa y cinco minutos de silla. Al cuarto minuto una paloma apuntó al andén con mala intención. Magolita ni se paró del todo: alzó el trapero, la miró por encima del vapor del tinto y dijo «mijita, ni lo intente». La paloma entendió. La paz, en Bogotá, también se trapea.',
    },
  },
};
