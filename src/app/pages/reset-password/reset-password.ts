import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [Footer, ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  token = '';
  
  isLoading = signal(false);
  successMessage = signal(false);
  errorMessage = signal('');

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  constructor() {
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[A-Z])/), // Al menos una mayúscula
        Validators.pattern(/(?=.*[a-z])/), // Al menos una minúscula
        Validators.pattern(/(?=.*\d)/),    // Al menos un número
        Validators.pattern(/(?=.*[!@#$%^&*()_\-=+\[\]{}|;:'",.<>/?`~])/) // Al menos un especial
      ]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage.set('Enlace inválido o incompleto. Falta el token de seguridad en la URL.');
        this.resetForm.disable();
      }
    });
  }

  // Getters para acceso fácil en el HTML
  get newPassword() { return this.resetForm.get('newPassword'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }

  onSubmit() {
    this.errorMessage.set('');
    
    if (!this.token) {
      this.errorMessage.set('Enlace inválido. Por favor solicita uno nuevo.');
      return;
    }
    
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const newPass = this.resetForm.value.newPassword;
    const confirmPass = this.resetForm.value.confirmPassword;

    if (newPass !== confirmPass) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    
    this.authService.resetPassword(this.token, newPass).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error("Error al restablecer contraseña", err);
        
        if (err.error && err.error.detail) {
           if (Array.isArray(err.error.detail)) {
              this.errorMessage.set(err.error.detail[0].msg || 'Error de validación en la contraseña.');
           } else {
              this.errorMessage.set(err.error.detail);
           }
        } else {
           this.errorMessage.set('Hubo un error al actualizar la contraseña. Es posible que el enlace haya expirado.');
        }
      }
    });
  }
}
