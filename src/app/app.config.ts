/*
  Configuración de la aplicación (proveedores compartidos).

  - Provee el enrutador con las rutas definidas en `app.routes`.
  - Provee un cliente HTTP que usa `fetch` internamente (compatibilidad SSR/cliente).
*/
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Provee el enrutador usando las rutas definidas en `app.routes`
    provideRouter(routes),
    // Provee un cliente HTTP que utiliza `fetch` internamente (compatibilidad SSR/cliente)
    provideHttpClient(withFetch())
  ]
};
