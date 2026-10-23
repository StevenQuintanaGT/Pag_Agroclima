# Página de presentación de AgroClima Jalapa

Página de una sola hoja para presentar la app [AgroClima Jalapa](https://github.com/StevenQuintanaGT/Agroclima_Jalapa)
a los productores de Jalapa y al jurado de la UMG. **No es una versión web de la app** (la app es solo Android).

- `sitio/`: HTML + CSS, sin frameworks ni compilación. Se publica tal cual.
- `.github/workflows/pagina.yml`: publica `sitio/` en GitHub Pages con cada push a `main` que cambie `sitio/**`
  (o a mano desde *Actions → Publicar página → Run workflow*).
- El APK y la tesis **no** van aquí (los manuales sí, en `sitio/manuales/`): se descargan de los Releases del repositorio de la app
  (`releases/latest/download/AgroClima-Jalapa.apk`).

## Activar la página

GitHub → *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
Dirección: https://stevenquintanagt.github.io/Pag_Agroclima/

## Versión nueva de la app

Crear el Release nuevo en el repositorio de la app con el mismo nombre de archivo (`AgroClima-Jalapa.apk`) y
actualizar en `sitio/index.html` la versión y el tamaño (aparecen en la portada y en el pie).

## Publicar la tesis

Si la universidad lo permite, subirla al Release como `Tesis-AgroClima-Jalapa.pdf` y, en `sitio/index.html`
(sección "El proyecto"), poner su dirección en el botón "Leer la tesis (PDF)" siguiendo el comentario `TESIS:`.

## Otros archivos

- `sitio/manuales/`: los manuales en PDF (instalación, usuario y técnico). Para cambiar uno, reemplace el archivo
  con el **mismo nombre** y, si cambian las páginas o el peso, actualícelos en la sección "Manuales" de `sitio/index.html`.
- `sitio/404.html`: página para direcciones que no existen (GitHub Pages la usa sola).
- `sitio/img/compartir.jpg` (1200×630): la imagen que muestran WhatsApp y Facebook al compartir el enlace.
- `sitio/img/qr.svg`: código QR con la dirección de la página (se muestra en pantallas anchas, para proyectar).
- `sitio/app.js`: el simulador de avisos ("Lo que aguanta su cultivo"), el panel "Mis avisos", la cinta de
  pantallas de la portada y las entradas al bajar. Sin JavaScript la página se lee completa.
- Los límites del simulador y de su tabla vienen de `docs/UMBRALES.md` y los textos de los avisos de
  `functions/src/mensajes.js`, ambos del repositorio de la app; si cambian allá, hay que cambiarlos en
  `sitio/app.js` y en la tabla de `sitio/index.html`.
- Diseño: el lenguaje visual de la app (verde #1B5E20, tarjetas redondeadas, semáforo NORMAL / PRECAUCIÓN /
  PELIGRO), letra Roboto del sistema y sin fuentes externas. Las barras del simulador se pintan con las zonas
  reales de cada cultivo.

## Al cambiar el CSS o el JavaScript

En `sitio/index.html` y `sitio/404.html`, cambie el número de `?v=` en los enlaces a `estilos.css` y `app.js`
(por ejemplo, la fecha del cambio). Así los teléfonos que ya abrieron la página descargan la versión nueva
en vez de usar la guardada.
