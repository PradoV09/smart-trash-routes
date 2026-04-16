import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Verificamos si existe el token a través del servicio (protegido de SSR)
  const token = authService.getToken();

  if (token) {
    return true; // Permitimos el paso si hay token
  } else {
    router.navigate(['/login']); // Si no, redirigimos al login
    return false;
  }
};

