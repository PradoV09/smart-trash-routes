import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  private http = inject(HttpClient);
  private loginUrl = `${environment.apiUrl}/auth/login`;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(identifier: string, contraseña: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('identifier', identifier);
    body.set('contraseña', contraseña);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<any>(this.loginUrl, body.toString(), { headers }).pipe(
      map((response) => {
        if (response.success && response.data?.access_token) {
          const token = response.data.access_token;
          const payload = this.decodeJwtPayload(token) || {};
          
          // Buscar rol en el JWT
          const rolJwt = String(payload['rol'] || payload['role'] || '').toLowerCase();
          const idRolJwt = payload['id_rol'] || payload['rol_id'];
          
          // Buscar rol en los datos del login (response.data)
          const userObj = response.data?.usuario || response.data?.user || response.data?.perfil || {};
          const rolData = String(userObj['rol'] || userObj['role'] || response.data?.rol || response.data?.role || '').toLowerCase();
          const idRolData = userObj['id_rol'] || userObj['rol_id'] || response.data?.id_rol || response.data?.rol_id;

          const esAdmin = 
            rolJwt === 'admin' || rolJwt === '1' || idRolJwt === 1 || String(idRolJwt) === '1' ||
            rolData === 'admin' || rolData === '1' || idRolData === 1 || String(idRolData) === '1';

          if (!esAdmin) {
            throw new Error('ACCESO_DENEGADO_NO_ADMIN');
          }

          this.setToken(token, response.data);
        }
        return response;
      })
    );
  }
  forgotPassword(correo: string): Observable<any> {
    const url = `${environment.apiUrl}/auth/forgot-password`;
    return this.http.post<any>(url, { correo });
  }

  resetPassword(token: string, new_password: string): Observable<any> {
    const url = `${environment.apiUrl}/auth/reset-password`;
    return this.http.post<any>(url, { token, new_password });
  }




  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  setToken(token: string, loginData?: Record<string, unknown>): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem('access_token', token);
    this.syncStoredUsername(token, loginData);
    this.syncStoredPerfilId(token, loginData);
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('perfil_id');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Username para saludos (columna "Usuario"). Orden: caché del login, JWT (UTF-8),
   * cuerpo `data` del login, identificadores tipo correo.
   */
  getUserName(): string {
    if (this.isBrowser) {
      const cached = localStorage.getItem('auth_username');
      if (cached?.trim()) {
        return cached.trim();
      }
    }

    const token = this.getToken();
    if (!token) {
      return 'Usuario';
    }

    const p = this.decodeJwtPayload(token);
    if (p) {
      const fromJwt = this.pickDisplayLogin(p);
      if (fromJwt) {
        return fromJwt;
      }
    }

    return 'Usuario';
  }

  getPerfilId(): string | null {
    if (this.isBrowser) {
      const cached = localStorage.getItem('perfil_id');
      if (cached?.trim()) {
        return cached.trim();
      }
    }
    const token = this.getToken();
    if (!token) {
      return null;
    }
    const payload = this.decodeJwtPayload(token);
    return payload ? this.pickPerfilId(payload) : null;
  }

  private syncStoredUsername(token: string, loginData?: Record<string, unknown>): void {
    if (!this.isBrowser) {
      return;
    }
    const fromLoginBody = loginData ? this.usernameFromLoginData(loginData) : null;
    const p = this.decodeJwtPayload(token);
    const fromJwt = p ? this.pickUsernameClaim(p) : null;
    const chosen = fromLoginBody || fromJwt;
    if (chosen) {
      localStorage.setItem('auth_username', chosen);
    } else {
      localStorage.removeItem('auth_username');
    }
  }

  private syncStoredPerfilId(token: string, loginData?: Record<string, unknown>): void {
    if (!this.isBrowser) {
      return;
    }
    const fromLoginBody = loginData ? this.perfilIdFromLoginData(loginData) : null;
    const payload = this.decodeJwtPayload(token);
    const fromJwt = payload ? this.pickPerfilId(payload) : null;
    const chosen = fromLoginBody || fromJwt;
    if (chosen) {
      localStorage.setItem('perfil_id', chosen);
    } else {
      localStorage.removeItem('perfil_id');
    }
  }

  private usernameFromLoginData(data: Record<string, unknown>): string | null {
    const d = data as Record<string, unknown>;
    return (
      this.trimStr(d['username']) ||
      this.trimStr((d['user'] as Record<string, unknown> | undefined)?.['username']) ||
      this.trimStr((d['usuario'] as Record<string, unknown> | undefined)?.['username'])
    );
  }

  private perfilIdFromLoginData(data: Record<string, unknown>): string | null {
    const d = data as Record<string, unknown>;
    const perfil = (d['perfil'] ?? d['profile']) as Record<string, unknown> | undefined;
    const usuario = (d['usuario'] ?? d['user']) as Record<string, unknown> | undefined;
    return (
      this.trimStr(d['perfil_id']) ||
      this.trimStr(d['id_perfil']) ||
      this.trimStr(d['profile_id']) ||
      this.trimStr(d['profileId']) ||
      this.trimStr(perfil?.['id']) ||
      this.trimStr(perfil?.['uuid']) ||
      this.trimStr(perfil?.['perfil_id']) ||
      this.trimStr(usuario?.['perfil_id']) ||
      null
    );
  }

  /** Decodifica el payload del JWT en UTF-8 (atob solo sirve bien para Latin-1). */
  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const segment = token.split('.')[1];
      if (!segment) {
        return null;
      }
      let base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += '='.repeat(4 - pad);
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const json = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private trimStr(v: unknown): string | null {
    return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
  }

  private pickUsernameClaim(p: Record<string, unknown>): string | null {
    const direct =
      this.trimStr(p['username']) ||
      this.trimStr(p['Username']) ||
      this.trimStr(p['preferred_username']);
    if (direct) {
      return direct;
    }
    for (const key of Object.keys(p)) {
      if (key.toLowerCase() === 'username') {
        const v = this.trimStr(p[key]);
        if (v) {
          return v;
        }
      }
    }
    return null;
  }

  private pickDisplayLogin(p: Record<string, unknown>): string | null {
    const u = this.pickUsernameClaim(p);
    if (u) {
      return u;
    }
    const ident =
      this.trimStr(p['user']) || this.trimStr(p['email']) || this.trimStr(p['correo']);
    if (ident) {
      if (ident.includes('@')) {
        const local = ident.split('@')[0];
        return local.charAt(0).toUpperCase() + local.slice(1);
      }
      return ident;
    }
    return null;
  }

  private pickPerfilId(p: Record<string, unknown>): string | null {
    return (
      this.trimStr(p['perfil_id']) ||
      this.trimStr(p['id_perfil']) ||
      this.trimStr(p['profile_id']) ||
      this.trimStr(p['profileId']) ||
      this.trimStr((p['perfil'] as Record<string, unknown> | undefined)?.['id']) ||
      this.trimStr((p['perfil'] as Record<string, unknown> | undefined)?.['uuid']) ||
      this.trimStr((p['profile'] as Record<string, unknown> | undefined)?.['id']) ||
      this.trimStr((p['profile'] as Record<string, unknown> | undefined)?.['uuid']) ||
      null
    );
  }
}
