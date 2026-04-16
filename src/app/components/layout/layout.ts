import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';


@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Footer, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
