/*
  Punto de entrada para SSR (Server Side Rendering).
  - Importa 'zone.js/node' para ejecución en Node.
  - Exporta una función default `bootstrap` que Angular SSR llama con el contexto
    para inicializar la aplicación en el servidor usando `bootstrapApplication`.
*/
import 'zone.js/node';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

export default function bootstrap(context: BootstrapContext) {
    return bootstrapApplication(App, config, context);
}
