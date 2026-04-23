import { Injectable, computed, signal } from '@angular/core';
import { Ruta } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class RutasStateService {
  // Estado principal
  private _rutas = signal<Ruta[]>([]);
  private _searchQuery = signal<string>('');
  
  // Elementos interactivos
  private _selectedRuta = signal<Ruta | null>(null);
  private _hoveredRuta = signal<Ruta | null>(null);

  // Computados
  rutas = this._rutas.asReadonly();
  searchQuery = this._searchQuery.asReadonly();
  selectedRuta = this._selectedRuta.asReadonly();
  hoveredRuta = this._hoveredRuta.asReadonly();

  rutasFiltradas = computed(() => {
    const query = this._searchQuery().toLowerCase().trim();
    const todas = this._rutas();
    
    if (!query) return todas;
    
    return todas.filter(ruta => {
      const r = ruta as any;
      const nombre = String(r['nombre_ruta'] ?? r['nombre_sector'] ?? '').toLowerCase();
      return nombre.includes(query);
    });
  });

  // Acciones
  setRutas(rutas: Ruta[]) {
    this._rutas.set(rutas);
    // Limpiar selección si la ruta seleccionada ya no existe
    const currentSelected = this._selectedRuta();
    if (currentSelected && !rutas.find(r => this.getId(r) === this.getId(currentSelected))) {
      this._selectedRuta.set(null);
    }
  }

  setSearchQuery(query: string) {
    this._searchQuery.set(query);
  }

  selectRuta(ruta: Ruta | null) {
    this._selectedRuta.set(ruta);
  }

  setHoveredRuta(ruta: Ruta | null) {
    this._hoveredRuta.set(ruta);
  }

  private getId(ruta: Ruta): any {
    const r = ruta as any;
    return r['id_ruta'] ?? r['id'];
  }
}
