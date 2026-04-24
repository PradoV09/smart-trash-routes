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
  id?: number;
  nombre_sector: string;
  nombre_ruta?: string;
  puntos_geograficos: string;
  horario_estimado: string;
}

export type AsuntoReporte = 'falla' | 'incidencia';
export type SeveridadReporte = 'baja' | 'media' | 'alta';

export interface ReporteFoto {
  id_foto: number;
  url: string;
  tipo: 'evidencia' | 'incidente';
  timestamp_captura: string;
}

export interface Reporte {
  id_registro: number;
  asunto: string;
  descripcion: string;
  estado: 'baja' | 'media' | 'alta';
  fecha: string;
  id_usuario: number;
  terminado: boolean;
  evidencia_url?: string;
  u_gmail_cache?: any;
  u_rol_cache?: string;
  notas_terminacion?: string;
  fecha_terminacion?: string;
  fotos?: ReporteFoto[];
  created_at?: string;
  updated_at?: string;
}

// Payload para marcar como terminado
export interface ReporteTerminarPayload {
  notas_terminacion?: string;
}

export type EstadoAsignacion = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';

export interface Asignacion {
  id_asignacion: number;
  id_ruta: string;
  id_vehiculo: number;
  id_tripulacion: number;
  estado: EstadoAsignacion;
  fecha: string;
  hora_salida?: string;
  tripulacion?: Tripulacion;
  vehiculo?: Vehiculo;
}

export interface TripulacionMiembro {
  id: number;
  id_tripulacion: number;
  id_asignacion?: number;
  id_usuario: number;
  rol_tripulacion: 'conductor' | 'recolector';
  usuario: Usuario;
  confirmado: boolean;
  confirmado_at?: string | null;
}

export interface Tripulacion {
  id_tripulacion: number;
  nombre: string | null;
  created_at: string;
  miembros: TripulacionMiembro[];
}

