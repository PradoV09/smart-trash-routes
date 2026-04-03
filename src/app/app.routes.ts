import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
    //  children: [
    // debería de ir las rutas protegidas
    //  ]
  },
  { path: '**', redirectTo: '' }
];
