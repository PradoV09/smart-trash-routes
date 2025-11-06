import { Routes } from '@angular/router';
import { DashBoard } from './components/dash-board/dash-board';
import { LoginPage } from './components/login-page/login-page';
import { DiscordCallbackComponent } from './components/discord-callback/discord-callback';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'dashboard', component: DashBoard },
  { path: 'auth/discord/callback', component: DiscordCallbackComponent },
];
