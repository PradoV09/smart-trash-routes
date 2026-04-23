import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { RutasStateService } from '../../../../services/rutas-state.service';
import { Ruta } from '../../../../models/interfaces';

@Component({
  selector: 'app-sidebar-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule, MatIconModule],
  templateUrl: './sidebar-rutas.html',
  styleUrl: './sidebar-rutas.css'
})
export class SidebarRutasComponent {
  public rutasState = inject(RutasStateService);

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.rutasState.setSearchQuery(target.value);
  }

  onRutaHover(ruta: Ruta) {
    this.rutasState.setHoveredRuta(ruta);
  }

  onRutaLeave() {
    this.rutasState.setHoveredRuta(null);
  }

  onRutaClick(ruta: Ruta) {
    const currentSelected = this.rutasState.selectedRuta();
    if (this.getId(currentSelected) === this.getId(ruta)) {
      this.rutasState.selectRuta(null); // Toggle selection
    } else {
      this.rutasState.selectRuta(ruta);
    }
  }

  isSelected(ruta: Ruta): boolean {
    const selected = this.rutasState.selectedRuta();
    if (!selected) return false;
    return this.getId(selected) === this.getId(ruta);
  }

  getRutaNombre(ruta: Ruta): string {
    const row = ruta as any;
    return String(row['nombre_ruta'] ?? row['nombre_sector'] ?? 'Ruta');
  }

  getRutaColor(ruta: Ruta): string {
    const row = ruta as any;
    return String(row['color_hex'] || '#2dcecc');
  }

  getCantidadPuntos(ruta: Ruta): number {
    const r = ruta as any;
    let shapeObj = r['shape'] ?? r['geometry'] ?? r['geojson'];
    if (typeof shapeObj === 'string') {
      try { shapeObj = JSON.parse(shapeObj); } catch { shapeObj = null; }
    }
    
    if (shapeObj && typeof shapeObj === 'object') {
      if (shapeObj.type === 'MultiLineString' && Array.isArray(shapeObj.coordinates)) {
        return shapeObj.coordinates.reduce((acc: number, line: any[]) => acc + (Array.isArray(line) ? line.length : 0), 0);
      } else if (shapeObj.type === 'LineString' && Array.isArray(shapeObj.coordinates)) {
        return shapeObj.coordinates.length;
      }
    }
    
    const legacy = r['puntos_geograficos'];
    if (typeof legacy === 'string') {
      try {
        const parsed = JSON.parse(legacy);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch { return 0; }
    }
    return 0;
  }

  private getId(ruta: Ruta | null): any {
    if (!ruta) return null;
    const r = ruta as any;
    return r['id_ruta'] ?? r['id'];
  }
}
