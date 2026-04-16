import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  private http = inject(HttpClient);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Simulación de la petición de Login con las directrices de la API
  login(identifier: string, contraseña: string): Observable<any> {
    // La API pide application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set('identifier', identifier);
    body.set('contraseña', contraseña);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    // Como estamos usando public/.json simulamos un GET al json para recibir la estructura de respuesta
    // En un entorno real cambiaríamos '/api/auth/login.json' por 'http://localhost:8000/auth/login'
    // y usaríamos this.http.post(...)
    return this.http.get<any>('/api/auth/login.json').pipe(
      map(response => {
        if (response.success && response.data.access_token) {
          this.setToken(response.data.access_token);
        }
        return response;
      })
    );
  }


  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Extrae el nombre de usuario desde el payload del JWT de forma sencilla.
   * Asume que el token tiene formato: header.payload.signature
   * y que el payload contiene { "user": "nombre@correo.com", ... }
   */
  getUserName(): string {
    const token = this.getToken();
    if (!token) return 'Usuario';

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return 'Usuario';

      const payloadDecoded = atob(payloadBase64);
      const payloadObj = JSON.parse(payloadDecoded);

      // Intentar extraer nombre del email o usar un default
      let userName = payloadObj.user || 'Usuario';
      if (userName.includes('@')) {
        userName = userName.split('@')[0];
        // Capitalizamos la primera letra
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      return userName;
    } catch (e) {
      return 'Usuario';
    }
  }
}
