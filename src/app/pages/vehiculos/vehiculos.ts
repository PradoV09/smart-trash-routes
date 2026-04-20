import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EstadoVehiculo, Vehiculo, VehiculoWritePayload } from '../../models/interfaces';
import { VehiculoService } from '../../services/vehiculo.service';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private readonly PLACA_REGEX = /^[A-Z]{3}[0-9]{3}$/;

  vehiculos = signal<Vehiculo[]>([]);
  loading = signal(false);
  error = signal('');
  saving = signal(false);
  deletingId = signal<number | null>(null);

  showForm = false;
  editingId: number | null = null;
  /** capacidad vacía = no enviar (opcional en backend). */
  formData: {
    placa: string;
    modelo: string;
    capacidad_m3: string;
    estado: EstadoVehiculo;
  } = {
    placa: '',
    modelo: '',
    capacidad_m3: '',
    estado: 'disponible'
  };

  ngOnInit(): void {
    this.loadVehiculos();
  }

  loadVehiculos(): void {
    this.loading.set(true);
    this.error.set('');
    this.vehiculoService.getVehiculos().subscribe({
      next: (res) => {
        this.vehiculos.set(this.extractArray<Vehiculo>(res).map((v) => this.normalizeVehiculo(v)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los vehículos.');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.formData = {
      placa: '',
      modelo: '',
      capacidad_m3: '',
      estado: 'disponible'
    };
    this.showForm = true;
  }

  openEditForm(vehiculo: Vehiculo): void {
    this.editingId = vehiculo.id_vehiculo;
    this.formData = {
      placa: vehiculo.placa,
      modelo: vehiculo.modelo ?? '',
      capacidad_m3:
        vehiculo.capacidad_m3 != null && !Number.isNaN(Number(vehiculo.capacidad_m3))
          ? String(vehiculo.capacidad_m3)
          : '',
      estado: vehiculo.estado
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveVehiculo(): void {
    const placaNormalizada = this.normalizePlaca(this.formData.placa);
    const modeloTrim = this.formData.modelo.trim();

    if (!placaNormalizada) {
      this.error.set('La placa es obligatoria.');
      return;
    }

    if (!this.PLACA_REGEX.test(placaNormalizada)) {
      this.error.set('La placa debe tener formato ABC123 (3 letras y 3 numeros).');
      return;
    }

    if (modeloTrim.length > 50) {
      this.error.set('El modelo admite como maximo 50 caracteres.');
      return;
    }

    const capacidadStr = String(this.formData.capacidad_m3 ?? '').trim();
    let capacidadNum: number | undefined;
    if (capacidadStr !== '') {
      capacidadNum = Number(capacidadStr.replace(',', '.'));
      if (Number.isNaN(capacidadNum) || capacidadNum <= 0) {
        this.error.set('Si indicas capacidad, debe ser un numero mayor a 0.');
        return;
      }
    }

    this.saving.set(true);
    this.error.set('');

    const payload = this.buildVehiculoPayload(placaNormalizada, modeloTrim, capacidadNum, this.formData.estado);

    const request$ = this.editingId
      ? this.vehiculoService.updateVehiculo(this.editingId, payload)
      : this.vehiculoService.createVehiculo(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm = false;
        this.editingId = null;
        this.loadVehiculos();
      },
      error: (err: HttpErrorResponse) => {
        const fallback = this.editingId
          ? 'No se pudo actualizar el vehículo.'
          : 'No se pudo crear el vehículo.';
        this.error.set(this.getApiErrorMessage(err, fallback));
        this.saving.set(false);
      }
    });
  }

  onPlacaChange(value: string): void {
    this.formData.placa = this.normalizePlaca(value);
  }

  deleteVehiculo(vehiculo: Vehiculo): void {
    if (!confirm(`Eliminar vehículo "${vehiculo.placa}"?`)) {
      return;
    }

    this.deletingId.set(vehiculo.id_vehiculo);
    this.error.set('');
    this.vehiculoService.deleteVehiculo(vehiculo.id_vehiculo).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadVehiculos();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.getApiErrorMessage(err, 'No se pudo eliminar el vehículo.'));
        this.deletingId.set(null);
      }
    });
  }

  getEstadoClass(estado: EstadoVehiculo): string {
    if (estado === 'disponible') return 'badge-success';
    if (estado === 'en_ruta') return 'badge-warning';
    if (estado === 'mantenimiento') return 'badge-danger';
    return 'badge-muted';
  }

  formatCapacidad(v: Vehiculo): string {
    if (v.capacidad_m3 == null || Number.isNaN(Number(v.capacidad_m3))) return '-';
    return `${v.capacidad_m3} m³`;
  }

  /** Texto corto para columna id_externo (UUID de API externa). */
  labelIdExterno(v: Vehiculo): string {
    const id = v.id_externo;
    if (!id) return '-';
    return id.length > 14 ? `${id.slice(0, 8)}…` : id;
  }

  private buildVehiculoPayload(
    placa: string,
    modelo: string,
    capacidad: number | undefined,
    estado: EstadoVehiculo
  ): VehiculoWritePayload {
    const out: VehiculoWritePayload = {
      placa,
      estado
    };
    if (modelo.length > 0) {
      out.modelo = modelo;
    }
    if (capacidad !== undefined) {
      out.capacidad_m3 = capacidad;
    }
    return out;
  }

  private normalizeVehiculo(raw: any): Vehiculo {
    const id = Number(raw?.id_vehiculo ?? raw?.id);
    return {
      id_vehiculo: id,
      placa: String(raw?.placa ?? ''),
      modelo: raw?.modelo ?? null,
      capacidad_m3: raw?.capacidad_m3 != null ? Number(raw.capacidad_m3) : null,
      estado: (raw?.estado ?? 'disponible') as EstadoVehiculo,
      id_externo: raw?.id_externo ?? null,
      datos_api_externo: raw?.datos_api_externo ?? null
    };
  }

  private extractArray<T>(response: T[] | { data?: T[] | unknown }): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) {
      return data as T[];
    }
    return [];
  }

  private normalizePlaca(value: string): string {
    return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  private getApiErrorMessage(err: HttpErrorResponse, fallback: string): string {
    const detail = err?.error?.error?.details ?? err?.error?.detail ?? err?.error?.message;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return String(first.msg);
    }
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    return fallback;
  }
}
