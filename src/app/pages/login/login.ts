import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, CommonModule, Footer],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class LoginComponent {

  username = '';
  password = '';
  error = false;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.error = false;

    this.authService.login(this.username, this.password)
      .subscribe(user => {
        if (user) {
          console.log('Login correcto', user);
          localStorage.setItem('user', JSON.stringify(user));
          this.router.navigate(['/dashboard']);
        } else {
          this.error = true;
        }
      });
  }
}
