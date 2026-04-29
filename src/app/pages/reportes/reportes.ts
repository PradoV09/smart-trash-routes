import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { Reporte, ReporteTerminarPayload } from '../../models/interfaces';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent implements OnInit {
  baseUrl = environment.apiUrl;
  // Datos principales
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];

  // Estados de UI
  loading = false;
  error = '';
  submitting = false;

  // Modal de detalles
  selectedReporte: Reporte | null = null;
  showDetallesModal = false;

  // Modal de terminar
  showTerminarModal = false;
  notasTerminacion = '';

  // Filtros
  filtroEstado: 'todos' | 'baja' | 'media' | 'alta' = 'todos';
  mostrarSoloPendientes: boolean = false;
  busquedaAsunto: string = '';
  ordenarPorFecha: 'asc' | 'desc' = 'desc';

  // Debouncing para búsquedas
  private busquedaSubject = new Subject<string>();

  // Memoización de estadísticas
  private estadisticasCache: any = null;
  private reportesHashCache: string = '';

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef
  ) {
    // Configurar debounce para búsquedas
    this.busquedaSubject.pipe(debounceTime(300)).subscribe(() => {
      this.aplicarFiltros();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.cargarReportes();
  }

  // Cargar todos los reportes
  cargarReportes(): void {
    this.loading = true;
    this.error = '';

    this.reporteService.getReportes().subscribe({
      next: (data: any) => {
        // Mapear los datos para asegurar que 'estado' exista (usando u_rol_cache como fallback si es necesario)
        const rawReportes = Array.isArray(data) ? data : [];
        this.reportes = rawReportes.map((r: any) => ({
          ...r,
          estado: r.estado || r.u_rol_cache || 'baja'
        }));
        
        this.invalidarCacheEstadisticas();
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {

        if (typeof err === 'string' && err.includes('No hay token de autenticación')) {
          this.error = 'No estás autenticado. Por favor inicia sesión nuevamente.';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar al servidor. Verifica tu conexión a internet.';
        } else {
          this.error = 'Error al cargar los reportes: ' + (err.message || err.error?.message || 'Error desconocido');
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Aplicar todos los filtros
  aplicarFiltros(): void {
    let resultado = [...this.reportes];

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(reporte => reporte.estado === this.filtroEstado);
    }

    // Filtro por pendientes
    if (this.mostrarSoloPendientes) {
      resultado = resultado.filter(reporte => !reporte.terminado);
    }

    // Filtro por búsqueda en asunto
    if (this.busquedaAsunto.trim()) {
      const busqueda = this.busquedaAsunto.toLowerCase();
      resultado = resultado.filter(reporte =>
        reporte.asunto.toLowerCase().includes(busqueda)
      );
    }

    // Ordenamiento por fecha
    resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return this.ordenarPorFecha === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });

    this.reportesFiltrados = resultado;
  }

  // Métodos para filtros
  onFiltroEstadoChange(): void {
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  onMostrarSoloPendientesChange(): void {
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  onBusquedaChange(): void {
    // Usar debounce para búsquedas
    this.busquedaSubject.next(this.busquedaAsunto);
  }

  onOrdenarFechaChange(): void {
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  // Métodos para modales
  openDetallesModal(reporte: Reporte): void {
    this.selectedReporte = reporte;
    this.showDetallesModal = true;
    this.cdr.markForCheck();
  }

  closeDetallesModal(): void {
    this.showDetallesModal = false;
    this.selectedReporte = null;
    this.cdr.markForCheck();
  }

  openTerminarModal(reporte: Reporte): void {
    if (reporte.terminado) return;

    this.selectedReporte = reporte;
    this.notasTerminacion = '';
    this.showTerminarModal = true;
    this.cdr.markForCheck();
  }

  closeTerminarModal(): void {
    this.showTerminarModal = false;
    this.selectedReporte = null;
    this.notasTerminacion = '';
    this.cdr.markForCheck();
  }

  // Marcar reporte como terminado
  terminarReporte(): void {
    if (!this.selectedReporte) return;

    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      notas_terminacion: this.notasTerminacion.trim() || ""
    };

    this.reporteService.terminarReporte(this.selectedReporte.id_registro, payload).subscribe({
      next: (data: any) => {
        // Normalizar el reporte actualizado
        const updatedReporte = {
          ...data,
          estado: (data as any).estado || (data as any).u_rol_cache || 'baja'
        } as Reporte;

        // Actualizar el reporte en la lista
        const index = this.reportes.findIndex(r => r.id_registro === updatedReporte.id_registro);
        if (index !== -1) {
          this.reportes[index] = updatedReporte;
        }

        // Actualizar el reporte seleccionado si está en el modal de detalles
        if (this.selectedReporte && this.selectedReporte.id_registro === updatedReporte.id_registro) {
          this.selectedReporte = updatedReporte;
        }

        this.invalidarCacheEstadisticas();
        this.aplicarFiltros();
        this.closeTerminarModal();
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = 'Error al terminar el reporte: ' + (err.message || 'Error desconocido');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Métodos de utilidad
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'alta': return 'estado-alta';
      case 'media': return 'estado-media';
      case 'baja': return 'estado-baja';
      default: return 'estado-baja';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'alta': return 'badge-alta';
      case 'media': return 'badge-media';
      case 'baja': return 'badge-baja';
      default: return 'badge-baja';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Limpiar todos los filtros
  limpiarFiltros(): void {
    this.filtroEstado = 'todos';
    this.mostrarSoloPendientes = false;
    this.busquedaAsunto = '';
    this.ordenarPorFecha = 'desc';
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  // Obtener estadísticas con memoización
  getEstadisticas() {
    // Crear hash de reportes para detectar cambios
    const reportesHash = JSON.stringify(this.reportes);

    if (this.estadisticasCache && this.reportesHashCache === reportesHash) {
      return this.estadisticasCache;
    }

    const total = this.reportes.length;
    const pendientes = this.reportes.filter(r => !r.terminado).length;
    const completados = this.reportes.filter(r => r.terminado).length;
    const altaPrioridad = this.reportes.filter(r => r.estado === 'alta' && !r.terminado).length;

    this.estadisticasCache = { total, pendientes, completados, altaPrioridad };
    this.reportesHashCache = reportesHash;

    return this.estadisticasCache;
  }

  // TrackBy para optimizar ngFor
  trackByReporteId(index: number, reporte: Reporte): number {
    return reporte.id_registro;
  }

  // Invalidar cache de estadísticas
  private invalidarCacheEstadisticas(): void {
    this.estadisticasCache = null;
    this.reportesHashCache = '';
  }
}
