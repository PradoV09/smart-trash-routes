import { Component } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-rutas',
  imports: [RouterModule, Navbar, Footer],
  templateUrl: './rutas.html',
  styleUrl: './rutas.css',
})
export class Rutas { }
