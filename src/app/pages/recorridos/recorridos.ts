import { Component } from '@angular/core';
import { Footer } from '../../components/footer/footer';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-recorridos',
  imports: [RouterModule, Navbar, Footer],
  templateUrl: './recorridos.html',
  styleUrl: './recorridos.css',
})
export class Recorridos { }
