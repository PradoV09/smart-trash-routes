import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

interface RutaDelDia {
  nombre: string;
  vehiculo: string;
  conductor: string;
  estado: 'sin_asignar' | 'pendiente' | 'en_progreso' | 'completada';
  horaEstimada: string;
}

interface UsuarioActivo {
  nombre: string;
  iniciales: string;
  rol: string;
  online: boolean;
  ultimaActividad: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  userName = signal<string>('Usuario');
  isLoading = signal<boolean>(true);
  currentDate = signal<Date>(new Date());

  usuarios = signal<number>(0);
  vehiculos = signal<number>(0);
  asignaciones = signal<number>(0);
  reportes = signal<number>(0);
  rutas = signal<number>(0);
  tripulaciones = signal<number>(0);

  // Status subtitles for KPIs
  rutasStatus = computed(() => {
    const count = this.rutas();
    if (count === 0) return { text: 'Sin rutas definidas', type: 'warning' };
    if (count < 5) return { text: `${count} rutas configuradas`, type: 'info' };
    return { text: 'Operación activa', type: 'success' };
  });

  vehiculosStatus = computed(() => {
    const count = this.vehiculos();
    if (count === 0) return { text: 'Sin vehículos aún', type: 'warning' };
    if (count < 3) return { text: `${count} disponible${count > 1 ? 's' : ''}`, type: 'info' };
    return { text: 'Flota operativa', type: 'success' };
  });

  usuariosStatus = computed(() => {
    const count = this.usuarios();
    if (count <= 1) return { text: 'Solo admin registrado', type: 'warning' };
    if (count < 5) return { text: `${count} usuarios activos`, type: 'info' };
    return { text: 'Equipo completo', type: 'success' };
  });

  // Rutas del dia from API
  rutasDelDia = signal<RutaDelDia[]>([]);

  // Active users
  usuariosActivos = signal<UsuarioActivo[]>([
    {
      nombre: 'Administrador',
      iniciales: 'AD',
      rol: 'Admin del sistema',
      online: true,
      ultimaActividad: 'Ahora mismo'
    }
  ]);

  soloAdminActivo = computed(() => this.usuariosActivos().length <= 1);

  ngOnInit() {
    this.userName.set(this.authService.getUserName());
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    const token = this.authService.getToken();

    if (!token) {
      this.isLoading.set(false);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const requests = {
      usuarios: this.http.get<any>(`${this.apiUrl}/admin/usuarios`, { headers }),
      vehiculos: this.http.get<any>(`${this.apiUrl}/admin/vehiculos`, { headers }),
      asignaciones: this.http.get<any>(`${this.apiUrl}/admin/asignaciones`, { headers }),
      reportes: this.http.get<any>(`${this.apiUrl}/admin/reportes`, { headers }),
      rutas: this.http.get<any>(`${this.apiUrl}/rutas`, { headers }),
      tripulaciones: this.http.get<any>(`${this.apiUrl}/admin/tripulaciones`, { headers })
    };

    forkJoin(requests).subscribe({
      next: (res) => {
        this.usuarios.set(this.extractTotal(res.usuarios));
        this.vehiculos.set(this.extractTotal(res.vehiculos));
        this.asignaciones.set(this.extractTotal(res.asignaciones));
        this.reportes.set(this.extractTotal(res.reportes));
        this.rutas.set(this.extractTotal(res.rutas));
        this.tripulaciones.set(this.extractTotal(res.tripulaciones));

        // Procesar asignaciones para la tabla de rutas del día
        const asignacionesData = Array.isArray(res.asignaciones) ? res.asignaciones : (res.asignaciones?.data || []);
        
        // Tomamos las últimas 6 asignaciones
        const recentAsignaciones = asignacionesData.slice(0, 6);
        
        const parsedRutas: RutaDelDia[] = recentAsignaciones.map((a: any) => {
          // Extraer nombre
          let nombre = `Ruta ${a.id_ruta || '?'}`;
          if (a.ruta && (a.ruta.nombre_sector || a.ruta.nombre_ruta)) {
            nombre = a.ruta.nombre_ruta || a.ruta.nombre_sector;
          }

          // Extraer vehículo
          let vehiculo = 'Sin asignar';
          if (a.vehiculo && a.vehiculo.placa) {
            vehiculo = a.vehiculo.modelo ? `${a.vehiculo.modelo} (${a.vehiculo.placa})` : `Vehículo ${a.vehiculo.placa}`;
          } else if (a.id_vehiculo) {
            vehiculo = `Vehículo #${a.id_vehiculo}`;
          }

          // Extraer conductor
          let conductor = '—';
          if (a.tripulacion) {
             if (Array.isArray(a.tripulacion)) {
                // Formato mock-db
                const driver = a.tripulacion.find((t: any) => String(t.rol).toLowerCase().includes('driver') || String(t.rol).toLowerCase().includes('conductor'));
                if (driver) conductor = driver.nombre || driver.username;
             } else if (a.tripulacion.miembros && Array.isArray(a.tripulacion.miembros)) {
                // Formato API real
                const driver = a.tripulacion.miembros.find((m: any) => m.rol_tripulacion === 'conductor');
                if (driver && driver.usuario) conductor = driver.usuario.nombre || driver.usuario.username;
             }
          }

          // Extraer estado
          let estado: 'sin_asignar' | 'pendiente' | 'en_progreso' | 'completada' = 'pendiente';
          const estadoRaw = String(a.estado || '').toLowerCase();
          if (estadoRaw.includes('curso') || estadoRaw.includes('progreso')) estado = 'en_progreso';
          else if (estadoRaw.includes('completada') || estadoRaw.includes('finalizada') || estadoRaw.includes('fin')) estado = 'completada';
          else if (estadoRaw.includes('sin') || !a.id_vehiculo) estado = 'sin_asignar';

          // Extraer hora estimada
          let horaEstimada = '—';
          if (a.fecha) {
             const d = new Date(a.fecha);
             if (!isNaN(d.getTime())) {
               horaEstimada = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
             } else {
               horaEstimada = a.fecha;
             }
          }

          return { nombre, vehiculo, conductor, estado, horaEstimada };
        });

        this.rutasDelDia.set(parsedRutas);
      },
      error: (err) => {
        console.error('Error cargando estadísticas', err);
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  private extractTotal(response: any): number {
    if (Array.isArray(response)) {
      return response.length;
    }

    if (typeof response?.data?.total === 'number') {
      return response.data.total;
    }

    if (Array.isArray(response?.data)) {
      return response.data.length;
    }

    return 0;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'sin_asignar': 'Sin asignar',
      'pendiente': 'Pendiente',
      'en_progreso': 'En progreso',
      'completada': 'Completada'
    };
    return labels[estado] || estado;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
