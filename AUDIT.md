# Auditoría y validación

Base revisada: `12dd06a1ea78751158b4ae156c8945db728d08be`.

## Diagnóstico y cambios

- Vídeo: el avance dependía únicamente de `ended`. Un error o una petición bloqueada podía impedir llegar al final. Ahora se habilita al terminar, al fallar o tras 15 segundos en la escena, sin reproducción automática. La capa de reproducción es un botón accesible y permite reintentar. El vídeo se pausa al salir.
- Música: cada página ejecutaba `play()` y anulaba la decisión de apagarla. Ahora se conserva esa decisión y solo se reanuda al volver a primer plano si corresponde. Se elimina la pausa por `blur`, que podía detener el audio al abrir controles del sistema.
- Navegación: las transiciones y esperas de escenas anteriores podían crear escenas duplicadas o actuar sobre elementos nuevos. Cada escena tiene una versión, las esperas obsoletas se cancelan y la escena saliente queda inerte.
- iPhone: se elimina el mínimo de altura `-webkit-fill-available` que sobrescribía `100dvh`, se reserva el área segura en la navegación inferior y se permite desplazar las escenas cortas. Las propiedades de los degradados ahora se heredan al pseudo-elemento que los dibuja.
- Caché: la instalación exige un shell completo, separa iconos opcionales, usa versiones iguales a las de HTML, limpia solo cachés `regalo-*` y devuelve HTML de respaldo solo para navegación. No almacena fotos personales, audio, vídeo ni peticiones Range. El nuevo worker espera a que se cierren los clientes anteriores para evitar activación forzada a mitad del recorrido.
- PWA: las tres rutas de iconos y los archivos de destino existen en el árbol de GitHub. No se han descargado ni inspeccionado los binarios y no se afirman dimensiones ni zona segura maskable verificadas. Se conserva el manifiesto. La web sigue mostrando solo instalación, la intro de aproximadamente diez segundos se reserva a standalone o dev local. Se subraya la frase completa Contigo 4ever.
- Carta: `config.js` permanece idéntico, con un único párrafo, comas y punto final. Se mantiene la justificación y el contenido.

## Validación

- `node --check`: script.js, config.js y sw.js sin errores.
- Edge headless, viewport móvil 390 × 844: tutorial sin contraseña ni intro en web, intro de unos diez segundos en dev local, subrayado completo, un párrafo justificado, preferencia de música conservada, navegación rápida con una sola escena, salida del vídeo tras espera/error y vuelta al archivo sin errores no capturados.
- Service worker en entorno simulado Node: limpieza limitada a sus cachés, exclusión de foto/vídeo/Range, recurso ausente sin HTML de respaldo y recuperación offline de CSS con su versión exacta.
- El navegador recibe exclusivamente archivos de código locales. Todas las demás solicitudes se bloquean y Audio se sustituye por un doble de prueba. Ningún archivo audiovisual personal se ha abierto, descargado, decodificado ni modificado.
- No se ha publicado en main.

## Pendiente en iPhone real

Comprobar Safari y app instalada, pantalla con indicador inferior, teclado abierto/cerrado, orientación y vuelta desde segundo plano. Verificar visualmente que desaparece la franja inferior, que los controles no se solapan y que la música responde a los controles del sistema. Revisar instalación/icono y actualización tras cerrar todas las ventanas de la app, así como arranque offline después de una carga online correcta.

La reproducción real y el contenido audiovisual quedan fuera de esta revisión. La simulación móvil de Chromium no certifica el comportamiento de WebKit ni la zona segura física de iOS. La contraseña del cliente es una entrada narrativa, no una protección de acceso a los archivos públicos.
