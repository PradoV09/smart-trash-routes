import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol, Usuario, UsuarioAdminCreatePayload } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/admin/usuarios`;
  private rolesUrl = `${environment.apiUrl}/admin/roles`;

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  private formUrlEncodedHeaders(): HttpHeaders {
    return this.authHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
  }

  private toUrlEncoded(obj: Record<string, string | number | boolean>): string {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value === null || value === undefined) continue;
      params = params.set(key, String(value));
    }
    return params.toString();
  }

  private toFormData(payload: UsuarioAdminCreatePayload): FormData {
    const fd = new FormData();
    fd.set('nombre', payload.nombre);
    fd.set('username', payload.username);
    fd.set('correo', payload.correo);
    fd.set('contraseña', payload.contraseña);
    fd.set('id_rol', String(payload.id_rol));
    fd.set('activo', payload.activo ? 'true' : 'false');
    return fd;
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, { headers: this.authHeaders() });
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() });
  }

  /** Creación por admin: multipart/form-data (UsuarioAdminCreate en backend). */
  createUsuario(payload: UsuarioAdminCreatePayload): Observable<Usuario> {
    const body = this.toFormData(payload);
    return this.http.post<Usuario>(this.apiUrl, body, { headers: this.authHeaders() });
  }

  updateUsuario(id: number, usuarioDto: Record<string, string | number | boolean>): Observable<Usuario> {
    const body = this.toUrlEncoded(usuarioDto);
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, body, { headers: this.formUrlEncodedHeaders() });
  }

  deleteUsuario(id: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() });
  }

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.rolesUrl, { headers: this.authHeaders() });
  }
}
