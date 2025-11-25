import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Rutas } from './dashboard/pages/rutas/rutas';
import { Vehiculos } from './dashboard/pages/vehiculos/vehiculos';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard,
    children: [
      { path: 'rutas', component: Rutas },
      { path: 'vehiculos', component: Vehiculos },
      { path: 'addresses', component: Rutas }
    ]
  }
];
