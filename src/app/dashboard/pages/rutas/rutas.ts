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
export class Rutas implements OnInit, AfterViewInit {
  private map: any;
  public routePoints: L.LatLng[] = [];
  private polyline: L.Polyline | null = null;
  private otherPolylines: L.Polyline[] = [];
  private tempMarkers: L.CircleMarker[] = [];
  public rutasGuardadas: Ruta[] = [];
  public isLoading = false;
  public isSaving = false;
  public errorMessage = '';
  public successMessage = '';
  private rutasService = inject(RutasService);
  private http = inject(HttpClient);

  ngOnInit(): void {
    // Cargar rutas antes de inicializar el mapa
    this.cargarRutasGuardadas();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  private initMap(): void {
    this.map = L.map('map').setView([3.883, -77.067], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    this.routePoints.push(e.latlng);
    this.drawPolyline();
  }

  private drawPolyline(): void {
    if (this.polyline) {
      this.polyline.setLatLngs(this.routePoints);
    } else {
      this.polyline = L.polyline(this.routePoints, { color: 'blue', weight: 3 }).addTo(this.map);
    }
  }

  saveRoute(): void {
    const nombre = prompt('Introduce el nombre de la ruta:');
    if (!nombre) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preguntar al usuario si desea crear la ruta a partir de puntos del mapa
    // o introducir IDs de calles manualmente.
    const useMap = this.routePoints.length > 0 && confirm('¿Deseas crear la ruta usando los puntos del mapa? Pulsa "Cancelar" para introducir `calles_ids` manualmente.');

    if (useMap) {
      // Generar IDs placeholder a partir de puntos del mapa
      const calles_ids = this.routePoints.map((_, index) => `calle_${index}`);

      // No enviar placeholders por defecto: podrían no existir en backend y causar errores.
      const proceedWithPlaceholders = confirm('Los IDs generados para las calles son placeholders y pueden no existir en el backend, lo que puede provocar errores (500). ¿Deseas continuar de todos modos?');
      if (!proceedWithPlaceholders) {
        this.isSaving = false;
        alert('Operación cancelada. Introduce `calles_ids` reales para crear la ruta.');
        return;
      }

      const nuevaRuta: Ruta = {
        nombre_ruta: nombre.trim(),
        calles_ids: calles_ids,
        coordenadas: this.routePoints.map(p => ({ lat: p.lat, lng: p.lng }))
      };

      this.rutasService.crearRuta(nuevaRuta).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.successMessage = `✓ Ruta "${nombre}" guardada exitosamente`;
          console.log('Ruta guardada (con coords/placeholders):', response);
          setTimeout(() => { this.cargarRutasGuardadas(); this.clearRoute(); this.successMessage = ''; }, 1200);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error saving ruta (with coords/placeholders):', err);
          // Mostrar mensaje más informativo
          const serverMsg = err.error?.message || JSON.stringify(err.error) || err.statusText || 'Error desconocido';
          this.errorMessage = `✗ Error al guardar la ruta: ${serverMsg} (status ${err.status || 'N/A'})`;
          setTimeout(() => { this.errorMessage = ''; }, 5000);
        }
      });
      return;
    }

    // Si no usa el mapa, solicitamos una lista de `calles_ids` separadas por comas
    const callesInput = prompt('Introduce los IDs de calles separados por comas (ej: id1,id2,id3):');
    if (!callesInput) {
      this.isSaving = false;
      return;
    }

    const calles_ids = callesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (calles_ids.length === 0) {
      this.isSaving = false;
      alert('No se proporcionaron `calles_ids` válidos.');
      return;
    }

