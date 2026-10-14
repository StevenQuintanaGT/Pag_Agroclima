# Página de presentación de AgroClima Jalapa

Página de una sola hoja para presentar la app [AgroClima Jalapa](https://github.com/StevenQuintanaGT/Agroclima_Jalapa)
a los productores de Jalapa y al jurado de la UMG. **No es una versión web de la app** (la app es solo Android).

- `sitio/`: HTML + CSS, sin frameworks ni compilación. Se publica tal cual.
- `.github/workflows/pagina.yml`: publica `sitio/` en GitHub Pages con cada push a `main` que cambie `sitio/**`
  (o a mano desde *Actions → Publicar página → Run workflow*).
- El APK y la tesis **no** van aquí: se descargan de los Releases del repositorio de la app
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

- `sitio/404.html`: página para direcciones que no existen (GitHub Pages la usa sola).
- `sitio/img/compartir.jpg` (1200×630): la imagen que muestran WhatsApp y Facebook al compartir el enlace.
- `sitio/img/qr.svg`: código QR con la dirección de la página (se muestra en pantallas anchas, para proyectar).
- Los límites de la sección "Lo que aguanta su cultivo" vienen de `docs/UMBRALES.md` del repositorio de la app;
  si cambian allá, hay que cambiarlos aquí.
