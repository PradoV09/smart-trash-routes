import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  private toUrlEncoded(obj: any): string {
    let params = new HttpParams();
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
        params = params.set(key, obj[key]);
      }
    }
    return params.toString();
  }

  // GET (listar todos)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // GET /{id} (detalle)
  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // POST (crear)
  createUsuario(usuarioDto: Partial<Usuario>): Observable<Usuario> {
    const body = this.toUrlEncoded(usuarioDto);
    return this.http.post<Usuario>(this.apiUrl, body, { headers: this.getHeaders() });
  }

  // PATCH (actualizar)
  updateUsuario(id: number, usuarioDto: Partial<Usuario>): Observable<Usuario> {
    const body = this.toUrlEncoded(usuarioDto);
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, body, { headers: this.getHeaders() });
  }

  // DELETE
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
