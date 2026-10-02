# Regalo para Carmen (PWA)

HTML + CSS + JS vanilla. Sin dependencias ni build.

## Qué reemplazar
| Qué | Dónde |
|---|---|
| Tu foto (EL ARTISTA) | `assets/artist.jpg` (vertical 3:4 funciona mejor) |
| Vídeo del perrito (EL ARTE) | `assets/final-video.mp4` (vertical, H.264/AAC, idealmente < 50 MB) |
| Contraseña | `config.js` → `password` |
| Tu mensaje | `config.js` → `personalMessage` (párrafos separados por una línea en blanco) |
| Nombre del perrito | `config.js` → `universe` (busca `[NOMBRE DEL PERRITO]`) |
| Música (opcional) | `assets/music.mp3` + `config.js` → `music` |
| Textos, colores, easter eggs | `config.js` |

Los iconos (`assets/icon-*.png`, `apple-touch-icon.png`) ya están; puedes cambiarlos por los tuyos con los mismos nombres.

## Probar en tu ordenador
```
python3 -m http.server 8000
```
Abre `http://localhost:8000/?dev` (el `?dev` salta el bloqueo de instalación **solo en localhost**).

## Desplegar (necesita HTTPS)
- **GitHub Pages**: sube la carpeta a un repo → Settings → Pages.
- **Netlify**: arrastra la carpeta a app.netlify.com/drop.
- **Vercel**: `vercel --prod` dentro de la carpeta.

Prueba el enlace real desde tu móvil: instala, abre desde el icono y revisa todo el recorrido antes de dárselo.

## Notas
- Si cambias archivos después de publicar, sube el número de `V` en `sw.js` (`regalo-v2`…) para que se actualice la caché.
- El vídeo no se guarda en caché (Safari lo exige); necesita conexión para verse.
- La contraseña y el bloqueo de instalación son barreras de experiencia, no seguridad.
- Easter eggs: `note` en `config.js` está vacío; ahí puedes añadir contexto si lo necesitas.
- En iPhone la instalación solo funciona desde Safari.
