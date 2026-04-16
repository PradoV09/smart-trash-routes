export type RolUsuario = 'Admin' | 'Driver' | 'Recolector';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  username: string;
  correo: string;
  rol: RolUsuario;
  telefono: string;
}

export type EstadoVehiculo = 'disponible' | 'en_ruta' | 'mantenimiento';

export interface Vehiculo {
  id_vehiculo: number;
  placa: string;
  modelo: string;
  capacidad_m3: number;
  estado: EstadoVehiculo;
}

export interface Ruta {
  id_ruta: number;
  nombre_sector: string;
  puntos_geograficos: string; // Puede ser un JSON stringificado o coordenadas
  horario_estimado: string;
}

export type AsuntoReporte = 'falla' | 'incidencia';
export type SeveridadReporte = 'baja' | 'media' | 'alta';

export interface Reporte {
  id_reporte: number;
  asunto: AsuntoReporte;
  comentario: string;
  severidad: SeveridadReporte;
  fecha_creacion: string;
}

export type EstadoAsignacion = 'Pendiente' | 'En Curso' | 'Finalizada';

export interface Asignacion {
  id_asignacion: number;
  id_ruta: number;
  id_vehiculo: number;
  estado: EstadoAsignacion;
  tripulacion: Usuario[]; // o podría ser number[] con los ids de los usuarios
}
