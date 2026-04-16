import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rutas.html',
  styleUrl: './rutas.css',
})
export class Rutas implements OnInit{
  map!: L.Map;
  routeCoords: [number, number][] = [];
  polyline!: L.Polyline;

  // Datos para el envío a la API
  nombreRuta: string = "";
  perfilId: string = "18851282-1a08-42b7-9384-243cc2ead349"; // Ejemplo

  ngOnInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map('map').setView([3.8898, -77.0782], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.polyline = L.polyline([], { color: '#2dcecc', weight: 5 }).addTo(this.map);

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
    L.circleMarker([lat, lng], { radius: 5, color: '#1a1a2e' }).addTo(this.map);
  }

  limpiarMapa() {
    this.routeCoords = [];
    this.polyline.setLatLngs([]);
    // Aquí podrías agregar lógica para remover los circleMarkers
  }

  enviarRuta() {
    const payload = {
      nombre_ruta: this.nombreRuta,
      perfil_id: this.perfilId,
      shape: {
        type: "LineString",
        coordinates: this.routeCoords
      }
    };
    console.log("Enviando a API /api/rutas:", payload);
    // Aquí llamarías a tu servicio HTTP
  }
}
