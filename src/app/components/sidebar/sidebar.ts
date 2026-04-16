import { Component, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  constructor(private router: Router) {}

  isExpanded = signal(true);

  toggleSidebar() {
    this.isExpanded.set(!this.isExpanded());
  }

  logout() {
    // Lógica para limpiar token/sesión
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
