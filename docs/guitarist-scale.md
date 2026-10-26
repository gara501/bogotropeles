# Guitarrista: escala al salir del agarre

El atlas de forcejeo tiene poses de unos 500 píxeles, frente a unos 260 del atlas principal. Durante el agarre se aplica una escala menor para que ambos tengan un tamaño equivalente en pantalla.

El fallo se producía al recibir un golpe agarrado: Phaser cambiaba al atlas principal al reproducir `hurt`, pero conservaba la escala menor. `endStruggle()` comprobaba solo el nombre de la textura y ya no reconocía que había que restaurarla. El guitarrista quedaba aproximadamente a la mitad del tamaño correcto.

Corrección:

- Los rodillazos no cambian el atlas mientras el enemigo siga agarrado.
- Al terminar un agarre se restaura la escala principal antes de reproducir daño o derrota.
- El estado explícito `struggleActive` permite restaurar la escala aunque una animación haya cambiado ya la textura.

La reparación se aplica al flujo compartido de agarres para evitar el mismo fallo en otros enemigos. No se regeneraron imágenes ni se alteraron sus proporciones.

Regresión reproducida antes de corregir: textura incorrecta tras el rodillazo y escala `0.2433` en lugar de `0.476` al liberarse. Las dos pruebas ahora pasan, junto con 254 pruebas de combate. Build de producción correcto.
