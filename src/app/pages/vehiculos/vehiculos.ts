import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-vehiculos',
  imports: [RouterModule, Navbar, Footer],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos { }
