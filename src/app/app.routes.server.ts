import { RenderMode, ServerRoute } from '@angular/ssr';

// Rutas específicas usadas por SSR para decidir el modo de renderizado
export const serverRoutes: ServerRoute[] = [
  {
    // Cualquier ruta será prerenderizada por el servidor
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
