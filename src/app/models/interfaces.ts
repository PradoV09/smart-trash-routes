export interface Usuario {
  id_usuario: number;
  nombre: string;
  username: string;
  correo: string;
  id_rol: number;
  activo: boolean;
}

/** POST /admin/usuarios (multipart) — alta por administrador; `nombre` va a perfiles.nombre. */
export interface UsuarioAdminCreatePayload {
  nombre: string;
  username: string;
  correo: string;
  contraseña: string;
  id_rol: number;
  activo: boolean;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export type EstadoVehiculo = 'disponible' | 'en_ruta' | 'mantenimiento' | 'inactivo';

export interface Vehiculo {
  id_vehiculo: number;
  placa: string;
  modelo?: string | null;
  capacidad_m3?: number | null;
  estado: EstadoVehiculo;
  /** UUID devuelto por la API externa tras crear (opcional). */
  id_externo?: string | null;
  /** Objeto enriquecido desde GET API externa al listar/detalle (opcional). */
  datos_api_externo?: Record<string, unknown> | null;
}

/** Campos permitidos en POST/PATCH /admin/vehiculos (form urlencoded). */
export type VehiculoWritePayload = Partial<
  Pick<Vehiculo, 'placa' | 'modelo' | 'capacidad_m3' | 'estado'>
>;

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
