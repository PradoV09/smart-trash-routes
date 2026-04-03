import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-login',
  imports: [RouterModule, Footer],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

}
