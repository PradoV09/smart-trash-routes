import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsignacionesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/admin/asignaciones`;

  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getAsignaciones(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getAsignacionById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  crearAsignacion(payload: { id_vehiculo: number; id_tripulacion?: number; id_ruta: string; fecha: string }): Observable<any> {
    const formData = new FormData();
    formData.append('id_vehiculo', String(payload.id_vehiculo || ''));
    if (payload.id_tripulacion !== undefined) {
      formData.append('id_tripulacion', String(payload.id_tripulacion));
    }
    formData.append('id_ruta', payload.id_ruta || '');
    formData.append('fecha', payload.fecha || '');
    return this.http.post(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }

  cancelarAsignacion(id: number): Observable<any> {
    const formData = new FormData();
    return this.http.post(`${this.apiUrl}/${id}/cancelar`, formData, { headers: this.getAuthHeaders() });
  }

  getRutaInfo(idRuta: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutas/${idRuta}`, { headers: this.getAuthHeaders() });
  }

  getRutas(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/rutas`, { headers: this.getAuthHeaders() });
  }
}
