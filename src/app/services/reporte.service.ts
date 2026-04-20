import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reporte } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/admin/reportes`;

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

  // GET para visualización del administrador
  getReportes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // POST para que los conductores informen fallas
  crearReporte(reporteDto: Partial<Reporte>): Observable<Reporte> {
    const body = this.toUrlEncoded(reporteDto);
    return this.http.post<Reporte>(this.apiUrl, body, { headers: this.getHeaders() });
  }
}
