import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
  private apiUrl = environment.apiUrl;

  userName = signal<string>('Usuario');
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
    this.http.get<any>(`${this.apiUrl}/admin/usuarios`, { headers }).subscribe({
      next: (res) => this.usuarios.set(this.extractTotal(res)),
      error: (err) => console.error('Error cargando usuarios', err)
    });

    this.http.get<any>(`${this.apiUrl}/admin/vehiculos`, { headers }).subscribe({
      next: (res) => this.vehiculos.set(this.extractTotal(res)),
      error: (err) => console.error('Error cargando vehiculos', err)
    });

    this.http.get<any>(`${this.apiUrl}/admin/asignaciones`, { headers }).subscribe({
      next: (res) => this.asignaciones.set(this.extractTotal(res)),
      error: (err) => console.error('Error cargando asignaciones', err)
    });

    this.http.get<any>(`${this.apiUrl}/admin/reportes`, { headers }).subscribe({
      next: (res) => {
        this.reportes.set(this.extractTotal(res));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando reportes', err);
        this.isLoading.set(false);
      }
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
