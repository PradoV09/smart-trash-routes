import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Verificar si hay un usuario autenticado en localStorage
    const user = localStorage.getItem('user');

    if (user) {
        // Usuario autenticado
        return true;
    } else {
        // Usuario no autenticado, redirigir a login
        return router.createUrlTree(['/']);
    }
};
