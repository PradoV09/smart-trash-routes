/*
  Componente de gestión de rutas con mapa (Leaflet).

  - Permite dibujar una ruta haciendo clic en el mapa, guardarla en el backend
    y listar/visualizar rutas almacenadas.
  - Convierte los puntos del mapa a GeoJSON y delega la persistencia a `RutasService`.
*/
import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { RutasService, Ruta } from '../../../services/rutas.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutas.html',
  styleUrls: ['./rutas.css'],
  providers: [RutasService]
})
export class Rutas implements AfterViewInit, OnInit {
  private map: any;
  public routePoints: L.LatLng[] = [];
  private polyline: L.Polyline | null = null;
  public rutasGuardadas: Ruta[] = [];
  public isLoading = false;
  public isSaving = false;
  private rutasService = inject(RutasService);
  private http = inject(HttpClient);

  ngAfterViewInit(): void {
    this.initMap();
    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
    this.cargarRutasGuardadas();
  }

  ngOnInit(): void {
    // Set loading before change detection runs to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.isLoading = true;
  }

  // Inicializa el mapa Leaflet y la capa de tiles
  private initMap(): void {
    this.map = L.map('map').setView([3.883, -77.067], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  // Al hacer click en el mapa añadimos un punto a la ruta en construcción
  private onMapClick(e: L.LeafletMouseEvent): void {
    this.routePoints.push(e.latlng);
    this.drawPolyline();
  }

  // Dibuja o actualiza la polyline temporal en el mapa
  private drawPolyline(): void {
    if (this.polyline) {
      this.polyline.setLatLngs(this.routePoints);
    } else {
      this.polyline = L.polyline(this.routePoints, { color: 'blue' }).addTo(this.map);
    }
  }

  // Guarda la ruta construida en el backend transformándola a GeoJSON
  saveRoute(): void {
    const nombre = prompt('Introduce el nombre de la ruta:');
    if (!nombre || this.routePoints.length < 2) {
      console.warn("Se necesitan al menos 2 puntos para una ruta");
      return;
    }

    // CONSTRUIMOS EL GEOJSON
    const shapeGeoJSON = {
      type: "LineString",
      coordinates: this.routePoints.map(p => [p.lng, p.lat])  // IMPORTANTE: lng primero!
    };

    const payload = {
      nombre_ruta: nombre,
      shape: shapeGeoJSON
    };

    console.log("Payload enviado:", payload);

    this.rutasService.crearRuta(payload).subscribe({
      next: () => {
        console.log('Ruta guardada exitosamente');
        this.cargarRutasGuardadas();
        this.clearRoute();
      },
      error: (err) => {
        console.error('Error saving ruta:', err);
      }
    });
  }

  // Limpia la ruta en construcción
  clearRoute(): void {
    this.routePoints = [];
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }
  }

  // Carga las rutas guardadas desde el servicio
  cargarRutasGuardadas(): void {
    this.rutasService.obtenerRutas().subscribe({
      next: (rutas: Ruta[]) => {
        console.log('Rutas recibidas desde el backend:', rutas);
        this.rutasGuardadas = rutas;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading rutas:', err);
        this.isLoading = false;
      }
    });
  }

  // Visualiza una ruta existente en el mapa
  verRuta(ruta: Ruta): void {
    // El método obtenerRutaPorId no se usa directamente aquí,
    // pero está disponible en el servicio para futuras ampliaciones.
    this.clearRoute();
    this.routePoints = ruta.coordenadas.map((c: { lat: number; lng: number }) => L.latLng(c.lat, c.lng));
    this.drawPolyline();
    if (this.polyline) {
      this.map.fitBounds(this.polyline.getBounds());
    }
  }
}
