import { Component, AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-social-login-buttons',
  standalone: true,
  templateUrl: './social-login-buttons.html',
  styleUrls: ['./social-login-buttons.css'],
})
export class SocialLoginButtons implements AfterViewInit {

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
    google.accounts.id.prompt(); // o puedes abrir tu flujo OAuth manual
  }

  handleCredentialResponse(response: any) {
    console.log('Token JWT de Google:', response.credential);
  }

  loginWithDiscord() {
    const clientId = environment.discordClientId;
    const redirectUri = encodeURIComponent('http://localhost:4200/auth/discord/callback');
    const scope = 'identify email';
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = discordAuthUrl;
  }
}
