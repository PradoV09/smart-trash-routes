import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TripulacionService } from '../../services/tripulacion.service';
import { UsuarioService } from '../../services/usuario.service';
import { TripulacionMiembro, Usuario } from '../../models/interfaces';
import { finalize, map } from 'rxjs';

@Component({
  selector: 'app-tripulacion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tripulacion.html',
  styleUrls: ['./tripulacion.css']
})
export class TripulacionPage implements OnInit {
  private tripulacionService = inject(TripulacionService);
  private usuarioService = inject(UsuarioService);

  // Signals para el estado
  idAsignacion = signal<number | null>(null);
  tripulacion = signal<TripulacionMiembro[]>([]);
  allUsers = signal<Usuario[]>([]);
  loading = signal<boolean>(false);
  tripulacionLoaded = signal<boolean>(false);

  // Form signals
  selectedUserId = signal<number>(0);
  selectedRol = signal<string>('');

  // Estados derivados (Signals computados)
  totalMiembros = computed(() => this.tripulacion().length);
  
  conductores = computed(() => 
    this.tripulacion().filter(m => m.rol_tripulacion === 'conductor').length
  );
  
  recolectores = computed(() => 
    this.tripulacion().filter(m => m.rol_tripulacion === 'recolector').length
  );

  puedeAgregar = computed(() => this.totalMiembros() < 4);
  puedeAgregarConductor = computed(() => this.conductores() < 1);
  puedeAgregarRecolector = computed(() => this.recolectores() < 3);
  tripulacionCompleta = computed(() => this.totalMiembros() === 4);

  // Usuarios disponibles (no están ya en la tripulación)
  availableUsers = computed(() => {
    const tripulacionIds = this.tripulacion().map(m => m.id_usuario);
    return this.allUsers().filter(u => !tripulacionIds.includes(u.id_usuario));
  });

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (users) => this.allUsers.set(users),
      error: (err: any) => {}
    });
  }

  cargarTripulacion() {
    const id = this.idAsignacion();
    if (!id) return;

    this.loading.set(true);
    this.tripulacionService.getTripulacion(id)
      .pipe(
        map(res => res.data), // Extraer la data del SuccessResponse
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data: TripulacionMiembro[]) => {
          this.tripulacion.set(data);
          this.tripulacionLoaded.set(true);
        },
        error: (err: any) => {
          alert('No se pudo cargar la tripulación. Verifique el ID de asignación.');
          this.tripulacionLoaded.set(false);
        }
      });
  }

  agregarMiembro() {
    const idAsig = this.idAsignacion();
    const idUser = this.selectedUserId();
    const rol = this.selectedRol();

    if (!idAsig || !idUser || !rol) return;

    // Validaciones locales adicionales
    if (rol === 'conductor' && !this.puedeAgregarConductor()) {
      alert('Ya existe un conductor asignado.');
      return;
    }
    if (rol === 'recolector' && !this.puedeAgregarRecolector()) {
      alert('Ya existen 3 recolectores asignados.');
      return;
    }

    this.loading.set(true);
    this.tripulacionService.addMiembro(idAsig, { id_usuario: idUser, rol_tripulacion: rol })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.cargarTripulacion();
          this.selectedUserId.set(0);
          this.selectedRol.set('');
        },
        error: (err: any) => {
          const errorMsg = err.error?.detail || 'Error al agregar miembro. Verifique las reglas de negocio.';
          alert(errorMsg);
        }
      });
  }

  eliminarMiembro(miembro: TripulacionMiembro) {
    // Regla UX inteligente: NO permitir eliminar si rompe la estructura crítica
    if (miembro.rol_tripulacion === 'conductor' && this.conductores() === 1) {
      if (!confirm('Esta es el único conductor. Eliminarlo dejará la asignación inválida. ¿Continuar?')) {
        return;
      }
    } else if (miembro.rol_tripulacion === 'recolector' && this.recolectores() === 3 && this.tripulacionCompleta()) {
       if (!confirm('Esto puede invalidar la estructura de la tripulación. ¿Seguro que quieres eliminar este miembro?')) {
        return;
      }
    } else {
      if (!confirm('¿Seguro que quieres eliminar este miembro?')) {
        return;
      }
    }

    const idAsig = this.idAsignacion();
    if (!idAsig) return;

    this.loading.set(true);
    this.tripulacionService.removeMiembro(idAsig, miembro.id_usuario)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.cargarTripulacion(),
        error: (err: any) => {
          alert('No se pudo eliminar el miembro.');
        }
      });
  }
}
