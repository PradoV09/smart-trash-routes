import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ruta {
  id?: string;
  nombre: string;
  coordenadas: { lat: number; lng: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private backendUrl = 'http://127.0.0.1:3005/api/rutas';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  // POST /rutas - Crear una nueva ruta
  crearRuta(ruta: Ruta): Observable<Ruta> {
    return this.http.post<Ruta>(this.backendUrl, ruta, { headers: this.getHeaders() });
  }

  // GET /rutas - Leer todas las rutas
  obtenerRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.backendUrl, { headers: this.getHeaders() });
  }

  // GET /rutas/:id - Obtener una ruta específica por su ID
  obtenerRutaPorId(id: string): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.backendUrl}/${id}`, { headers: this.getHeaders() });
  }
}
