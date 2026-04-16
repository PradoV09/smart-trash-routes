import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ruta } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/rutas`;

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

  // Listado de rutas activas
  getRutasActivas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/activas`, { headers: this.getHeaders() });
  }

  // Creación de tramos de recolección
  crearRutaSector(rutaDto: Partial<Ruta>): Observable<Ruta> {
    const body = this.toUrlEncoded(rutaDto);
    return this.http.post<Ruta>(this.apiUrl, body, { headers: this.getHeaders() });
  }
}
