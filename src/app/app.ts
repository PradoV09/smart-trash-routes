/*
  Componente raíz de la aplicación.
  Comentarios línea a línea explicando cada elemento del archivo.
*/
// Importa el decorador Component desde Angular
import { Component } from '@angular/core';
// Importa RouterOutlet para renderizar las rutas hijas en el template
import { RouterOutlet } from '@angular/router';

// Definición del componente principal de la aplicación
@Component({
  // Selector HTML que identifica este componente en el DOM
  selector: 'app-root',
  // Marca el componente como standalone (no requiere NgModule)
  standalone: true,
  // Módulos y directivas que usa el componente (RouterOutlet)
  imports: [RouterOutlet],
  // Ruta al archivo HTML que define la vista del componente
  templateUrl: './app.html',
  // Ruta al archivo CSS que define los estilos del componente
  styleUrls: ['./app.css']
})
// Clase del componente (vacía, ya que la lógica está en componentes hijos)
export class App {}
