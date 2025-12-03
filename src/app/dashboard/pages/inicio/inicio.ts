import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class Inicio implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  userName: string = '';
  totalRutas: number = 0;
  totalVehiculos: number = 0;
  isLoading: boolean = true;

  ngOnInit(): void {
    this.loadUserData();
    this.loadStatistics();
  }

  private loadUserData(): void {
    const email = localStorage.getItem('user_email') || this.authService.getEmail();
    this.userName = email ? email.split('@')[0].toUpperCase() : 'Usuario';
  }

  private loadStatistics(): void {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Cargar rutas
    this.http.get<any>('http://10.241.138.224:3005/api/rutas', { headers }).subscribe({
      next: (res) => {
        let rutas: any[] = [];
        if (Array.isArray(res)) {
          rutas = res;
        } else if (Array.isArray(res?.data?.data)) {
          rutas = res.data.data;
        } else if (Array.isArray(res?.data)) {
          rutas = res.data;
        } else if (Array.isArray(res?.rutas)) {
          rutas = res.rutas;
        }
        this.totalRutas = rutas.length;
      },
      error: (err) => {
        console.error('Error loading rutas:', err);
        this.totalRutas = 0;
      }
    });

    // Cargar vehículos
    this.http.get<any>('http://10.241.138.224:3005/api/vehiculos/all', { headers }).subscribe({
      next: (res) => {
        let vehiculos: any[] = [];
        if (Array.isArray(res)) {
          vehiculos = res;
        } else if (Array.isArray(res?.data?.data)) {
          vehiculos = res.data.data;
        } else if (Array.isArray(res?.data)) {
          vehiculos = res.data;
        } else if (Array.isArray(res?.vehiculos)) {
          vehiculos = res.vehiculos;
        }
        this.totalVehiculos = vehiculos.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading vehiculos:', err);
        this.totalVehiculos = 0;
        this.isLoading = false;
      }
    });
  }

  nuevaRuta() {
    this.router.navigate(['/dashboard/addresses']);
  }

  nuevoVehiculo() {
    this.router.navigate(['/dashboard/vehiculos']);
  }

  verRutas() {
    this.router.navigate(['/dashboard/addresses']);
  }

  verVehiculos() {
    this.router.navigate(['/dashboard/vehiculos']);
  }
}
