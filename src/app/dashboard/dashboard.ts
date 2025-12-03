import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  standalone: true
})
export class Dashboard {

  private router = inject(Router);
  private authService = inject(AuthService);

  isCollapsed = false;
  isMenuOpen = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (this.isCollapsed) {
          mainElement.classList.add('main-collapsed');
      } else {
          mainElement.classList.remove('main-collapsed');
      }
  }
  
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

}
