# Recuperación de pantalla de la PWA en iPhone

El usuario confirmó el 27 de octubre de 2026 que, tras el PR #8, el iPhone 12 Pro Max con iOS 27.0.1 soporta teclado y zoom repetidos sin volver a mostrar la franja inferior. La implementación lee dimensiones; no contiene medidas fijas de modelos. El iPhone 16 de la destinataria no fue instrumentado directamente.

## Qué fallaba

La altura no era estable: tras teclado o zoom, innerHeight y visualViewport.height podían ser temporalmente menores. El código del PR #7 tomaba el máximo de ambas lecturas, pero si ambas bajaban de 926 a 879 guardaba 879 en --app-height. También podía guardar una lectura intermedia del cierre del teclado.

La prueba física en frío había mostrado screen, innerHeight, visualViewport, html/body y ambos bordes en 926 px, safeTop 47 px y safeBottom 34 px; documentClient.height era 879. Esa diferencia de clientHeight no era por sí sola una prueba de espacio inferior inutilizable.

## Solución que se debe conservar

- setupViewportRecovery en script.js actúa solo en iOS standalone o dev local.
- En iPhone que ocupa un ancho completo, conserva por ancho/orientación la altura completa confirmada. Una primera lectura solo se completa con screen si el déficit cabe en los insets CSS. Diferencias mayores, ventanas más estrechas e iPad no fuerzan altura de pantalla.
- No sustituir esa referencia por alturas transitorias más pequeñas durante teclado/zoom.
- No intervenir con un campo editable enfocado ni con zoom ampliado. Al volver a 1×, recuperar el desplazamiento del documento sin tocar el scroll interno de la carta.
- La contraseña correcta se acepta una vez, inicia música dentro del gesto, desenfoca el input y deja dos frames de actualización antes de cambiar de escena. Hay una comprobación diferida de 450 ms para el final de la animación del teclado.
- html/body usan --app-height, con fallback 100dvh y 100vh. La app y la navegación inferior se anclan al cuerpo de altura explícita.
- El degradado lo pinta body. No volver a añadir --edge-fade u otra máscara para dar por resuelto un fallo de tamaño.

## Validación antes de cambiar este código

Desde la raíz de la web: `node --test tests/viewport-recovery.test.cjs` y `node --check script.js`. Las 13 pruebas cubren el fallo de alturas intermitentes y los límites de la recuperación.

En iPhone real, repetir abrir/cerrar el campo vacío, entrar con la tecla del teclado y con Entrar, ampliar y volver a 1× en intro, contraseña y primera página, rotar y volver de segundo plano. Comprobar además el scroll de la carta. Chromium y eventos simulados no sustituyen el teclado o WebKit nativos.

Las pruebas de navegador deben bloquear todas las peticiones de fotos, audio y vídeo personales y simular Audio. No hace falta abrir esos archivos para validar el código.

## Referencias

- [PR #8, confirmado por el usuario](https://github.com/ParatiMV/ParatiMV.github.io/pull/8).
- [VisualViewport: tamaño visual, escala y eventos](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).
- AUDIT.md contiene el historial y las limitaciones de los intentos anteriores. Este documento recoge el estado finalmente confirmado.

