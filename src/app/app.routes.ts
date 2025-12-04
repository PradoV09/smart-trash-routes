/*
  Definición de rutas principales de la aplicación.

  - Ruta raíz: redirige a `login`.
  - `login`: componente público para iniciar sesión.
  - `dashboard`: área protegida que requiere `AuthGuard`.
    - Contiene children para `inicio`, `rutas`, `vehiculos` y `addresses`.
*/
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Rutas } from './dashboard/pages/rutas/rutas';
import { Vehiculos } from './dashboard/pages/vehiculos/vehiculos';
import { Inicio } from './dashboard/pages/inicio/inicio';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  // Ruta raíz: redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Ruta pública de login (componente Login)
  { path: 'login', component: Login },
  // Área protegida: dashboard
  {
    // Segmento de URL para el dashboard
    path: 'dashboard',
    // Componente que actúa como contenedor del área protegida
    component: Dashboard,
    // Guard que protege la ruta principal del dashboard
    canActivate: [AuthGuard],
    // Rutas hijas del dashboard
    children: [
      // Página de inicio del dashboard
      { path: '', component: Inicio, canActivate: [AuthGuard] },
      // Página de rutas
      { path: 'rutas', component: Rutas, canActivate: [AuthGuard] },
      // Página de vehículos
      { path: 'vehiculos', component: Vehiculos, canActivate: [AuthGuard] },
      // Alias/otra ruta que reutiliza el componente Rutas
      { path: 'addresses', component: Rutas, canActivate: [AuthGuard] }
    ]
  }
];
