import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

interface StatData {
  total: number;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  userName = signal<string>('Usuario');
  isLoading = signal<boolean>(true);

  usuarios = signal<number>(0);
  vehiculos = signal<number>(0);
  asignaciones = signal<number>(0);
  reportes = signal<number>(0);
  rutas = signal<number>(0);
  tripulaciones = signal<number>(0);

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
      rutas: this.http.get<any>(`${this.apiUrl}/api/rutas`, { headers }),
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
}
