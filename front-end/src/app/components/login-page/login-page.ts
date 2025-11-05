import { Component } from '@angular/core';
import { HeaderLogo } from '../header-logo/header-logo';
import { CallToActionFooter } from '../call-to-action-footer/call-to-action-footer';
import { LoginForm } from '../login-form/login-form';
import { SocialLoginButtons } from '../social-login-buttons/social-login-buttons';

@Component({
  selector: 'app-login-page',
  imports: [HeaderLogo, CallToActionFooter, LoginForm, SocialLoginButtons],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {

}
