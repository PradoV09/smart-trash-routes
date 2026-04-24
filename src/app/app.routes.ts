import { Routes } from '@angular/router';
// Importa tu nuevo componente Layout
import { Layout } from './components/layout/layout';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: '',
    component: Layout, // Este componente tiene el Sidebar y el Footer
    canActivate: [authGuard], // Protege todas las rutas hijas
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'rutas',
        loadComponent: () => import('./pages/rutas/rutas').then(m => m.Rutas)
      },
      {
        path: 'vehiculos',
        loadComponent: () => import('./pages/vehiculos/vehiculos').then(m => m.Vehiculos)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then(m => m.Users)
      },
      {
        path: 'asignaciones',
        loadComponent: () => import('./pages/asignaciones/asignaciones').then(m => m.Asignaciones)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes').then(m => m.ReportesComponent)
      },
      {
        path: 'admin/tripulacion',
        loadComponent: () => import('./pages/tripulacion/tripulacion').then(m => m.TripulacionPage)
      },
      {
        path: 'admin/tripulaciones',
        loadComponent: () => import('./pages/tripulaciones/tripulaciones').then(m => m.Tripulaciones)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
