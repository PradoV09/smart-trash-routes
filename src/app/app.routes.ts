import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { Usuarios } from './pages/usuarios/usuarios';
import { Vehiculos } from './pages/vehiculos/vehiculos';
import { Rutas } from './pages/rutas/rutas';
import { Recorridos } from './pages/recorridos/recorridos';
import { Posiciones } from './pages/posiciones/posiciones';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'users', component: Usuarios, canActivate: [authGuard] },
  { path: 'vehicles', component: Vehiculos, canActivate: [authGuard] },
  { path: 'routes', component: Rutas, canActivate: [authGuard] },
  { path: 'tours', component: Recorridos, canActivate: [authGuard] },
  { path: 'positions', component: Posiciones, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
