/*
  Servicio de autenticación central.

  Responsabilidades:
  - Gestionar el estado de autenticación en memoria y en `localStorage`.
  - Proveer métodos `login`, `logout` y utilidades para obtener el usuario actual.
  - Manejar distintos formatos de respuesta del backend (tokens, objeto usuario o listas).
*/
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado en memoria (rápido) y copia del usuario actual
  private isAuthenticated = false;
  private currentUser: any = null;

  constructor(private router: Router, private http: HttpClient) {
    // Al construir el servicio intentamos restaurar la sesión desde localStorage
    this.checkExistingSession();
  }

  // Comprueba si existe una sesión persistida en localStorage (SSR-safe)
  private checkExistingSession(): void {
    if (typeof window === 'undefined') return; // SSR check

    const userAuth = localStorage.getItem('user_authenticated');
    if (userAuth === 'true') {
      this.isAuthenticated = true;
      this.currentUser = {
        email: localStorage.getItem('user_email'),
        rol: localStorage.getItem('user_rol')
      };
    }
  }

  // Intenta autenticar contra el backend. Adapta distintos formatos de respuesta.
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>('http://smartroutes.eleueleo.com/api/auth/login', { nameuser: email, password }).pipe(
      tap(response => {
        console.log('Respuesta cruda login:', response);
      }),
      map(response => {
        // Manejar distintos formatos de respuesta: tokens + username, objeto único o arreglo de usuarios
        let usuario: any = null;

        // Caso: backend devuelve tokens y campos como username/userrol
        if (response?.accessToken || response?.username) {
          usuario = {
            id: response.userId || response.id || null,
            email: response.username || response.user || email,
            rol: response.userrol || response.role || 'USER',
            activo: true
          };

          // Guardar tokens si existen
          if (typeof window !== 'undefined') {
            if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
          }
        } else if (response?.usuario || response?.user) {
          usuario = response.usuario || response.user;
        } else {
          const usuarios = response?.usuarios || response?.data || [];
          console.log('Usuarios cargados:', usuarios);
          console.log('Buscando credenciales:', { email });

          usuario = usuarios.find((u: any) => {
            const uEmail = (u.email || u.correo || u.username || '').toString().trim().toLowerCase();
            const uPass = (u.password || u.contrasena || '').toString();
            return uEmail === email.trim().toLowerCase() && uPass === password;
          });
        }

        console.log('Usuario encontrado:', usuario);

        if (usuario && usuario.activo) {
          this.isAuthenticated = true;
          this.currentUser = {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
          };

          // Guardar en localStorage solo si estamos en el navegador
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_authenticated', 'true');
            localStorage.setItem('user_email', usuario.email);
            localStorage.setItem('user_rol', usuario.rol);
            localStorage.setItem('user_id', usuario.id || '1');
          }

          return true;
        } else {
          console.log('Usuario inválido o inactivo');
          return false;
        }
      }),
      catchError(error => {
        console.error('Error durante login:', error);
        return of(false);
      })
    );
  }

  // Cierra la sesión localmente e intenta notificar al backend de forma segura
  logout(): void {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;

    console.log('Iniciando logout - Token:', token ? 'EXISTE' : 'FALTA', 'Email:', email);

    // Limpiar sesión local inmediatamente para que la UI no espere al backend
    this.clearLocalSession();

    // Intentar notificar al backend de forma segura (no bloqueante)
    if (token) {
      this.sendLogoutNotification(token, email);
    }
  }

  // Envía una petición de logout al backend con timeout/abort para que no bloquee la UI
  private sendLogoutNotification(token: string | null, email: string | null): void {
    try {
      const url = 'http://smartroutes.eleueleo.com/api/auth/logout';
      const body = JSON.stringify({ email });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body,
        keepalive: true,
        signal: controller.signal
      }).then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          console.warn('La notificación de logout devolvió estado no OK:', response.status);
        } else {
          console.log('Notificación de logout enviada al backend');
        }
      }).catch(err => {
        clearTimeout(timeoutId);
        console.warn('Error al enviar notificación de logout (en segundo plano):', err);
      });
    } catch (err) {
      console.warn('Error en sendLogoutNotification:', err);
    }
  }

  // Limpia la sesión almacenada y redirige al login
  private clearLocalSession(): void {
    this.isAuthenticated = false;
    this.currentUser = null;

    // Remover de localStorage solo si estamos en el navegador
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_rol');
      localStorage.removeItem('user_id');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    this.router.navigate(['/login']);
  }

  // Comprueba si el usuario está autenticado: usa memoria y fallback a localStorage
  isLoggedIn(): boolean {
    // Verificación dinámica: además del flag en memoria, comprobar localStorage
    if (this.isAuthenticated) return true;

    if (typeof window !== 'undefined') {
      const userAuth = localStorage.getItem('user_authenticated');
      if (userAuth === 'true') {
        // Restaurar estado en memoria por seguridad
        this.isAuthenticated = true;
        this.currentUser = {
          email: localStorage.getItem('user_email'),
          rol: localStorage.getItem('user_rol')
        };
        return true;
      }
    }

    return false;
  }

  // Accesores del usuario actual
  getCurrentUser(): any {
    return this.currentUser;
  }

  getEmail(): string {
    return this.currentUser?.email || '';
  }

  getRol(): string {
    return this.currentUser?.rol || '';
  }
}
