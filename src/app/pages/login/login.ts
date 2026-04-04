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
          const token = this.authService.createToken(user.username);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          this.router.navigate(['/dashboard']);
        } else {
          this.error = true;
        }
      });
  }
}
