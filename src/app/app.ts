import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private authService = inject(AuthService);
  protected readonly title = signal('smart-trash-routes');

  ngOnInit(): void {
    if (!environment.production) {
      const token = this.authService.getToken();
      if (token) {
        console.log('[Auth] JWT (sesión actual):', token);
      }
    }
  }
}
