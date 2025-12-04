/*
  Componente del Dashboard (área principal protegida).

  Comentarios línea a línea para explicar importaciones, decorator y métodos.
*/
// Importa decoradores y helpers desde Angular
import { Component, inject } from '@angular/core';
// Importa utilidades de enrutamiento necesarias en el template
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
// Importa CommonModule para directivas básicas en el template
import { CommonModule } from '@angular/common';
// Servicio de autenticación para logout y estado de usuario
import { AuthService } from '../services/auth.service';

// Decorador que define metadatos del componente
@Component({
  // Selector usado en index.html o templates para insertar este componente
  selector: 'app-dashboard',
  // Ruta al template HTML
  templateUrl: './dashboard.html',
  // Ruta al CSS del componente
  styleUrls: ['./dashboard.css'],
  // Importa módulos/directivas necesarias para el template (standalone)
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  // Marca el componente como standalone (no requiere NgModule)
  standalone: true
})
// Clase que contiene la lógica del dashboard
export class Dashboard {

  // Inyección de dependencias: Router para navegación
  private router = inject(Router);
  // Inyección de AuthService para manejar logout y estado
  private authService = inject(AuthService);

  // Estado local para controlar la UI
  isCollapsed = false; // indica si la sidebar está colapsada
  isMenuOpen = false; // indica si el menú móvil está abierto

  // Alterna la visibilidad/estado de la barra lateral y aplica una clase al <main>
  toggleSidebar() {
    // Invierte el estado de colapso
    this.isCollapsed = !this.isCollapsed;
    // Busca el elemento <main> y le aplica o remueve la clase según el estado
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (this.isCollapsed) {
          mainElement.classList.add('main-collapsed');
      } else {
          mainElement.classList.remove('main-collapsed');
      }
    }
  }

  // Abre/cierra el menú (móvil)
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Cierra sesión delegando en AuthService
  logout(): void {
    this.authService.logout();
  }

}
