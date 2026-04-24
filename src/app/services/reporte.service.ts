import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reporte, ReporteTerminarPayload } from '../models/interfaces';
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // GET para visualización del administrador
  getReportes(): Observable<Reporte[]> {
    const token = this.authService.getToken();
    console.log('[ReporteService] Token disponible:', !!token);
    console.log('[ReporteService] URL:', this.apiUrl);

    if (!token) {
      console.error('[ReporteService] No hay token de autenticación');
      return throwError(() => 'No hay token de autenticación. Por favor inicia sesión.');
    }

    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('[ReporteService] Respuesta de la API:', response);
          // Handle the response structure: {success, message, data}
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          // Fallback for direct array response
          return Array.isArray(response) ? response : [];
        }),
        catchError(this.handleError)
      );
  }

  // GET para obtener un reporte específico
  getReporteById(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // POST para que los conductores informen fallas
  crearReporte(reporteDto: Partial<Reporte>): Observable<Reporte> {
    return this.http.post<Reporte>(this.apiUrl, reporteDto, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // PATCH para marcar reporte como terminado
  terminarReporte(idRegistro: number, payload: ReporteTerminarPayload): Observable<Reporte> {
    return this.http.patch<Reporte>(`${this.apiUrl}/${idRegistro}/terminar`, payload, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo centralizado de errores
  private handleError(error: any): Observable<never> {
    console.error('Error en ReporteService:', error);
    let errorMessage = 'Ocurrió un error en la operación';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
    }

    return throwError(() => errorMessage);
  }
}
