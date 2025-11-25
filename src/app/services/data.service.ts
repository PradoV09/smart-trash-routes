import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = '/assets/data';

  constructor(private http: HttpClient) {}

  getRutas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutas.json`);
  }

  getVehiculos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehiculos.json`);
  }

  getRutaById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutas.json`);
  }

  getVehiculoById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehiculos.json`);
  }
}
