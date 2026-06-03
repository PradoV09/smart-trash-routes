import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef, effect, afterNextRender, AfterViewInit } from '@angular/core';
import type * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { SidebarRutasComponent } from './components/sidebar-rutas/sidebar-rutas';
import { RutasStateService } from '../../services/rutas-state.service';

// Lazy imports para objetos que requieren window
let L_instance: typeof L;
let Swal: any;

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SidebarRutasComponent],
  templateUrl: './rutas.html',
  styleUrl: './rutas.css',
})
export class Rutas implements OnInit, AfterViewInit {
  map!: L.Map;
  routeCoords: [number, number][] = [];
  polyline!: L.Polyline;
  markers: L.CircleMarker[] = [];
  cargandoSegmento = false;

  // Capas para las rutas activas/hover
  private selectedLayer: L.GeoJSON | null = null;
  private hoverLayer: L.GeoJSON | null = null;

  private rutaService = inject(RutaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  public rutasState = inject(RutasStateService);
  private platformId = inject(PLATFORM_ID);

  rutas: Ruta[] = [];
  loading = false;
  saving = false;
  error = '';

  // Datos para formulario
  private perfilId = '';
  nombreRuta = '';

  constructor() {
    effect(() => {
      const hovered = this.rutasState.hoveredRuta();
      this.renderHoveredRoute(hovered);
    });

    effect(() => {
      const selected = this.rutasState.selectedRuta();
      this.renderSelectedRoute(selected);
    });
  }

  sidebarOpen = true;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    // Invalidate map size after CSS transition (300ms) to ensure Leaflet recalculates bounds
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Esperar un tick para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  ngOnInit() {
    this.perfilId = this.authService.getPerfilId()?.trim() ?? '';
    this.loadRutas();
    this.loadSwal(); // Cargar Swal dinámicamente
  }

  private async loadSwal() {
    if (!Swal) {
      try {
        const swalModule = await import('sweetalert2');
        Swal = (swalModule as any).default || swalModule;
      } catch (e) {
        console.error('Error cargando Swal:', e);
      }
    }
  }

  private async initMap() {
    if (this.map) return; // Evitar doble inicialización

    try {
      // Verificar que el elemento del mapa existe en el DOM
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Error: No se encontró el elemento #map en el DOM');
        this.error = 'Error: El contenedor del mapa no se encontró en la página.';
        this.cdr.detectChanges();
        return;
      }

      // Lazy load leaflet solo en navegador usando import() dinámico
      if (!L_instance) {
        const leafletModule = await import('leaflet');
        // En módulos ES (Vite), el objeto real puede estar en .default
        L_instance = (leafletModule as any).default || leafletModule;
      }
      const L = L_instance;

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
      this.map.on('locationerror', (e: any) => {
        console.warn("Acceso a la ubicación denegado o no disponible.");
        // El mapa se quedará en la posición por defecto [3.88, -77.01]
      });

      // --- FIN LÓGICA DE GEOLOCALIZACIÓN ---

      this.map.on('click', async (e: L.LeafletMouseEvent) => {
        if (this.cargandoSegmento) return; // ignorar clic si ya está calculando
        const { lat, lng } = e.latlng;
        await this.addPoint(lat, lng);
      });

      // Asegurar que el mapa tome el tamaño del contenedor correctamente
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 300); // Aumentado a 300ms para asegurar que el DOM esté estable
    } catch (e: any) {
      console.error('Error inicializando el mapa:', e);
      this.error = 'Error cargando mapa: ' + (e.message || e.toString());
      this.cdr.detectChanges();
    }
  }

  // ── NUEVO: función que consulta OSRM entre dos puntos ──
  private async getSegmentoEnCalles(
    desde: [number, number], // [lat, lng]
    hasta: [number, number]  // [lat, lng]
  ): Promise<[number, number][]> {
    try {
      // OSRM espera [lng, lat] separados por ;
      const url = `https://router.project-osrm.org/route/v1/driving/` +
        `${desde[1]},${desde[0]};${hasta[1]},${hasta[0]}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        // Si OSRM falla, devuelve línea recta como fallback
        return [desde, hasta];
      }

      // OSRM devuelve [lng, lat], convertimos a [lat, lng] para Leaflet
      return data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      );
    } catch (error) {
      console.warn('Error consultando OSRM:', error);
      // Fallback: línea recta si la consulta falla
      return [desde, hasta];
    }
  }

  // ── MODIFICADO: addPoint ahora es async y llama OSRM ──
  async addPoint(lat: number, lng: number) {
    if (!this.map || !this.polyline || !L_instance) {
      return; // Mapa no inicializado aún
    }
    const L = L_instance;

    const nuevoLatLng: [number, number] = [lat, lng];

    if (this.routeCoords.length === 0) {
      // Primer punto: solo guardar, nada que trazar aún
      this.routeCoords.push([lng, lat]);

    } else {
      // ── NUEVO: calcular segmento por calles desde el último punto ──
      const ultimoGuardado = this.routeCoords[this.routeCoords.length - 1];
      const desdeLatLng: [number, number] = [ultimoGuardado[1], ultimoGuardado[0]];

      // Mostrar feedback visual mientras carga OSRM
      this.cargandoSegmento = true;

      const segmento = await this.getSegmentoEnCalles(desdeLatLng, nuevoLatLng);

      this.cargandoSegmento = false;

      // Agregar todos los puntos intermedios del segmento a routeCoords
      // (son los puntos que OSRM calculó siguiendo las calles)
      for (const punto of segmento) {
        this.routeCoords.push([punto[1], punto[0]]); // guardar como [lng, lat] para GeoJSON
      }
    }

    // Redibujar la polilínea completa con todos los segmentos acumulados
    this.polyline.setLatLngs(
      this.routeCoords.map(c => [c[1], c[0]] as [number, number])
    );

    // Marcador visual solo en el punto donde el usuario hizo clic
    const marker = L.circleMarker([lat, lng], {
      radius: 5,
      color: '#1a1a2e'
    }).addTo(this.map);
    this.markers.push(marker);
  }

  // Mejora: Función para borrar solo el último punto (Undo)
  deshacerUltimoPunto() {
    if (!this.map || !this.polyline || this.routeCoords.length === 0) {
      return; // Mapa no inicializado o nada que deshacer
    }
    this.routeCoords.pop();
    this.polyline.setLatLngs(this.routeCoords.map(c => [c[1], c[0]]));
    const lastMarker = this.markers.pop();
    if (lastMarker) this.map.removeLayer(lastMarker);
  }

  limpiarMapa() {
    if (!this.map || !this.polyline) {
      return; // Mapa no inicializado aún
    }
    this.routeCoords = [];
    this.polyline.setLatLngs([]);

    // Borrar físicamente los marcadores del mapa
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
    this.nombreRuta = "";

    // Deseleccionar rutas en el state si hay una activa
    this.rutasState.selectRuta(null);
  }

  guardarRuta() {
    if (!this.perfilId.trim()) {
      this.error = 'No se pudo obtener perfil_id desde la sesión del backend.';
      return;
    }

    if (!this.nombreRuta || this.routeCoords.length < 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Información incompleta',
        text: 'Necesitas un nombre y al menos 2 puntos en el mapa. 📍',
        confirmButtonColor: '#2dcecc',
        confirmButtonText: 'Entendido'
      });
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

    // Mostrar modal de "Guardando..." con spinner
    Swal.fire({
      title: 'Guardando tu ruta',
      html: '<div class="swal-loading-content"><div class="swal-spinner"></div><p>Estamos procesando tu ruta, esto toma unos segundos...</p></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false
    });

    this.saving = true;
    this.error = '';
    const request$ = this.rutaService.crearRutaPorShape(payload);

    request$.subscribe({
      next: (res) => {
        this.saving = false;

        // Mensaje de éxito con microcopia amigable
        Swal.fire({
          title: '✨ ¡Ruta creada exitosamente!',
          text: `"${this.nombreRuta}" ya está lista para usar. Tu ruta está guardada y aparecerá en el panel de la izquierda.`,
          icon: 'success',
          confirmButtonColor: '#2dcecc',
          confirmButtonText: 'Perfecto',
          timer: 4000,
          timerProgressBar: true
        });

        this.limpiarMapa();
        this.loadRutas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;

        // Mensaje de error con microcopia amigable
        const errorMsg = err?.error?.message || 'Parece que hubo un problema al guardar.';
        Swal.fire({
          title: 'Oops, algo salió mal',
          text: `No pudimos guardar la ruta en este momento. Razón: ${errorMsg}. Intenta de nuevo en unos momentos.`,
          icon: 'error',
          confirmButtonColor: '#2dcecc',
          confirmButtonText: 'Intentar de nuevo'
        });

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
        this.rutasState.setRutas(this.rutas);
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

  private renderHoveredRoute(ruta: Ruta | null): void {
    if (!this.map || !this.map.getContainer() || !L_instance) {
      return; // Mapa no inicializado aún
    }
    const L = L_instance;

    if (this.hoverLayer) {
      this.map.removeLayer(this.hoverLayer);
      this.hoverLayer = null;
    }

    if (!ruta) return;

    // Si la ruta en hover es la misma que la seleccionada, no la dibujamos doble
    const selected = this.rutasState.selectedRuta();
    if (selected && this.getRutaId(selected) === this.getRutaId(ruta)) return;

    const shapeObj = this.getShapeObject(ruta);
    if (shapeObj) {
      const color = this.getRutaColor(ruta);
      this.hoverLayer = L.geoJSON(shapeObj as any, {
        style: {
          color: color,
          weight: 7,
          opacity: 0.4
        }
      }).addTo(this.map);
    }
  }

  private renderSelectedRoute(ruta: Ruta | null): void {
    if (!this.map || !this.map.getContainer() || !L_instance) {
      return; // Mapa no inicializado aún
    }
    const L = L_instance;

    if (this.selectedLayer) {
      this.map.removeLayer(this.selectedLayer);
      this.selectedLayer = null;
    }

    if (!ruta) {
      // Si no hay seleccionada pero sí en proceso de creación, no hacemos fitBounds
      if (this.routeCoords.length > 0 && this.polyline) {
        const bounds = this.polyline.getBounds();
        if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    const shapeObj = this.getShapeObject(ruta);
    if (shapeObj) {
      const color = this.getRutaColor(ruta);
      this.selectedLayer = L.geoJSON(shapeObj as any, {
        style: {
          color: color,
          weight: 6,
          opacity: 1
        }
      }).addTo(this.map);

      const bounds = this.selectedLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
      }

      // Limpiar marcadores y polilínea de creación si se selecciona una ruta
      this.routeCoords = [];
      this.polyline.setLatLngs([]);
      this.markers.forEach((marker) => this.map.removeLayer(marker));
      this.markers = [];
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
