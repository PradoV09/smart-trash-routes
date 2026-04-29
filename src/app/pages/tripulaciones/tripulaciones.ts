import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripulacionService } from '../../services/tripulacion.service';
import { UsuarioService } from '../../services/usuario.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Tripulacion, Usuario } from '../../models/interfaces';

@Component({
  selector: 'app-tripulaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="admin-container">
      <div class="view-header">
        <div class="header-title">
          <h1>Gestión de Equipos (Tripulaciones)</h1>
          <p class="text-muted">Crea equipos de trabajo (1 conductor + 3 recolectores) para asignar a las rutas.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-muted" (click)="irAAsignaciones()">
            <mat-icon>assignment</mat-icon>
            Asignaciones
          </button>
          <button class="btn btn-primary" (click)="openForm()">
            <mat-icon>group_add</mat-icon>
            Nuevo Equipo
          </button>
        </div>
      </div>

      <div class="admin-card" *ngIf="loading()">
        <div class="text-center py-5">
          <div class="loader"></div>
          <p>Cargando equipos...</p>
        </div>
      </div>

      <div class="grid-container" *ngIf="!loading() && tripulaciones().length > 0">
        <div class="team-card" *ngFor="let t of tripulaciones()">
          <div class="team-header">
            <h3>{{ t.nombre || 'Equipo sin nombre' }}</h3>
            <span class="team-id">ID: #{{ t.id_tripulacion }}</span>
          </div>
          <div class="team-members">
            <div class="member-item" *ngFor="let m of t.miembros">
              <mat-icon [color]="m.rol_tripulacion === 'conductor' ? 'primary' : ''">
                {{ m.rol_tripulacion === 'conductor' ? 'drive_eta' : 'person' }}
              </mat-icon>
              <div class="member-info">
                <span class="member-name">{{ m.usuario.username }}</span>
                <span class="member-role">{{ m.rol_tripulacion | titlecase }}</span>
              </div>
            </div>
          </div>
          <div class="team-footer">
            <small class="text-muted">Creado el {{ t.created_at | date:'short' }}</small>
          </div>
        </div>
      </div>

      <div *ngIf="!loading() && tripulaciones().length === 0" class="empty-state">
        <mat-icon class="empty-icon">group_off</mat-icon>
        <h2>No hay equipos creados</h2>
        <p>Crea tu primer equipo de trabajo para poder realizar asignaciones de rutas.</p>
        <button class="btn btn-primary mt-3" (click)="openForm()">
          <mat-icon>group_add</mat-icon>
          Crear mi primer equipo
        </button>
      </div>

      <!-- Create Modal -->
      <div class="modal-overlay" *ngIf="showForm()">
        <div class="modal-content animate-in wide-modal">
          <div class="modal-header">
            <h2>Crear Nuevo Equipo</h2>
            <button class="btn-icon" (click)="closeForm()"><mat-icon>close</mat-icon></button>
          </div>
          
          <div class="modal-body">
            <div class="form-group mb-4">
              <label>Nombre del Equipo (Opcional)</label>
              <input type="text" [(ngModel)]="newTeam.nombre" class="form-control" placeholder="Ej: Equipo Alfa, Turno Mañana...">
            </div>

            <div class="members-selection">
              <h4>Configuración de Miembros (Requerido: 1 Conductor + 3 Recolectores)</h4>
              
              <!-- Conductor -->
              <div class="selection-row">
                <div class="role-label">
                  <mat-icon color="primary">drive_eta</mat-icon>
                  <span>Conductor</span>
                </div>
                <select [(ngModel)]="newTeam.conductorId" class="form-control">
                  <option [ngValue]="null">Seleccionar Conductor</option>
                  <option *ngFor="let u of availableDrivers()" [ngValue]="u.id_usuario">
                    {{ u.username }} (ID: {{ u.id_usuario }})
                  </option>
                </select>
              </div>

              <!-- Recolectores -->
              <div class="selection-row" *ngFor="let i of [0, 1, 2]">
                <div class="role-label">
                  <mat-icon>person</mat-icon>
                  <span>Recolector {{ i + 1 }}</span>
                </div>
                <select [(ngModel)]="newTeam.recolectoresIds[i]" class="form-control">
                  <option [ngValue]="null">Seleccionar Recolector</option>
                  <option *ngFor="let u of availableCollectors()" [ngValue]="u.id_usuario">
                    {{ u.username }} (ID: {{ u.id_usuario }})
                  </option>
                </select>
              </div>
            </div>

            <div *ngIf="hasDuplicateUsers()" class="alert alert-danger mt-3">
              <mat-icon>warning</mat-icon>
              <span>No puedes asignar al mismo usuario más de una vez en el mismo equipo.</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-muted" (click)="closeForm()" [disabled]="saving()">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="saveTeam()" 
              [disabled]="!isTeamValid() || saving()"
            >
              <span *ngIf="!saving()">Crear Equipo Completo</span>
              <span *ngIf="saving()" class="loader-white"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 1.5rem; display: flex; flex-direction: column; height: 100%; overflow-y: auto; position: relative; }
    .view-header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .header-actions { display: flex; gap: 1rem; }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; flex: 1; padding: 0.5rem; }
    .grid-container::-webkit-scrollbar { width: 8px; }
    .grid-container::-webkit-scrollbar-track { background: transparent; }
    .grid-container::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
    .grid-container::-webkit-scrollbar-thumb:hover { background: #64748b; }
    
    .team-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .team-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }
    .team-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .team-id { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    
    .team-members { display: flex; flex-direction: column; gap: 0.75rem; }
    .member-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: #f8fafc; border-radius: 8px; }
    .member-info { display: flex; flex-direction: column; }
    .member-name { font-size: 0.9rem; font-weight: 600; color: #334155; }
    .member-role { font-size: 0.75rem; color: #64748b; }
    
    .wide-modal { max-width: 650px !important; }
    .members-selection { background: #f8fafc; padding: 1.5rem; border-radius: 12px; }
    .members-selection h4 { margin-top: 0; margin-bottom: 1.5rem; font-size: 0.9rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
    .selection-row { display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .role-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #475569; }
    
    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; }
    .alert-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 24px; width: 90%; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 12px; }
    .mb-4 { margin-bottom: 1rem; }
    .loader-white { width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class Tripulaciones implements OnInit {
  private tripulacionService = inject(TripulacionService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  tripulaciones = signal<Tripulacion[]>([]);
  loading = signal(false);
  showForm = signal(false);
  saving = signal(false);

  availableDrivers = signal<Usuario[]>([]);
  availableCollectors = signal<Usuario[]>([]);

  newTeam = {
    nombre: '',
    conductorId: null as number | null,
    recolectoresIds: [null, null, null] as (number | null)[]
  };

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.tripulacionService.getTripulaciones().subscribe({
      next: (res: any) => {
        this.tripulaciones.set(res.data || res || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openForm() {
    this.showForm.set(true);
    this.loadUsers();
  }

  loadUsers() {
    this.usuarioService.getUsuarios().subscribe((res: any) => {
      const all = res.data || res || [];
      // Drivers: id_rol 2. Collectors: id_rol 3. 
      // But we use the "non-admin" logic now, so let's just filter by rol name if available or id
      this.availableDrivers.set(all.filter((u: any) => u.id_rol === 2 || u.id_rol !== 1));
      this.availableCollectors.set(all.filter((u: any) => u.id_rol === 3 || u.id_rol !== 1));
    });
  }

  closeForm() {
    this.showForm.set(false);
    this.newTeam = { nombre: '', conductorId: null, recolectoresIds: [null, null, null] };
  }

  isTeamValid() {
    return this.newTeam.conductorId !== null &&
      this.newTeam.recolectoresIds.every(id => id !== null) &&
      !this.hasDuplicateUsers();
  }

  hasDuplicateUsers() {
    const ids = [this.newTeam.conductorId, ...this.newTeam.recolectoresIds].filter(id => id !== null);
    return new Set(ids).size !== ids.length;
  }

  saveTeam() {
    if (!this.isTeamValid()) return;
    this.saving.set(true);

    const payload = {
      nombre: this.newTeam.nombre || undefined,
      miembros: [
        { id_usuario: this.newTeam.conductorId, rol_tripulacion: 'conductor' },
        ...this.newTeam.recolectoresIds.map(id => ({ id_usuario: id, rol_tripulacion: 'recolector' }))
      ]
    };

    this.tripulacionService.crearTripulacion(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadAll();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.detail || 'Error al crear el equipo.');
      }
    });
  }

  irAAsignaciones() {
    this.router.navigate(['/asignaciones']);
  }
}
