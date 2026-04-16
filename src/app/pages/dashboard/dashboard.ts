import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface StatData {
  total: number;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  userName = signal<string>('');
  isLoading = signal<boolean>(true);

  usuarios = signal<number>(0);
  vehiculos = signal<number>(0);
  asignaciones = signal<number>(0);
  reportes = signal<number>(0);

  ngOnInit() {
    this.userName.set(this.authService.getUserName());
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    const token = this.authService.getToken() || '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Simulamos un leve retraso de red para observar el esqueleto de carga
    setTimeout(() => {
      // Como usamos archivos JSON locales, las rutas simulan la API
      this.http.get<any>('/api/admin/usuarios.json', { headers }).subscribe({
        next: (res) => this.usuarios.set(res.data.total),
        error: (err) => console.error('Error cargando usuarios', err)
      });

      this.http.get<any>('/api/admin/vehiculos.json', { headers }).subscribe({
        next: (res) => this.vehiculos.set(res.data.total),
        error: (err) => console.error('Error cargando vehiculos', err)
      });

      this.http.get<any>('/api/admin/asignaciones.json', { headers }).subscribe({
        next: (res) => this.asignaciones.set(res.data.total),
        error: (err) => console.error('Error cargando asignaciones', err)
      });

      this.http.get<any>('/api/admin/reportes.json', { headers }).subscribe({
        next: (res) => {
          this.reportes.set(res.data.total);
          // Ocultamos loading cuando termina la ultima (o usamos forkJoin idealmente, pero esto es simple)
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando reportes', err);
          this.isLoading.set(false);
        }
      });
    }, 1000); // 1 segundo de retraso para simular red real
  }
}
