/*
  Servicio que encapsula llamadas al backend relacionadas con rutas.

  - Provee métodos para obtener todas las rutas, obtener una ruta por ID y crear rutas.
  - Traduce la respuesta del backend al tipo `Ruta` local, parseando `shape` (GeoJSON)
    y convirtiendo coordenadas a objetos `{ lat, lng }`.
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface Ruta {
  id?: string;
  nombre: string;
  coordenadas: { lat: number; lng: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  // Base API for rutas (endpoint /all will be used to fetch all routes)
  private backendBase = 'http://192.168.1.3:3005/api/rutas';

  constructor(private http: HttpClient) { }

  // Construye headers con token si está presente en localStorage
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

  // Ayuda de desarrollo: obtiene la respuesta cruda del endpoint /all (sin mappear)
  obtenerRutasRaw(): Observable<any> {
    const url = `${this.backendBase}/all`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    console.debug('[RutasService] obtenerRutasRaw - ¿token presente?', !!token, 'url:', url);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(resp => console.debug('[RutasService] respuesta cruda (obtenerRutasRaw):', resp)),
      catchError(err => {
        console.error('[RutasService] error en obtenerRutasRaw:', err);
        return throwError(() => err);
      })
    );
  }

  // POST /rutas - Crear una nueva ruta
  crearRuta(data: any): Observable<any> {
    return this.http.post(`${this.backendBase}/register`, data, { headers: this.getHeaders() });
  }

  // GET /rutas - Leer todas las rutas y mapear al tipo local `Ruta`.
  obtenerRutas(): Observable<Ruta[]> {
    // The backend returns a wrapped response: { msg, data: { data: [ ... ] } }
    // and each item has `shape` as a JSON string with GeoJSON MultiLineString coordinates
    return this.http.get<any>(`${this.backendBase}/all`, { headers: this.getHeaders() }).pipe(
      tap(response => console.debug('[RutasService] respuesta cruda /all:', response)),
      map(response => {
        const items = response?.data?.data || [];
        return items.map((it: any) => {
          const ruta: Ruta = {
            id: it.id,
            nombre: it.nombre_ruta || it.nombre || 'Sin nombre',
            coordenadas: []
          };

          const shapeStr = it.shape || it.data?.shape || null;
          if (shapeStr) {
            try {
              const parsed = typeof shapeStr === 'string' ? JSON.parse(shapeStr) : shapeStr;
              // Expecting GeoJSON MultiLineString: coordinates: [ [ [lng, lat], ... ], ... ]
              const coords: { lat: number; lng: number }[] = [];
              if (parsed?.coordinates && Array.isArray(parsed.coordinates)) {
                for (const line of parsed.coordinates) {
                  if (Array.isArray(line)) {
                    for (const pair of line) {
                      if (Array.isArray(pair) && pair.length >= 2) {
                        // GeoJSON coordinate order is [lng, lat]
                        coords.push({ lat: pair[1], lng: pair[0] });
                      }
                    }
                  }
                }
              }
              ruta.coordenadas = coords;
            } catch (e) {
              // If parsing fails, leave coordenadas empty and continue
              ruta.coordenadas = [];
            }
          }

          return ruta;
        });
      }),
      catchError(err => {
        console.error('[RutasService] error en obtenerRutas:', err);
        return throwError(() => err);
      })
    );
  }

  // GET /rutas/:id - Obtener una ruta específica por su ID
  obtenerRutaPorId(id: string): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.backendBase}/${id}`, { headers: this.getHeaders() });
  }

}
