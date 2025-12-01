import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  // TODO: Reemplaza con la URL de tu backend NestJS
  private backendUrl = 'http://TU_IP_Y_PUERTO_AQUI/rutas'; 

  constructor(private http: HttpClient) { }

  // POST /rutas - Crear una nueva ruta
  crearRuta(ruta: Ruta): Observable<Ruta> {
    return this.http.post<Ruta>(this.backendUrl, ruta);
  }

  // GET /rutas - Leer todas las rutas
  obtenerRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.backendUrl);
  }

  // GET /rutas/:id - Obtener una ruta específica por su ID
  obtenerRutaPorId(id: string): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.backendUrl}/${id}`);
  }
}
