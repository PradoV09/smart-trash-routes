import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [Footer, FormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  correo = '';
  isLoading = signal(false);
  successMessage = signal(false);
  errorMessage = signal('');

  private authService = inject(AuthService);

  onSubmit() {
    if (this.correo) {
      this.isLoading.set(true);
      
      this.authService.forgotPassword(this.correo).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.successMessage.set(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error("Error al solicitar recuperación", err);
          // Si es un error real de red, mostramos error
          if (err.status === 0 || err.status >= 500) {
            this.errorMessage.set('Tuvimos un problema al comunicarnos con el servidor. Inténtalo más tarde.');
          } else {
            // Mostrar éxito de todas formas para prevenir enumeración de usuarios
            this.successMessage.set(true);
            this.errorMessage.set('');
          }
        }
      });
    }
  }
}
