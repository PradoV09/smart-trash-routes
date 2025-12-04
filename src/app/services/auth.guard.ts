/*
  Guard de ruta que protege las rutas que requieren autenticación.

  - Implementa `CanActivate` y delega la comprobación en `AuthService.isLoggedIn()`.
  - Si el usuario no está autenticado, devuelve un `UrlTree` hacia `/login`.
    Devolver un `UrlTree` es preferible a `router.navigate` dentro del guard.
*/
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | import('@angular/router').UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Devolver UrlTree en lugar de navegar directamente (mejor para guards)
    return this.router.createUrlTree(['/login']);
  }
}
