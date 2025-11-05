import { Component, AfterViewInit } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-social-login-buttons',
  standalone: true,
  imports: [],
  templateUrl: './social-login-buttons.html',
  styleUrls: ['./social-login-buttons.css'],
})
export class SocialLoginButtons implements AfterViewInit {
  ngAfterViewInit() {
    google.accounts.id.initialize({
      client_id: '1003933300683-0bacvvblem8lkg139l1ibd3moe5ph33o.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(document.getElementById('googleBtn'), {
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
    });
  }

  loginWithDiscord() {
    const clientId = '1435453183110414518';
    const redirectUri = encodeURIComponent('http://localhost:4200/auth/discord/callback');
    const scope = 'identify email';
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;

    // Redirige al login de Discord
    window.location.href = discordAuthUrl;
  }

  handleCredentialResponse(response: any) {
    console.log('Token JWT de Google:', response.credential);
    // Aquí puedes enviarlo a tu backend para validarlo
  }
}
