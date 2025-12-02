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
  private isAuthenticated = false;
  private currentUser: any = null;

  constructor(private router: Router, private http: HttpClient) {
    this.checkExistingSession();
  }

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

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>('http://smartroutes.eleueleo.com/api/auth/login', { nameuser: email, password }).pipe(
      tap(response => {
        console.log('Raw login response:', response);
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
          console.log('Buscando:', { email, password });

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
        console.error('Error during login:', error);
        return of(false);
      })
    );
  }

  logout(): void {
    this.isAuthenticated = false;
    this.currentUser = null;

    // Remover de localStorage solo si estamos en el navegador
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_rol');
    }

    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

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


