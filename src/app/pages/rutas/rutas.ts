import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './rutas.html',
  styleUrl: './rutas.css',
})
export class Rutas implements OnInit {
  map!: L.Map;
  routeCoords: [number, number][] = [];
  polyline!: L.Polyline;
  markers: L.CircleMarker[] = []; // Nueva lista para rastrear los puntos visuales
  selectedRouteLayer: L.GeoJSON | null = null;

  private rutaService = inject(RutaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  rutas: Ruta[] = [];
  loading = false;
  saving = false;
  error = '';

  // Datos para formulario
  private perfilId = '';
  nombreRuta = '';

  ngOnInit() {
    this.perfilId = this.authService.getPerfilId()?.trim() ?? '';
    this.initMap();
    this.loadRutas();
  }

  private initMap() {
    // Inicializamos el mapa con una vista por defecto
    this.map = L.map('map').setView([3.88124, -77.01103], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.polyline = L.polyline([], { color: '#2dcecc', weight: 5 }).addTo(this.map);

    // --- NUEVA LÓGICA DE GEOLOCALIZACIÓN ---

    // 1. Intentar localizar al usuario
    this.map.locate({ setView: true, maxZoom: 16 });

    // 2. Si tiene éxito, poner un marcador azul especial
    this.map.on('locationfound', (e: L.LocationEvent) => {
      const radius = e.accuracy / 2;

      // Marcador de ubicación actual
      L.marker(e.latlng).addTo(this.map)
        .bindPopup(`Estás a ${radius.toFixed(0)} metros de este punto`).openPopup();

      // Círculo de precisión opcional
      L.circle(e.latlng, radius).addTo(this.map);
    });

    // 3. Si falla (el usuario deniega el permiso), mostrar error
    this.map.on('locationerror', (e) => {
      console.warn("Acceso a la ubicación denegado o no disponible.");
      // El mapa se quedará en la posición por defecto [3.88, -77.01]
    });

    // --- FIN LÓGICA DE GEOLOCALIZACIÓN ---

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.addPoint(lat, lng);
    });
  }

  addPoint(lat: number, lng: number) {
    // Nota: GeoJSON usa [longitud, latitud]
    this.routeCoords.push([lng, lat]);
    this.polyline.setLatLngs(this.routeCoords.map(c => [c[1], c[0]]));

    // Marcador visual para el punto
    const marker = L.circleMarker([lat, lng], { radius: 5, color: '#1a1a2e' }).addTo(this.map);
    this.markers.push(marker); // Guardamos la referencia para poder borrarlo luego
  }

  // Mejora: Función para borrar solo el último punto (Undo)
  deshacerUltimoPunto() {
    if (this.routeCoords.length > 0) {
      this.routeCoords.pop();
      this.polyline.setLatLngs(this.routeCoords.map(c => [c[1], c[0]]));
      const lastMarker = this.markers.pop();
      if (lastMarker) this.map.removeLayer(lastMarker);
    }
  }

  limpiarMapa() {
    this.routeCoords = [];
    this.polyline.setLatLngs([]);

    // Borrar físicamente los marcadores del mapa
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
    this.nombreRuta = "";
    this.clearSelectedRouteLayer();
  }

  guardarRuta() {
    if (!this.perfilId.trim()) {
      this.error = 'No se pudo obtener perfil_id desde la sesión del backend.';
      return;
    }

    if (!this.nombreRuta || this.routeCoords.length < 2) {
      alert("Por favor, ingresa un nombre y marca al menos 2 puntos para la ruta.");
      return;
    }

    const payload = {
      perfil_id: this.perfilId.trim(),
      nombre_ruta: this.nombreRuta,
      shape: {
        type: 'LineString',
        coordinates: this.routeCoords
      } as Record<string, unknown>
    };

    this.saving = true;
    this.error = '';
    const request$ = this.rutaService.crearRutaPorShape(payload);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        alert('Ruta guardada con éxito.');
        this.limpiarMapa();
        this.loadRutas();
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.error = 'Error al guardar la ruta.';
        this.cdr.detectChanges();
      }
    });
  }

  loadRutas(): void {
    if (!this.perfilId.trim()) {
      this.rutas = [];
      this.error = 'No se pudo obtener perfil_id desde la sesión del backend.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.rutaService.listarRutas(this.perfilId.trim()).subscribe({
      next: (res) => {
        this.rutas = Array.isArray(res) ? res : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las rutas.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  verRutaEnMapa(ruta: Ruta): void {
    this.drawRouteDetail(ruta);
  }

  private parseCoords(pointsRaw: string): [number, number][] {
    try {
      const parsed = JSON.parse(pointsRaw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((point): point is [number, number] =>
          Array.isArray(point) && point.length === 2 && point.every((v) => typeof v === 'number')
        );
    } catch {
      return [];
    }
  }

  private getShapeObject(ruta: unknown): any {
    const r = ruta as Record<string, unknown>;
    let shapeObj = r['shape'] ?? r['geometry'] ?? r['geojson'];
    if (typeof shapeObj === 'string') {
      try {
        shapeObj = JSON.parse(shapeObj);
      } catch (e) {
        shapeObj = null;
      }
    }
    return shapeObj;
  }

  private drawRouteDetail(ruta: unknown): void {
    this.clearSelectedRouteLayer();
    const r = ruta as Record<string, unknown>;
    const shapeObj = this.getShapeObject(ruta);

    if (shapeObj) {
      const color = r['color_hex'] ? String(r['color_hex']) : '#2dcecc';
      this.selectedRouteLayer = L.geoJSON(shapeObj as GeoJSON.GeoJsonObject, {
        style: {
          color: color,
          weight: 5
        }
      }).addTo(this.map);
      
      const bounds = this.selectedRouteLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [20, 20] });
      }
    }

    // Limpiar marcadores y polilínea anterior
    this.routeCoords = [];
    this.polyline.setLatLngs([]);
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];
  }

  private clearSelectedRouteLayer(): void {
    if (this.selectedRouteLayer) {
      this.map.removeLayer(this.selectedRouteLayer);
      this.selectedRouteLayer = null;
    }
  }

  getCantidadPuntos(ruta: Ruta): number {
    const shapeObj = this.getShapeObject(ruta);
    if (shapeObj && typeof shapeObj === 'object') {
      const type = shapeObj.type;
      const coords = shapeObj.coordinates;
      if (type === 'MultiLineString' && Array.isArray(coords)) {
        let count = 0;
        for (const line of coords) {
          if (Array.isArray(line)) count += line.length;
        }
        return count;
      } else if (type === 'LineString' && Array.isArray(coords)) {
        return coords.length;
      }
    }
    
    const row = ruta as unknown as Record<string, unknown>;
    const legacyPoints = row['puntos_geograficos'];
    if (typeof legacyPoints === 'string') {
      return this.parseCoords(legacyPoints).length;
    }
    return 0;
  }

  getRutaNombre(ruta: Ruta): string {
    const row = ruta as unknown as Record<string, unknown>;
    return String(row['nombre_ruta'] ?? row['nombre_sector'] ?? 'Ruta');
  }

  getRutaColor(ruta: Ruta): string {
    const row = ruta as unknown as Record<string, unknown>;
    return String(row['color_hex'] || '#2dcecc');
  }

  private getRutaId(ruta: Ruta): string | number | null {
    const row = ruta as unknown as Record<string, unknown>;
    const id = row['id_ruta'] ?? row['id'];
    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
    return null;
  }
}
