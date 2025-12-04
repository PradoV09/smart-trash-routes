/*
  Servidor Express para servir la aplicación Angular en entorno Node (SSR).

  - `AngularNodeAppEngine` se encarga de renderizar la app Angular en el servidor.
  - Sirve archivos estáticos desde la carpeta `../browser`.
  - Para todas las demás rutas, delega a `angularApp.handle()` para renderizado.
  - Si este archivo se ejecuta como módulo principal, arranca el servidor en el puerto
    indicado por `PORT` o en el 4000 por defecto.
  - Exporta `reqHandler` para integrar con entornos que esperan un handler (Cloud Functions, dev-server).
*/
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Serve static files from /browser
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// Handle all other requests by rendering the Angular application.
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Start the server if this module is the main entry point.
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Servidor Node/Express escuchando en http://localhost:${port}`);
  });
}

// Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
export const reqHandler = createNodeRequestHandler(app);
