# Auditoría y validación

Base revisada: `12dd06a1ea78751158b4ae156c8945db728d08be`.

## Diagnóstico y cambios

- Vídeo: el avance dependía únicamente de `ended`. Un error o una petición bloqueada podía impedir llegar al final. Ahora se habilita al terminar, al fallar o tras 15 segundos en la escena, sin reproducción automática. La capa de reproducción es un botón accesible y permite reintentar. El vídeo se pausa al salir.
- Música: cada página ejecutaba `play()` y anulaba la decisión de apagarla. Ahora se conserva esa decisión y solo se reanuda al volver a primer plano si corresponde. Se elimina la pausa por `blur`, que podía detener el audio al abrir controles del sistema.
- Navegación: las transiciones y esperas de escenas anteriores podían crear escenas duplicadas o actuar sobre elementos nuevos. Cada escena tiene una versión, las esperas obsoletas se cancelan y la escena saliente queda inerte.
- iPhone: se elimina el mínimo de altura `-webkit-fill-available` que sobrescribía `100dvh`, se reserva el área segura en la navegación inferior y se permite desplazar las escenas cortas. Las propiedades de los degradados ahora se heredan al pseudo-elemento que los dibuja.
- Caché: la instalación exige un shell completo, separa iconos opcionales, usa versiones iguales a las de HTML, limpia solo cachés `regalo-*` y devuelve HTML de respaldo solo para navegación. No almacena fotos personales, audio, vídeo ni peticiones Range. El nuevo worker espera a que se cierren los clientes anteriores para evitar activación forzada a mitad del recorrido.
- PWA: las tres rutas de iconos y los archivos de destino existen en el árbol de GitHub. No se han descargado ni inspeccionado los binarios y no se afirman dimensiones ni zona segura maskable verificadas. Se conserva el manifiesto. La web sigue mostrando solo instalación, la intro de aproximadamente diez segundos se reserva a standalone o dev local. Se subraya únicamente 4ever en la frase Contigo 4ever.
- Carta: `config.js` permanece idéntico, con un único párrafo, comas y punto final. Se mantiene la justificación y el contenido.

## Validación

- `node --check`: script.js, config.js y sw.js sin errores.
- Edge headless, viewport móvil 390 × 844: tutorial sin contraseña ni intro en web, intro de unos diez segundos en dev local, subrayado solo de 4ever, un párrafo justificado, preferencia de música conservada, navegación rápida con una sola escena, salida del vídeo tras espera/error y vuelta al archivo sin errores no capturados.
- Service worker en entorno simulado Node: limpieza limitada a sus cachés, exclusión de foto/vídeo/Range, recurso ausente sin HTML de respaldo y recuperación offline de CSS con su versión exacta.
- El navegador recibe exclusivamente archivos de código locales. Todas las demás solicitudes se bloquean y Audio se sustituye por un doble de prueba. Ningún archivo audiovisual personal se ha abierto, descargado, decodificado ni modificado.
- No se ha publicado en main.

## Pendiente en iPhone real

Comprobar Safari y app instalada, pantalla con indicador inferior, teclado abierto/cerrado, orientación y vuelta desde segundo plano. Verificar visualmente que desaparece la franja inferior, que los controles no se solapan y que la música responde a los controles del sistema. Revisar instalación/icono y actualización tras cerrar todas las ventanas de la app, así como arranque offline después de una carga online correcta.

La reproducción real y el contenido audiovisual quedan fuera de esta revisión. La simulación móvil de Chromium no certifica el comportamiento de WebKit ni la zona segura física de iOS. La contraseña del cliente es una entrada narrativa, no una protección de acceso a los archivos públicos.

## Corrección de la regresión del fondo, 27 de octubre

Tras la prueba en el dispositivo del usuario, la franja pasó a observarse en todas las escenas. La herencia de --g1 y --g2 activaba los degradados del pseudo-elemento fijo, mientras html conservaba un fondo plano. Esa diferencia entre capas es una causa probable de la regresión, no una medición del iPhone.

Se compararon las revisiones 7cd6449, a181abc, 57366f9, 242bc8d y 12dd06a, además de los mensajes disponibles de Crear también y Crear también (1). El historial mostraba que otras pantallas se veían bien antes de los cambios de la intro; las respuestas históricas completas no están disponibles en la referencia.

La solución retira el fondo del pseudo-elemento fijo y lo pinta en html durante toda la experiencia. El cuerpo es transparente y las paletas de las escenas se aplican a html. El degradado se funde suavemente al color base antes del indicador inferior, cuyo color coincide con background-color. Se mantienen las posiciones de escenas y controles, y se corrige el subrayado para afectar solo a 4ever. HTML y caché se actualizan a v18.

Validación adicional: Edge 390 × 844, seis capturas de las paletas e intro con la app reducida artificialmente 34 píxeles. El último píxel inferior conserva RGB 10, 12, 20 en todas las capturas, el cuerpo es transparente y no hay pseudo-elemento de fondo. Este experimento verifica la composición del fondo, no simula el viewport real de iOS. Las pruebas de navegación, música, carta, intro y error de vídeo vuelven a pasar.

Referencias técnicas: [WebKit sobre fondos y áreas seguras](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) y [reporte abierto de geometría standalone en iOS](https://bugs.webkit.org/show_bug.cgi?id=313800). El segundo es un reporte de usuarios, no una confirmación de que sea el problema concreto de este dispositivo. El cierre visual requiere prueba en iPhone.
