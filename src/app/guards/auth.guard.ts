import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  console.log('[AuthGuard] Verificando acceso a:', state.url);

  if (!isPlatformBrowser(platformId)) {
    console.log('[AuthGuard] En servidor, permitiendo acceso temporalmente');
    // Si estamos en el servidor (SSR), permitimos el paso temporalmente.
    // El cliente re-evaluará esta regla con acceso a localStorage.
    return true;
  }

  // Verificamos si existe el token a través del servicio (protegido de SSR)
  const token = authService.getToken();
  console.log('[AuthGuard] Token disponible:', !!token);

  if (token) {
    console.log('[AuthGuard] Acceso permitido');
    return true; // Permitimos el paso si hay token
  } else {
    console.log('[AuthGuard] Sin token, redirigiendo a login');
    router.navigate(['/login']); // Si no, redirigimos al login
    return false;
  }
};

