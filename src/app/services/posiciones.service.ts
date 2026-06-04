import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PosicionesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/admin/posiciones`;

  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // Obtener posiciones de vehículos activos en tiempo real
  getPosicionesActivas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activas`, { headers: this.getAuthHeaders() });
  }

  // Obtener posiciones de una asignación específica
  getPosicionesPorAsignacion(idAsignacion: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignacion/${idAsignacion}`, { headers: this.getAuthHeaders() });
  }
}
