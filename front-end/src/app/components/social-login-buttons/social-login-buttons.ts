import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-social-login-buttons',
  standalone: true,
  templateUrl: './social-login-buttons.html',
  styleUrls: ['./social-login-buttons.css'],
})
export class SocialLoginButtons implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.loadGoogleScript();
  }

  private loadGoogleScript() {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval);
        this.initializeGoogleButton();
      }
    }, 200);
  }

  private initializeGoogleButton() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleCredentialResponse(response),
    });
  }

  loginWithGoogle() {
    google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any) {
    console.log('Token JWT de Google:', response.credential);

    // llamar backend para guardar token
    localStorage.setItem('token', response.credential);
    this.router.navigate(['/dashboard']);
  }

  loginWithDiscord() {
    const clientId = environment.discordClientId;
    const redirectUri = encodeURIComponent('http://localhost:4200/auth/discord/callback');
    const scope = 'identify email';
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = discordAuthUrl;
  }
}
