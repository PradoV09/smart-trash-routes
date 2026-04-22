// src/app/pages/asignaciones/asignaciones.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionesService } from '../../services/asignaciones.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { TripulacionService } from '../../services/tripulacion.service';
import { MatIconModule } from '@angular/material/icon';
import { Asignacion, Tripulacion, Vehiculo } from '../../models/interfaces';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './asignaciones.html',
  styleUrls: ['./asignaciones.css']
})
export class Asignaciones implements OnInit {
  private asignacionesService = inject(AsignacionesService);
  private vehiculoService = inject(VehiculoService);
  private tripulacionService = inject(TripulacionService);

  // List signals
  asignaciones = signal<Asignacion[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Form signals
  showForm = signal(false);
  saving = signal(false);
  vehicles = signal<Vehiculo[]>([]);
  routes = signal<any[]>([]);
  availableTeams = signal<Tripulacion[]>([]);

  newAsignacion = {
    id_vehiculo: null as number | null,
    id_ruta: null as string | null,
    id_tripulacion: null as number | null,
    fecha: ''
  };

  // Detail
  showDetail = signal(false);
  selectedAsignacion = signal<Asignacion | null>(null);
  loadingRutas = signal(false);

  ngOnInit() {
    this.loadAsignaciones();
    this.cargarRutas();
  }

  loadAsignaciones() {
    this.loading.set(true);
    this.error.set(null);
    this.asignacionesService.getAsignaciones().subscribe({
      next: (res: any) => {
        this.asignaciones.set(res.data || res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar las asignaciones.');
        this.loading.set(false);
      }
    });
  }

  cargarRutas() {
    this.loadingRutas.set(true);
    this.asignacionesService.getRutas().subscribe({
      next: (res: any) => {
        this.routes.set(res.data || res || []);
        this.loadingRutas.set(false);
      },
      error: () => this.loadingRutas.set(false)
    });
  }

  openCreateForm() {
    this.showForm.set(true);
    
    // Cargar vehículos disponibles
    this.vehiculoService.getVehiculos().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.vehicles.set(Array.isArray(data) ? data.filter(v => v.estado === 'disponible') : []);
      }
    });

    // Cargar equipos disponibles
    this.tripulacionService.getTripulaciones().subscribe({
      next: (res: any) => {
        this.availableTeams.set(res.data || res || []);
      }
    });
  }

  closeForm() {
    this.showForm.set(false);
    this.newAsignacion = { id_vehiculo: null, id_ruta: null, id_tripulacion: null, fecha: '' };
  }

  saveAsignacion() {
    if (!this.newAsignacion.id_vehiculo || !this.newAsignacion.id_ruta || !this.newAsignacion.id_tripulacion || !this.newAsignacion.fecha) {
      alert('Todos los campos son obligatorios, incluyendo la tripulación.');
      return;
    }
    this.saving.set(true);

    let isoDate = this.newAsignacion.fecha;
    if (isoDate.length === 16) isoDate += ':00';

    const payload = {
      id_vehiculo: Number(this.newAsignacion.id_vehiculo),
      id_ruta: String(this.newAsignacion.id_ruta),
      id_tripulacion: Number(this.newAsignacion.id_tripulacion),
      fecha: isoDate
    };

    this.asignacionesService.crearAsignacion(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadAsignaciones();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.detail || 'Error al crear la asignación.');
      }
    });
  }

  viewDetail(id: number) {
    this.loading.set(true);
    this.asignacionesService.getAsignacionById(id).subscribe({
      next: (res: any) => {
        this.selectedAsignacion.set(res.data || res);
        this.showDetail.set(true);
        this.loading.set(false);
      },
      error: () => {
        alert('Error al cargar el detalle');
        this.loading.set(false);
      }
    });
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selectedAsignacion.set(null);
  }

  cancelAsignacion(id: number) {
    if (!confirm('¿Estás seguro de cancelar esta asignación?')) return;
    this.asignacionesService.cancelarAsignacion(id).subscribe({
      next: () => {
        this.loadAsignaciones();
        if (this.showDetail()) this.closeDetail();
      }
    });
  }

  getStatusClass(status: string) {
    if (!status) return 'badge-muted';
    const s = status.toLowerCase();
    if (s.includes('pend')) return 'badge-warning';
    if (s.includes('curso')) return 'badge-info';
    if (s.includes('completada')) return 'badge-success';
    if (s.includes('cancelada')) return 'badge-danger';
    return 'badge-muted';
  }

  formatDate(iso: string) {
    if (!iso) return '-';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }
}
