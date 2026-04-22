import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TripulacionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/admin/tripulaciones`;

  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  /** Obtiene el listado global de todas las tripulaciones (Equipos) */
  getTripulaciones(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  /** Obtiene los miembros de la tripulación de una asignación específica */
  getTripulacion(idAsignacion: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/asignaciones/${idAsignacion}/tripulacion`, { headers: this.getAuthHeaders() });
  }

  /** Agrega un miembro a la tripulación de una asignación */
  addMiembro(idAsignacion: number, payload: { id_usuario: number; rol_tripulacion: string }): Observable<any> {
    // Usamos FormData porque el backend usa .as_form()
    const formData = new FormData();
    formData.append('id_usuario', payload.id_usuario.toString());
    formData.append('rol_tripulacion', payload.rol_tripulacion);

    return this.http.post(`${environment.apiUrl}/admin/asignaciones/${idAsignacion}/tripulacion`, formData, { headers: this.getAuthHeaders() });
  }

  /** Crea una nueva tripulación completa (1 conductor + 3 recolectores) */
  crearTripulacion(payload: { nombre?: string; miembros: any[] }): Observable<any> {
    return this.http.post(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  /** Mantenemos este para compatibilidad o si se requiere borrar un miembro de un equipo (pend de implementar en backend si se desea) */
  removeMiembro(idTripulacion: number, idUsuario: number): Observable<any> {
    // Por ahora el backend solo soporta crear el equipo completo
    return this.http.delete(`${this.apiUrl}/${idTripulacion}/miembros/${idUsuario}`, { headers: this.getAuthHeaders() });
  }

  // --- Driver Endpoints ---
  confirmarParticipacion(idAsignacion: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/driver/asignaciones/${idAsignacion}/confirmar`, {}, { headers: this.getAuthHeaders() });
  }
}
