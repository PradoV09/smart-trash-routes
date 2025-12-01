import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [],
  templateUrl: './rutas.html',
  styleUrls: ['./rutas.css'],
})
export class Rutas implements AfterViewInit {
  private map: any;
  private routePoints: L.LatLng[] = [];
  private polyline: L.Polyline | null = null;

  constructor() {}

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
      this.polyline = L.polyline(this.routePoints, { color: 'blue' }).addTo(this.map);
    }
  }

  saveRoute(): void {
    console.log('Ruta guardada:', this.routePoints);
    // Aquí puedes añadir la lógica para guardar la ruta en tu backend
  }

  clearRoute(): void {
    this.routePoints = [];
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }
  }
}
