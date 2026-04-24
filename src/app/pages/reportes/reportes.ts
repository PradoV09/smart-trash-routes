import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { Reporte, ReporteTerminarPayload } from '../../models/interfaces';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class ReportesComponent implements OnInit {
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

  constructor(private reporteService: ReporteService) { }

  ngOnInit(): void {
    this.cargarReportes();
  }

  // Cargar todos los reportes
  cargarReportes(): void {
    this.loading = true;
    this.error = '';

    this.reporteService.getReportes().subscribe({
      next: (data) => {
        this.reportes = Array.isArray(data) ? data : [];
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('[ReportesComponent] Error al cargar reportes:', err);

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
  }

  onMostrarSoloPendientesChange(): void {
    this.aplicarFiltros();
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onOrdenarFechaChange(): void {
    this.aplicarFiltros();
  }

  // Métodos para modales
  openDetallesModal(reporte: Reporte): void {
    this.selectedReporte = reporte;
    this.showDetallesModal = true;
  }

  closeDetallesModal(): void {
    this.showDetallesModal = false;
    this.selectedReporte = null;
  }

  openTerminarModal(reporte: Reporte): void {
    if (reporte.terminado) return;

    this.selectedReporte = reporte;
    this.notasTerminacion = '';
    this.showTerminarModal = true;
  }

  closeTerminarModal(): void {
    this.showTerminarModal = false;
    this.selectedReporte = null;
    this.notasTerminacion = '';
  }

  // Marcar reporte como terminado
  terminarReporte(): void {
    if (!this.selectedReporte) return;

    this.submitting = true;

    const payload: ReporteTerminarPayload = {
      notas_terminacion: this.notasTerminacion.trim() || undefined
    };

    this.reporteService.terminarReporte(this.selectedReporte.id_registro, payload).subscribe({
      next: (updatedReporte) => {
        // Actualizar el reporte en la lista
        const index = this.reportes.findIndex(r => r.id_registro === updatedReporte.id_registro);
        if (index !== -1) {
          this.reportes[index] = updatedReporte;
        }

        // Actualizar el reporte seleccionado si está en el modal de detalles
        if (this.selectedReporte && this.selectedReporte.id_registro === updatedReporte.id_registro) {
          this.selectedReporte = updatedReporte;
        }

        this.aplicarFiltros();
        this.closeTerminarModal();
        this.submitting = false;
      },
      error: (err) => {
        this.error = 'Error al terminar el reporte: ' + (err.message || 'Error desconocido');
        this.submitting = false;
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
  }

  // Obtener estadísticas
  getEstadisticas() {
    const total = this.reportes.length;
    const pendientes = this.reportes.filter(r => !r.terminado).length;
    const completados = this.reportes.filter(r => r.terminado).length;
    const altaPrioridad = this.reportes.filter(r => r.estado === 'alta' && !r.terminado).length;

    return { total, pendientes, completados, altaPrioridad };
  }
}
