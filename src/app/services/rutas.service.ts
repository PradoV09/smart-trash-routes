import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Ruta {
  id?: string;
  nombre_ruta: string;
  calles_ids: string[];
  // Frontend usa coordenadas para display
  coordenadas?: { lat: number; lng: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private baseUrl = 'http://10.241.138.224:3005/api/rutas';

  constructor(private http: HttpClient) {
    console.log('RutasService initialized with baseUrl:', this.baseUrl);
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
        console.log('🔐 Header Authorization establecido');
      } else {
        console.warn('⚠️ No hay token en localStorage');
      }
    }
    return headers;
  }

  // GET /rutas/all - Obtener todas las rutas
  obtenerRutas(): Observable<Ruta[]> {
    const url = `${this.baseUrl}/all`;
    const headers = this.getHeaders();
    
    console.log('🔍 Fetching rutas from URL:', url);
    console.log('🔍 User role from localStorage:', localStorage.getItem('user_rol'));
    
    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('📊 Raw response from backend:', response);

        // El backend puede devolver la lista en diferentes anidamientos:
        // - directamente un array
        // - response.data (array)
        // - response.data.data (array)
        // - response.rutas (array)
        let rawList: any[] = [];

        if (Array.isArray(response)) {
          rawList = response as any[];
        } else if (response && Array.isArray(response.data)) {
          rawList = response.data;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          rawList = response.data.data;
        } else if (response && Array.isArray(response.rutas)) {
          rawList = response.rutas;
        } else {
          console.warn('⚠️ Respuesta inesperada del backend. Se espera array o propiedad data/rutas');
          rawList = [];
        }

        // Normalizar cada elemento al interfaz `Ruta` y parsear `shape` a `coordenadas`
        const rutas: Ruta[] = rawList.map((item: any) => {
          const ruta: Ruta = {
            id: item.id,
            nombre_ruta: item.nombre_ruta || item.nombre || 'Sin nombre',
            calles_ids: Array.isArray(item.calles_ids) ? item.calles_ids : [],
            coordenadas: []
          };

          // `shape` viene como string JSON con GeoJSON (MultiLineString o LineString)
          const shapeRaw = item.shape ?? item.geometry ?? null;
          if (shapeRaw) {
            try {
              const parsed = typeof shapeRaw === 'string' ? JSON.parse(shapeRaw) : shapeRaw;
              const type = parsed?.type?.toLowerCase?.() || '';
              const coords = parsed?.coordinates;

              if (type.includes('multilinestring') && Array.isArray(coords)) {
                // coords: array of lines, each line is array of [lon,lat]
                const flat = coords.flat(1);
                ruta.coordenadas = flat
                  .filter((p: any) => Array.isArray(p) && p.length >= 2)
                  .map((p: any) => ({ lat: Number(p[1]), lng: Number(p[0]) }));
              } else if (type.includes('linestring') && Array.isArray(coords)) {
                ruta.coordenadas = coords
                  .filter((p: any) => Array.isArray(p) && p.length >= 2)
                  .map((p: any) => ({ lat: Number(p[1]), lng: Number(p[0]) }));
              }
            } catch (err) {
              console.warn('⚠️ No se pudo parsear `shape` para la ruta', item.id, err);
            }
          }

          return ruta;
        });

        console.log(`✅ ${rutas.length} rutas procesadas`);
        return rutas;
      })
    );
  }

  // POST /rutas/register - Crear una nueva ruta
  crearRuta(ruta: Ruta): Observable<Ruta> {
    // Método existente que envía todo el objeto Ruta (incluye coordenadas)
    return this.http.post<Ruta>(`${this.baseUrl}/register`, ruta, { headers: this.getHeaders() });
  }

  // POST /rutas/register - Crear nueva ruta con payload mínimo que espera el backend
  crearRutaPayload(payload: { nombre_ruta: string; calles_ids: string[] }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, payload, { headers: this.getHeaders() });
  }

  // GET /rutas/:id - Obtener una ruta específica por su ID
  obtenerRutaPorId(id: string): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
