import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
    this.http.get<any[]>('assets/vehiculos.json').subscribe(res => {
      this.vehiculos = res.map((v, i) => ({ id: i + 1, ...v }));
    });
  }

  crearVehiculo() {
    if (this.form.invalid) return;

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
