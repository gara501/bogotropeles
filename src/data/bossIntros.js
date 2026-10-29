import reversaUrl from '../scenes/boss-intros/reversa.png?url';
import barraUrl from '../scenes/boss-intros/barra.png?url';
import palomeraUrl from '../scenes/boss-intros/palomera.png?url';
import grafiteroUrl from '../scenes/boss-intros/grafitero.png?url';
import cabecillaUrl from '../scenes/boss-intros/cabecilla.png?url';
import antidisturbiosUrl from '../scenes/boss-intros/antidisturbios.png?url';
import brayatanUrl from '../scenes/boss-intros/brayatan.png?url';
import pachoUrl from '../scenes/boss-intros/pacho.png?url';
import jugoUrl from '../scenes/boss-intros/jugo.png?url';

// Keyed by boss, so the inserted Ciclovía level never shifts these intros.
export const BOSS_INTROS={
  jugo:{key:'intro-boss-jugo',url:jugoUrl,location:'EL dorado',name:'JUGO ESPINAS',text:'Jugo Espinas cobra la salida de la terminal. Dos cabezazos, un barrigazo y un taxímetro que no perdona la tarifa.'},
  reversa:{key:'intro-boss-reversa',url:reversaUrl,location:'Plaza de Palomojao',name:'DON REVERSA',text:'Pacho pagó el flete. La salida es su parqueadero.'},
  barra:{key:'intro-boss-barra',url:barraUrl,location:"Transmilleno",name:"CHIKEN GOMEZ",text:"Chiken Gomez y la barra cobran la puerta. Sin articulado no hay ciudad."},
  palomera:{key:'intro-boss-palomera',url:palomeraUrl,location:"Plaza de Bolívar",name:"PALOMERA",text:"Palomera no espanta las palomas. Las manda. La plaza queda inservible."},
  grafitero:{key:'intro-boss-grafitero',url:grafiteroUrl,location:"La Candelaria",name:"PINTURITA",text:"Pinturita firma el barrio. El que no está pintado en la pared no cruza."},
  cabecilla:{key:'intro-boss-cabecilla',url:cabecillaUrl,location:"La estación",name:"COLADÍN",text:"Coladín es la fila y la ventanilla. Aquí se oye el nombre de Pacho por primera vez."},
  antidisturbios:{key:'intro-boss-antidisturbios',url:antidisturbiosUrl,location:"Chorro de Quevedo",name:"ESMADIEGO",text:"Esmadiego no pregunta. El orden, hoy, huele a gas y trabaja para la fiesta."},
  brayatan:{key:'intro-boss-brayatan',url:brayatanUrl,location:"El centro",name:"BRAYATAN",text:"Brayatan baila la Séptima. Cuchillo, pisotón, y el andén deja de ser de nadie."},
  pacho:{key:'intro-boss-pacho',url:pachoUrl,location:"Zona Rosa",name:"PACHO",text:"Pacho baja de la camioneta riéndose. No pelea por Bogotá. Bogotá ya la pagó. Tú eres el que no estaba en la lista."},
};
export const bossIntroFor=level=>BOSS_INTROS[level?.boss]??null;
