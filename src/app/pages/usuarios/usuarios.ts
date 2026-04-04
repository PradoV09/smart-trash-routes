import { Component } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { Navbar } from '../../components/navbar/navbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  imports: [RouterModule, Navbar, Footer],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios { }
