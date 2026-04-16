import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Asignacion } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/asignaciones`;

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
        // Asegurar que si es arreglo se maneje de forma que el backend lo entienda (ej: JSON o múltiples parámetros form)
        // Por simplicidad, objetos/arreglos los pasamos a string
        const value = typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key];
        params = params.set(key, value);
      }
    }
    return params.toString();
  }

  // POST (crear asignación)
  crearAsignacion(asignacionDto: Partial<Asignacion>): Observable<Asignacion> {
    const body = this.toUrlEncoded(asignacionDto);
    return this.http.post<Asignacion>(this.apiUrl, body, { headers: this.getHeaders() });
  }

  // GET (listar)
  getAsignaciones(): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // POST /cancelar
  cancelarAsignacion(id: number, motivo?: string): Observable<Asignacion> {
    const body = this.toUrlEncoded({ estado: 'Cancelada', motivo });
    return this.http.post<Asignacion>(`${this.apiUrl}/${id}/cancelar`, body, { headers: this.getHeaders() });
  }

  // Gestión de la tripulación: POST de integrante
  agregarTripulante(idAsignacion: number, idUsuario: number): Observable<Asignacion> {
    const body = this.toUrlEncoded({ id_usuario: idUsuario });
    return this.http.post<Asignacion>(`${this.apiUrl}/${idAsignacion}/tripulacion`, body, { headers: this.getHeaders() });
  }

  // Gestión de la tripulación: DELETE de integrante
  eliminarTripulante(idAsignacion: number, idUsuario: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idAsignacion}/tripulacion/${idUsuario}`, { headers: this.getHeaders() });
  }
}
