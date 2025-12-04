
/*
  Componente de Login (vista pública).

  - Implementado como `standalone` con su propio template y estilos.
  - Controla los eventos DOM del formulario (botón, toggle de contraseña).
  - Al hacer login delega en `AuthService.login()` y, si es válido, navega al `/dashboard`.
*/
import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements AfterViewInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngAfterViewInit() {
    // Prevenir menú contextual (clic derecho)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('email') as HTMLInputElement;
    const pass = document.getElementById('password') as HTMLInputElement;
    const toggle = document.getElementById('togglePass');

    // Manejo del click en el botón de login: validaciones simples y llamada a AuthService
    btn?.addEventListener('click', async () => {
      if (!email.value) {
        email.classList.add('error');
        return;
      }
      if (!pass.value) {
        pass.classList.add('error');
        return;
      }

      if (email.value && pass.value) {
        btn.classList.add('loading');
        btn.textContent = '⏳ Ingresando...';
        
        // Validar credenciales contra AuthService (Observable)
        this.authService.login(email.value, pass.value).subscribe(isValid => {
          if (isValid) {
            btn.classList.remove('loading');
            btn.classList.add('success');
            btn.textContent = '✅ ¡Bienvenido!';
            
            setTimeout(() => {
              // Navegar al dashboard
              this.router.navigate(['/dashboard']);
              btn.classList.remove('success');
              btn.textContent = '🌍 Ingresar';
              email.value = '';
              pass.value = '';
            }, 800);
          } else {
            btn.classList.remove('loading');
            email.classList.add('error');
            pass.classList.add('error');
            btn.textContent = '❌ Credenciales inválidas';
            
            setTimeout(() => {
              btn.textContent = '🌍 Ingresar';
            }, 1500);
          }
        });
      }
    });

    // Toggle mostrar/ocultar contraseña
    toggle?.addEventListener('click', () => {
      pass.type = pass.type === 'password' ? 'text' : 'password';
      toggle.textContent = pass.type === 'password' ? '👁️' : '🙈';
    });

    // Limpiar estado de error cuando el usuario escribe
    [email, pass].forEach(input => {
      input.addEventListener('input', () => input.classList.remove('error'));
    });
  }
}