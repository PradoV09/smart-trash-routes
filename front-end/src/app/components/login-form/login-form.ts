import { Component } from '@angular/core';

@Component({
  selector: 'app-login-form',
  imports: [],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css'
})
export class LoginForm {
  onRegister() {
  console.log('Botón Registrarse presionado');
  }
}
