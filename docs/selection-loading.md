# Sincronización de la selección de personajes

Antes se actualizaban el nombre y la selección mientras el canvas conservaba al personaje anterior hasta terminar la descarga y preparación del atlas. Un retrato con `img.src` nuevo también podía conservar temporalmente su bitmap anterior.

`SelectScreen.draw()` limpia y oculta el canvas antes de esperar los recursos. En su lugar muestra un escudo de Bogotá en pixel art, basado en `ejemplos/escudo.webp`, y «CARGANDO [PERSONAJE]…», con estado accesible de carga. El sprite solo se revela después de pintar la selección vigente. Los tokens de dibujo impiden que una carga antigua sustituya a la más reciente, incluso al cambiar A → B → A. El retrato se oculta al cambiar su fuente y se revela al terminar de cargar la imagen actual.

Se deja un fotograma de renderizado antes de preparar el atlas para que el escudo aparezca aunque el procesamiento bloquee temporalmente el hilo principal. Las hojas ya preparadas se reutilizan. Una carga fallida mantiene el escudo, muestra un aviso y elimina el resultado fallido de la caché para permitir reintentar al seleccionar de nuevo.

Validación: 803 pruebas aprobadas y compilación de producción correcta. Las regresiones cubren limpieza inmediata del sprite anterior, cargas fuera de orden, cambios A → B → A, errores y reintentos. Revisión en navegador: cambio Gomelord → Gymbro y Gymbro → Magolita, con silueta y texto de carga visibles durante la preparación.

Imagen de espera compartida: `src/data/UI/selection_loading_shield.png`, 256×320, fondo transparente y 128 colores (14 KB). Se solicita al crear la selección, conserva el estado accesible de carga y se oculta después de pintar el sprite actual. Prompt y fuente de imagegen integrado: `docs/selection-shield-generation.json`.