    // Validar formato UUID simple para cada calles_id. Si alguno no coincide, pedir confirmación.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = calles_ids.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      const confirmProceed = confirm(`Se detectaron IDs no-UUID: ${invalidIds.join(', ')}. Esto puede provocar errores en el servidor. ¿Deseas continuar de todos modos?`);
      if (!confirmProceed) {
        this.isSaving = false;
        return;
      }
    }

    const payload = { nombre_ruta: nombre.trim(), calles_ids };
    this.rutasService.crearRutaPayload(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = `✓ Ruta "${nombre}" guardada exitosamente`;
        console.log('Ruta guardada (payload):', response);
        setTimeout(() => { this.cargarRutasGuardadas(); this.successMessage = ''; }, 1200);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = `✗ Error al guardar la ruta: ${err.error?.message || err.statusText}`;
        console.error('Error saving ruta (payload):', err);
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }
    });
  }

  clearRoute(): void {
    this.routePoints = [];
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }
    // also clear any other polylines/markers shown
    this.clearAllDisplayed();
  }

  // Quitar todas las polilíneas temporales y markers añadidos por verTodasRutas
  clearAllDisplayed(): void {
    if (this.otherPolylines && this.otherPolylines.length > 0) {
      this.otherPolylines.forEach(p => { try { this.map.removeLayer(p); } catch (e) {} });
      this.otherPolylines = [];
    }
    if (this.tempMarkers && this.tempMarkers.length > 0) {
      this.tempMarkers.forEach(m => { try { this.map.removeLayer(m); } catch (e) {} });
      this.tempMarkers = [];
    }
  }

  cargarRutasGuardadas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rutasService.obtenerRutas().subscribe({
      next: (rutas: Ruta[]) => {
        this.isLoading = false;
        this.rutasGuardadas = rutas || [];
        console.log(`✅ ${rutas.length} rutas cargadas desde el backend`);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error completo:', err);
        
        let errorMsg = 'Error al cargar rutas';
        if (err.status === 401) {
          errorMsg = '🔐 No autorizado (401) - Verifica que el token sea válido';
        } else if (err.status === 403) {
          errorMsg = '🚫 Acceso denegado (403) - Necesitas rol ADMIN';
        } else if (err.status === 404) {
          errorMsg = '❌ Endpoint no encontrado (404)';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.statusText) {
          errorMsg = err.statusText;
        }
        
        this.errorMessage = errorMsg;
        console.error('❌ Error al cargar rutas:', this.errorMessage);
        this.rutasGuardadas = [];
        
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  verRuta(ruta: Ruta): void {
    // Si la ruta no tiene coordenadas almacenadas, no podemos mostrarla
    if (!ruta.coordenadas || ruta.coordenadas.length === 0) {
      alert(`La ruta "${ruta.nombre_ruta}" no tiene coordenadas disponibles. Revisa el backend.`);
      return;
    }

    console.log('🗺️ Ver ruta:', ruta.id, ruta.nombre_ruta, 'coordenadas:', ruta.coordenadas.length);

    this.clearRoute();
    this.routePoints = ruta.coordenadas.map((c: { lat: number; lng: number }) => L.latLng(c.lat, c.lng));

    // elegir color determinístico según id para ayudar a distinguir rutas
    const color = this.colorFromString(ruta.id || ruta.nombre_ruta || 'default');
    if (this.polyline) {
      this.polyline.setStyle({ color });
      this.polyline.setLatLngs(this.routePoints);
    } else {
      this.polyline = L.polyline(this.routePoints, { color: color, weight: 4 }).addTo(this.map);
    }

    // añadir marcador en el primer punto para referencia visual
    if (this.routePoints.length > 0) {
      const first = this.routePoints[0];
      const marker = L.circleMarker(first, { radius: 5, color: '#222', fillColor: color, fillOpacity: 0.9 }).addTo(this.map);
      marker.bindPopup(`<b>${ruta.nombre_ruta}</b>`).openPopup();
      // quitar el marcador después de 6s para no acumular
      setTimeout(() => { this.map.removeLayer(marker); }, 6000);
    }

    if (this.polyline && this.map) {
      const bounds = this.polyline.getBounds();
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  verTodasRutas(): void {
    if (!this.rutasGuardadas || this.rutasGuardadas.length === 0) {
      alert('No hay rutas para mostrar');
      return;
    }

    // limpiar lo mostrado antes
    this.clearRoute();

    const allBounds = [] as L.LatLng[];

    this.rutasGuardadas.forEach(ruta => {
      if (!ruta.coordenadas || ruta.coordenadas.length === 0) return;
      const latlngs = ruta.coordenadas.map(c => L.latLng(c.lat, c.lng));
      const color = this.colorFromString(ruta.id || ruta.nombre_ruta || 'r');
      const pl = L.polyline(latlngs, { color, weight: 3, opacity: 0.8 }).addTo(this.map);
      this.otherPolylines.push(pl);

      // opcional: marcador pequeño con nombre en el primer punto
      const first = latlngs[0];
      const marker = L.circleMarker(first, { radius: 4, color: '#222', fillColor: color, fillOpacity: 0.9 }).addTo(this.map);
      marker.bindTooltip(ruta.nombre_ruta, { permanent: false, direction: 'top' });
      this.tempMarkers.push(marker);

      allBounds.push(...latlngs);
    });

    if (allBounds.length > 0) {
      const group = L.featureGroup([...this.otherPolylines]);
      try {
        this.map.fitBounds(group.getBounds(), { padding: [40, 40] });
      } catch (e) {
        // fallback: fit to first point
        this.map.setView(allBounds[0], 13);
      }
    }
  }

  // Genera un color hex a partir de una cadena (hash simple)
  private colorFromString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // convertir a 32bit
    }
    const r = (hash >> 16) & 0xff;
    const g = (hash >> 8) & 0xff;
    const b = hash & 0xff;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
