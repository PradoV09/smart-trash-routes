import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    const url = 'http://smartroutes.eleueleo.com/api/vehiculos/all';
    let headers = this.getHeaders();

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        let items: any[] = [];

        if (Array.isArray(res)) {
          items = res;
        } else if (Array.isArray(res?.data?.data)) {
          items = res.data.data;
        } else if (Array.isArray(res?.data)) {
          items = res.data;
        } else if (Array.isArray(res?.vehiculos)) {
          items = res.vehiculos;
        }

        this.vehiculos = items.map(v => ({ ...v, id: v.id || v._id }));
      },
      error: (err) => console.error('Error fetching vehicles:', err)
    });
  }

  crearVehiculo() {
    if (this.form.invalid) return;

    const url = 'http://smartroutes.eleueleo.com/api/vehiculos/register';
    let headers = this.getHeaders();

    const perfil_id = parseInt(localStorage.getItem('user_id') || '1', 10);

    const newVehiculo = {
      ...this.form.value,
      perfil_id
    };

    this.http.post<any>(url, newVehiculo, { headers }).subscribe({
      next: (res) => {
        const item = res.vehiculo || res.data;
        if (item) this.vehiculos.push(item);
        else this.listarVehiculos();

        this.form.reset();
      },
      error: (err) => console.error('Error creating vehicle:', err)
    });
  }

  editarVehiculo(v: any) {
    this.editMode = true;
    this.selectedId = v.id;
    this.form.patchValue(v);
  }

  guardarEdicion() {
    if (this.form.invalid || !this.selectedId) return;

    const url = `http://smartroutes.eleueleo.com/api/vehiculos/${this.selectedId}`;
    let headers = this.getHeaders();

    this.http.put<any>(url, this.form.value, { headers }).subscribe({
      next: () => {
        const index = this.vehiculos.findIndex(v => v.id === this.selectedId);
        if (index !== -1) {
          this.vehiculos[index] = { id: this.selectedId, ...this.form.value };
        }
        this.resetForm();
      },
      error: (err) => console.error('Error updating vehicle:', err)
    });
  }

  eliminarVehiculo(id: number) {
    const url = `http://smartroutes.eleueleo.com/api/vehiculos/${id}`;
    let headers = this.getHeaders();

    this.http.delete(url, { headers }).subscribe({
      next: () => {
        this.vehiculos = this.vehiculos.filter(v => v.id !== id);
      },
      error: (err) => console.error('Error deleting vehicle:', err)
    });
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('accessToken');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private resetForm() {
    this.form.reset();
    this.editMode = false;
    this.selectedId = null;
  }
}
