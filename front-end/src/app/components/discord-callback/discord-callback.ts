import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-discord-callback',
  standalone: true,
  template: `<p>Conectando con Discord...</p>`,
})
export class DiscordCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      if (code) {
        console.log('Código recibido de Discord:', code);
        localStorage.setItem('discord_code', code);

        // llamar backend para guardar token de discord

        this.router.navigate(['/dashboard']);
      } else {
        console.error('No se recibió el código de Discord');
        this.router.navigate(['/login']);
      }
    });
  }
}
