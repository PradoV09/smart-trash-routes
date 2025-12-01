// src/app/services/rutas.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Ruta {
  id?: string;
  nombre: string;
  coordenadas: { lat: number; lng: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private coleccionRutas = 'rutas';

  constructor(private firestore: AngularFirestore) { }

  // C - Crear una nueva ruta
  crearRuta(ruta: Ruta): Promise<any> {
    return this.firestore.collection(this.coleccionRutas).add(ruta);
  }

  // R - Leer todas las rutas
  obtenerRutas(): Observable<Ruta[]> {
    // Specify the type <Ruta> on the collection
    return this.firestore.collection<Ruta>(this.coleccionRutas).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        });
      })
    );
  }

  // D - Borrar una ruta
  borrarRuta(id: string): Promise<any> {
    return this.firestore.collection(this.coleccionRutas).doc(id).delete();
  }
}
