import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css'],
})
export class Vehiculos implements OnInit {

  vehiculos: any[] = [];
  form!: FormGroup;
  editMode = false;
  selectedId: number | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.form = this.fb.group({
      placa: ['', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required]
    });

    this.listarVehiculos();
  }

  listarVehiculos() {
    const url = 'http://10.50.77.224:3005/api/vehiculos/all';
    let headers = new HttpHeaders();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('No access token found in localStorage. Request will be sent without Authorization header.');
      }
    }

    this.http.get<any>(url, { headers }).subscribe({
      next: res => {
        console.log('Raw vehicles response:', res);

        // Aceptar varias formas de respuesta: array directo, paginación { data: { data: [] } }, o { vehiculos: [] }
        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (Array.isArray(res?.data?.data)) {
          // Formato paginado: { data: { data: [...] , current_page: ... } }
          items = res.data.data;
        } else if (Array.isArray(res?.data)) {
          items = res.data;
        } else if (Array.isArray(res?.vehiculos)) {
          items = res.vehiculos;
        } else if (Array.isArray(res?.vehicles)) {
          items = res.vehicles;
        } else {
          console.warn('Unexpected vehicles response format, expected array or {data|vehiculos|vehicles}[] or paginated {data.data}:', res);
        }

        this.vehiculos = items.map((v) => ({ ...v, id: v.id || v._id }));
        console.log('Vehículos asignados:', this.vehiculos);
      },
      error: err => {
        console.error('Error fetching vehicles:', err);
      }
    this.http.get<any[]>('assets/vehiculos.json').subscribe(res => {
      this.vehiculos = res.map((v, i) => ({ id: i + 1, ...v }));
    });
  }

  crearVehiculo() {
    if (this.form.invalid) return;

    const url = 'http://10.50.77.224:3005/api/vehiculos/register';
    let headers = new HttpHeaders();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Obtener perfil_id del usuario actual o usar un default
    const perfil_id = localStorage.getItem('user_id') || '1';

    const newVehiculo = {
      ...this.form.value,
      perfil_id: parseInt(perfil_id, 10)
    };

    console.log('Enviando vehículo:', newVehiculo);

    this.http.post<any>(url, newVehiculo, { headers }).subscribe({
      next: (res) => {
        console.log('Vehículo creado exitosamente:', res);
        // Agregar el nuevo vehículo directamente a la lista
        if (res.vehiculo) {
          this.vehiculos.push(res.vehiculo);
        } else if (res.data) {
          this.vehiculos.push(res.data);
        } else {
          // Si no viene en formato esperado, recargar la lista
          this.listarVehiculos();
        }
        this.form.reset();
      },
      error: (err) => {
        console.error('Error creating vehicle:', err);
        alert(`Error: ${err.error?.message || err.error?.error || err.message || 'No se pudo crear el vehículo'}`);
      }
    });
    const newVehiculo = {
      id: Date.now(),
      ...this.form.value
    };

    this.vehiculos.push(newVehiculo);
    this.form.reset();
  }

  editarVehiculo(v: any) {
    this.editMode = true;
    this.selectedId = v.id;
    this.form.patchValue(v);
  }

  guardarEdicion() {
    if (this.form.invalid || !this.selectedId) return;

    const url = `http://10.50.77.224:3005/api/vehiculos/${this.selectedId}`;
    let headers = new HttpHeaders();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    this.http.put<any>(url, this.form.value, { headers }).subscribe({
      next: (res) => {
        console.log('Vehículo actualizado exitosamente:', res);
        // Actualizar el vehículo en la lista
        const index = this.vehiculos.findIndex(v => v.id === this.selectedId);
        if (index !== -1) {
          this.vehiculos[index] = { ...this.vehiculos[index], ...this.form.value };
        }
        this.editMode = false;
        this.selectedId = null;
        this.form.reset();
      },
      error: (err) => {
        console.error('Error updating vehicle:', err);
      }
    });
  }

  eliminarVehiculo(id: number) {
    const url = `http://10.50.77.224:3005/api/vehiculos/${id}`;
    let headers = new HttpHeaders();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    this.http.delete<any>(url, { headers }).subscribe({
      next: (res) => {
        console.log('Vehículo eliminado exitosamente:', res);
        // Eliminar el vehículo de la lista
        this.vehiculos = this.vehiculos.filter(v => v.id !== id);
      },
      error: (err) => {
        console.error('Error deleting vehicle:', err);
      }
    });
    const index = this.vehiculos.findIndex(x => x.id === this.selectedId);
    this.vehiculos[index] = { id: this.selectedId, ...this.form.value };

    this.editMode = false;
    this.selectedId = null;
    this.form.reset();
  }

  eliminarVehiculo(id: number) {
    this.vehiculos = this.vehiculos.filter(v => v.id !== id);
  }
}
