import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Rutas } from './dashboard/pages/rutas/rutas';
import { Vehiculos } from './dashboard/pages/vehiculos/vehiculos';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [
      { path: 'rutas', component: Rutas, canActivate: [AuthGuard] },
      { path: 'vehiculos', component: Vehiculos, canActivate: [AuthGuard] },
      { path: 'addresses', component: Rutas, canActivate: [AuthGuard] }
    ]
  }
];
