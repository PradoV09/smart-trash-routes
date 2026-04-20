import { Component, signal, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);
  private authService = inject(AuthService);

  isExpanded = signal(true);

  toggleSidebar() {
    this.isExpanded.set(!this.isExpanded());
  }

  logout() {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }
}
