/*
  Servicio simple que carga datos estáticos desde `assets/data`.

  - Usado principalmente en modo demo o para pruebas locales sin backend.
  - Provee métodos para obtener listas de rutas y vehículos desde JSON locales.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = '/assets/data';

  constructor(private http: HttpClient) {}

  // Devuelve el JSON completo de rutas (assets/data/rutas.json)
  getRutas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutas.json`);
  }

  // Devuelve el JSON completo de vehículos (assets/data/vehiculos.json)
  getVehiculos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehiculos.json`);
  }

  // Métodos auxiliares que actualmente devuelven los mismos JSON completos
  getRutaById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutas.json`);
  }

  getVehiculoById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehiculos.json`);
  }
}
