/*
  Entrada principal de la aplicación (cliente).
  - Importa 'zone.js' requerido por Angular.
  - Llama a `bootstrapApplication` con la raíz `App` y la configuración `appConfig`.
  - Captura errores de arranque y los muestra en consola.
*/
import 'zone.js'; // Obligatorio para Angular que usa zonas
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

