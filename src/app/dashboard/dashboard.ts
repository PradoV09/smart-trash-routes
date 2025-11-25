import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [RouterOutlet, CommonModule, RouterLink],
  standalone: true
})
export class Dashboard {

  constructor (private router: Router) {}

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
    localStorage.removeItem('user_authenticated');
    window.location.href = '/login';
  }

}
