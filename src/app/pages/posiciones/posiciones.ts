import { Component } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { Navbar } from '../../components/navbar/navbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-posiciones',
  imports: [RouterModule, Navbar, Footer],
  templateUrl: './posiciones.html',
  styleUrl: './posiciones.css',
})
export class Posiciones { }
