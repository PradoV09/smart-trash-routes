import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// Configuración adicional usada en el servidor (SSR)
const serverConfig: ApplicationConfig = {
  providers: [
    // Provee renderizado en servidor y registra rutas server-side
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

// Combina la configuración cliente (appConfig) con la específica del servidor
export const config = mergeApplicationConfig(appConfig, serverConfig);
