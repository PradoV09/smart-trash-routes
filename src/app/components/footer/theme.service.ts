import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Usamos signals para reactividad eficiente en Angular 17+
  isDarkMode = signal<boolean>(false);

  constructor() { }

  toggleTheme() {
    // Funcionalidad de modo oscuro eliminada
  }

  private setTheme(dark: boolean) {
  }
}
