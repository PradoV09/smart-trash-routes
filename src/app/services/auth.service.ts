import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private currentUser: any = null;

  constructor(private router: Router, private http: HttpClient) {
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    if (typeof window === 'undefined') return; // SSR check
    
    const userAuth = localStorage.getItem('user_authenticated');
    if (userAuth === 'true') {
      this.isAuthenticated = true;
      this.currentUser = {
        email: localStorage.getItem('user_email'),
        nombre: localStorage.getItem('user_nombre'),
        rol: localStorage.getItem('user_rol')
      };
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      // Cargar usuarios del JSON
      const response = await this.http.get<any>('/assets/data/usuarios.json').toPromise();
      const usuarios = response?.usuarios || [];
      
      console.log('Usuarios cargados:', usuarios);
      console.log('Buscando:', { email, password });
      
      // Buscar usuario que coincida con email y password
      const usuario = usuarios.find((u: any) => u.email === email && u.password === password);
      
      console.log('Usuario encontrado:', usuario);
      
      if (usuario && usuario.activo) {
        this.isAuthenticated = true;
        this.currentUser = {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
          telefono: usuario.telefono
        };

        // Guardar en localStorage solo si estamos en el navegador
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_authenticated', 'true');
          localStorage.setItem('user_email', usuario.email);
          localStorage.setItem('user_nombre', usuario.nombre);
          localStorage.setItem('user_rol', usuario.rol);
        }
        
        return true;
      } else {
        console.log('Usuario inválido o inactivo');
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  logout(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    
    // Remover de localStorage solo si estamos en el navegador
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_nombre');
      localStorage.removeItem('user_rol');
    }
    
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  getEmail(): string {
    return this.currentUser?.email || '';
  }

  getNombre(): string {
    return this.currentUser?.nombre || '';
  }

  getRol(): string {
    return this.currentUser?.rol || '';
  }
}
