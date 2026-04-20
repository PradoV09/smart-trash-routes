import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/interfaces';
import { MatIconModule } from '@angular/material/icon';

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

  private rutaService = inject(RutaService);

  rutas: Ruta[] = [];
  loading = false;
  saving = false;
  deletingId: number | null = null;
  error = '';
  editingId: number | null = null;

  // Datos para formulario
  nombreRuta = '';
  horarioEstimado = 'Mañana (08:00 - 12:00)';

  ngOnInit() {
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
  }

  guardarRuta() {
    if (!this.nombreRuta || this.routeCoords.length < 2) {
      alert("Por favor, ingresa un nombre y marca al menos 2 puntos para la ruta.");
      return;
    }

    const payload: Partial<Ruta> = {
      nombre_sector: this.nombreRuta,
      puntos_geograficos: JSON.stringify(this.routeCoords),
      horario_estimado: this.horarioEstimado
    };

    this.saving = true;
    this.error = '';
    const request$ = this.editingId
      ? this.rutaService.updateRuta(this.editingId, payload)
      : this.rutaService.crearRutaSector(payload);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        alert(this.editingId ? 'Ruta actualizada con éxito.' : 'Ruta guardada con éxito.');
        this.editingId = null;
        this.limpiarMapa();
        this.loadRutas();
      },
      error: () => {
        this.saving = false;
        this.error = this.editingId
          ? 'Error al actualizar la ruta.'
          : 'Error al guardar la ruta.';
      }
    });
  }

  loadRutas(): void {
    this.loading = true;
    this.error = '';
    this.rutaService.getRutas().subscribe({
      next: (res) => {
        this.rutas = this.extractArray<Ruta>(res);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las rutas.';
        this.loading = false;
      }
    });
  }

  editarRuta(ruta: Ruta): void {
    this.editingId = ruta.id_ruta;
    this.nombreRuta = ruta.nombre_sector;
    this.horarioEstimado = ruta.horario_estimado;
    this.routeCoords = this.parseCoords(ruta.puntos_geograficos);
    this.polyline.setLatLngs(this.routeCoords.map((coord) => [coord[1], coord[0]]));

    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    this.routeCoords.forEach((coord) => {
      const marker = L.circleMarker([coord[1], coord[0]], { radius: 5, color: '#1a1a2e' }).addTo(this.map);
      this.markers.push(marker);
    });
  }

  eliminarRuta(ruta: Ruta): void {
    if (!confirm(`Eliminar ruta "${ruta.nombre_sector}"?`)) {
      return;
    }

    this.deletingId = ruta.id_ruta;
    this.error = '';
    this.rutaService.deleteRuta(ruta.id_ruta).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadRutas();
      },
      error: () => {
        this.error = 'No se pudo eliminar la ruta.';
        this.deletingId = null;
      }
    });
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

  getCantidadPuntos(pointsRaw: string): number {
    return this.parseCoords(pointsRaw).length;
  }

  private extractArray<T>(response: T[] | { data?: T[] }): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  }
}
