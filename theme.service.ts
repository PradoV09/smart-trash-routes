import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Usamos signals para reactividad moderna en Angular
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.loadTheme();
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    const theme = this.isDarkMode() ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode.set(savedTheme === 'dark');
    this.applyTheme(savedTheme);
  }

  private applyTheme(theme: string) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
