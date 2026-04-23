import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Footer, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  identifier = '';
  password = '';
  isLoading = signal(false);

  private router = inject(Router);
  private authService = inject(AuthService);

  onSubmit() {
    if (this.identifier && this.password) {
      this.isLoading.set(true);
      
      this.authService.login(this.identifier, this.password).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          // Redirige al panel tras obtener la respuesta exitosa
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error("Error validando credenciales", err);
          
          if (err.message === 'ACCESO_DENEGADO_NO_ADMIN') {
            alert('Acceso denegado. Esta aplicación es solo para administradores.');
          } else {
            alert('Hubo un error al iniciar sesión. Verifica tus credenciales.');
          }
        }
      });
    }
  }
}

