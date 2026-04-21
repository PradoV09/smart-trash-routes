import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ruta } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/rutas`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  private unwrapResponse<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  private toHttpParams(obj: Record<string, string | number | boolean | null | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  /**
   * GET /api/rutas?perfil_id=<uuid>
   */
  listarRutas(perfilId: string): Observable<Ruta[]> {
    return this.http
      .get<ApiResponse<Ruta[]>>(this.apiUrl, {
        headers: this.getHeaders(),
        params: this.toHttpParams({ perfil_id: perfilId })
      })
      .pipe(map((res) => this.unwrapResponse(res)));
  }

  /**
   * GET /api/rutas/<ruta_id>
   */
  obtenerRuta(rutaId: string | number): Observable<Ruta> {
    return this.http
      .get<ApiResponse<Ruta>>(`${this.apiUrl}/${encodeURIComponent(String(rutaId))}`, { headers: this.getHeaders() })
      .pipe(map((res) => this.unwrapResponse(res)));
  }

  /**
   * POST /api/rutas (por IDs de calles)
   */
  crearRutaPorCalles(payload: {
    perfil_id: string;
    nombre_ruta: string;
    calles_ids: string[];
  }): Observable<Ruta> {
    return this.http
      .post<ApiResponse<Ruta>>(this.apiUrl, payload, { headers: this.getHeaders() })
      .pipe(map((res) => this.unwrapResponse(res)));
  }

  /**
   * POST /api/rutas (por shape GeoJSON)
   */
  crearRutaPorShape(payload: {
    perfil_id: string;
    nombre_ruta: string;
    shape: Record<string, unknown>;
  }): Observable<Ruta> {
    return this.http
      .post<ApiResponse<Ruta>>(this.apiUrl, payload, { headers: this.getHeaders() })
      .pipe(map((res) => this.unwrapResponse(res)));
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
