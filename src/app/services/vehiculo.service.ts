import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vehiculo, EstadoVehiculo } from '../models/interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/vehiculos`;

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
  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // GET /{id} (detalle)
  getVehiculoById(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // POST (crear)
  createVehiculo(vehiculoDto: Partial<Vehiculo>): Observable<Vehiculo> {
    const body = this.toUrlEncoded(vehiculoDto);
    return this.http.post<Vehiculo>(this.apiUrl, body, { headers: this.getHeaders() });
  }

  // PATCH (actualizar)
  updateVehiculo(id: number, vehiculoDto: Partial<Vehiculo>): Observable<Vehiculo> {
    const body = this.toUrlEncoded(vehiculoDto);
    return this.http.patch<Vehiculo>(`${this.apiUrl}/${id}`, body, { headers: this.getHeaders() });
  }

  // DELETE
  deleteVehiculo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // PATCH /estado (cambios rápidos de disponibilidad)
  updateEstado(id: number, estado: EstadoVehiculo): Observable<Vehiculo> {
    const body = this.toUrlEncoded({ estado });
    return this.http.patch<Vehiculo>(`${this.apiUrl}/${id}/estado`, body, { headers: this.getHeaders() });
  }
}
