import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol, Usuario } from '../../models/interfaces';
import { UsuarioService } from '../../services/usuario.service';

const FALLBACK_ROLES: Rol[] = [
  { id_rol: 1, nombre: 'admin' },
  { id_rol: 2, nombre: 'driver' },
  { id_rol: 3, nombre: 'recolector' }
];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  loading = signal(false);
  loadingRoles = signal(false);
  error = signal('');
  errorRoles = signal('');
  saving = signal(false);
  deletingId = signal<number | null>(null);

  showForm = false;
  editingId: number | null = null;
  formData: {
    nombre: string;
    username: string;
    correo: string;
    contrasena: string;
    id_rol: number;
    activo: boolean;
  } = {
    nombre: '',
    username: '',
    correo: '',
    contrasena: '',
    id_rol: 0,
    activo: true
  };

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsuarios();
  }

  loadRoles(): void {
    this.loadingRoles.set(true);
    this.errorRoles.set('');
    this.usuarioService.getRoles().subscribe({
      next: (res) => {
        const rolesApi = this.extractArray<Rol>(res).map((roleRaw) => this.normalizeRole(roleRaw));
        let nextRoles = rolesApi.filter((r): r is Rol => !!r && r.id_rol > 0);
        let errMsg = '';

        if (nextRoles.length === 0) {
          nextRoles = [...FALLBACK_ROLES];
          errMsg = 'No llegaron roles desde API. Se usan roles temporales.';
        }

        this.roles.set(nextRoles);
        this.errorRoles.set(errMsg);

        if (nextRoles.length > 0 && !this.formData.id_rol) {
          this.formData.id_rol = nextRoles[0].id_rol;
        }

        this.loadingRoles.set(false);
      },
      error: () => {
        const fb = [...FALLBACK_ROLES];
        this.roles.set(fb);
        this.errorRoles.set('No se pudieron cargar los roles desde API. Se usan roles temporales.');
        if (!this.formData.id_rol) {
          this.formData.id_rol = fb[0].id_rol;
        }
        this.loadingRoles.set(false);
      }
    });
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.error.set('');
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        const rows = this.extractUsuariosPayload(res).map((raw) =>
          this.normalizeUsuario(raw as Record<string, unknown>)
        );
        this.usuarios.set(this.dedupeUsuariosById(rows));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios.');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.formData = {
      nombre: '',
      username: '',
      correo: '',
      contrasena: '',
      id_rol: this.roles()[0]?.id_rol ?? 0,
      activo: true
    };
    this.showForm = true;
  }

  openEditForm(usuario: Usuario): void {
    this.editingId = usuario.id_usuario;
    this.formData = {
      nombre: usuario.nombre ?? '',
      username: usuario.username,
      correo: usuario.correo,
      contrasena: '',
      id_rol: usuario.id_rol,
      activo: usuario.activo
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveUsuario(): void {
    const nombreTrim = this.formData.nombre.trim();
    const usernameTrim = this.formData.username.trim();
    const correoTrim = this.formData.correo.trim();

    if (!nombreTrim) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (!usernameTrim || !correoTrim) {
      this.error.set('Username y correo son obligatorios.');
      return;
    }
    if (usernameTrim.length < 3 || usernameTrim.length > 50) {
      this.error.set('El username debe tener entre 3 y 50 caracteres.');
      return;
    }
    if (nombreTrim.length > 255) {
      this.error.set('El nombre admite como máximo 255 caracteres.');
      return;
    }
    if (!this.formData.id_rol || this.formData.id_rol <= 0) {
      this.error.set('Selecciona un rol válido.');
      return;
    }

    if (!this.editingId && !this.formData.contrasena) {
      this.error.set('La contraseña es obligatoria al crear.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    let request$: Observable<Usuario>;
    if (!this.editingId) {
      request$ = this.usuarioService.createUsuario({
        nombre: nombreTrim,
        username: usernameTrim,
        correo: correoTrim,
        contraseña: this.formData.contrasena,
        id_rol: Number(this.formData.id_rol),
        activo: this.formData.activo
      });
    } else {
      const payload: Record<string, string | number | boolean> = {
        nombre: nombreTrim,
        username: usernameTrim,
        correo: correoTrim,
        id_rol: Number(this.formData.id_rol),
        activo: this.formData.activo
      };
      if (this.formData.contrasena) {
        payload['contraseña'] = this.formData.contrasena;
      }
      request$ = this.usuarioService.updateUsuario(this.editingId, payload);
    }

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm = false;
        this.editingId = null;
        this.loadUsuarios();
      },
      error: () => {
        this.error.set(
          this.editingId ? 'No se pudo actualizar el usuario.' : 'No se pudo crear el usuario.'
        );
        this.saving.set(false);
      }
    });
  }

  deleteUsuario(usuario: Usuario): void {
    if (!confirm(`Eliminar usuario "${usuario.username}"?`)) {
      return;
    }

    this.deletingId.set(usuario.id_usuario);
    this.error.set('');
    const idEliminar = usuario.id_usuario;
    if (!idEliminar) {
      this.error.set('No se pudo identificar el usuario a eliminar.');
      this.deletingId.set(null);
      return;
    }

    this.usuarioService.deleteUsuario(idEliminar).subscribe({
      next: () => {
        this.usuarios.update((list) => list.filter((u) => u.id_usuario !== idEliminar));
        this.deletingId.set(null);
        this.loadUsuarios();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.deleteErrorMessage(err));
        this.deletingId.set(null);
      }
    });
  }

  getRolLabel(idRol: number): string {
    const rol = this.roles().find((r) => r.id_rol === idRol);
    return rol?.nombre ?? `Rol ${idRol}`;
  }

  trackUsuarioId(_index: number, usuario: Usuario): number {
    return usuario.id_usuario;
  }

  private extractArray<T>(response: T[] | { data?: T[] }): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  }

  /** Lista cruda de usuarios: array directo, `data[]`, o colecciones anidadas frecuentes en APIs. */
  private extractUsuariosPayload(response: unknown): unknown[] {
    const direct = this.extractArray<unknown>(response as { data?: unknown[] });
    if (direct.length > 0) {
      return direct;
    }
    const data = (response as { data?: Record<string, unknown> })?.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of ['usuarios', 'users', 'items', 'results', 'rows']) {
        const arr = data[key];
        if (Array.isArray(arr)) {
          return arr;
        }
      }
    }
    return [];
  }

  private dedupeUsuariosById(rows: Usuario[]): Usuario[] {
    const seen = new Set<number>();
    const out: Usuario[] = [];
    for (const u of rows) {
      if (!u.id_usuario || seen.has(u.id_usuario)) {
        continue;
      }
      seen.add(u.id_usuario);
      out.push(u);
    }
    return out;
  }

  private deleteErrorMessage(err: HttpErrorResponse): string {
    const base = 'No se pudo eliminar el usuario.';
    const status = err?.status;
    if (status === 404) {
      return `${base} (no encontrado — revisa que el id del listado coincida con el del backend).`;
    }
    if (status === 403 || status === 401) {
      return `${base} (sin permiso o sesión inválida).`;
    }

    const fromBody = this.extractHttpErrorBody(err.error);
    if (fromBody) {
      return `${base} — ${fromBody}`;
    }

    if (status === 400) {
      return `${base} (400 sin cuerpo JSON reconocible). Si el backend devuelve HTML o texto, revisa la pestaña Red.`;
    }
    return base;
  }

  /** Soporta FastAPI/Pydantic, envoltorios `{ data, error }`, arrays de validación, etc. */
  private extractHttpErrorBody(body: unknown): string | null {
    if (body == null || body === '') {
      return null;
    }
    if (typeof body === 'string') {
      const t = body.trim();
      return t.length > 0 ? t : null;
    }
    if (typeof body === 'number' || typeof body === 'boolean') {
      return String(body);
    }

    if (Array.isArray(body)) {
      const parts: string[] = [];
      for (const item of body) {
        const s = this.extractHttpErrorBody(item);
        if (s) {
          parts.push(s);
        } else if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const m =
            this.stringField(o, ['msg', 'message', 'detail', 'description']) ??
            (Array.isArray(o['loc']) ? `${o['loc'].join('.')}: ${o['msg'] ?? o['message'] ?? ''}` : null);
          if (m?.trim()) {
            parts.push(m.trim());
          }
        }
      }
      if (parts.length > 0) {
        return parts.join(' ');
      }
      return null;
    }

    if (typeof body === 'object') {
      const o = body as Record<string, unknown>;

      const fromDetail = this.extractHttpErrorBody(o['detail']);
      if (fromDetail) {
        return fromDetail;
      }

      const direct =
        this.stringField(o, ['message', 'description', 'title', 'reason', 'mensaje']) ??
        (typeof o['error'] === 'string' ? (o['error'] as string).trim() : null);
      if (direct) {
        return direct;
      }

      for (const wrap of ['error', 'errors', 'data', 'payload']) {
        const inner = o[wrap];
        if (inner != null && inner !== o) {
          const nested = this.extractHttpErrorBody(inner);
          if (nested) {
            return nested;
          }
        }
      }

      try {
        const j = JSON.stringify(o);
        if (j && j !== '{}' && j.length <= 400) {
          return j;
        }
        if (j && j.length > 400) {
          return `${j.slice(0, 397)}…`;
        }
      } catch {
        /* ignore */
      }
    }

    return null;
  }

  private stringField(o: Record<string, unknown>, keys: string[]): string | null {
    for (const k of keys) {
      const v = o[k];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    return null;
  }

  /**
   * El listado del backend suele traer el nombre del perfil en `perfil.nombre`, no en la raíz.
   */
  private normalizeUsuario(raw: Record<string, unknown>): Usuario {
    const perfil = (raw['perfil'] ?? raw['profile']) as Record<string, unknown> | null | undefined;
    const nombreRaiz = raw['nombre'];
    const nombrePerfil = perfil?.['nombre'] ?? perfil?.['name'];
    const fromRoot = typeof nombreRaiz === 'string' ? nombreRaiz.trim() : '';
    const fromPerfil = typeof nombrePerfil === 'string' ? String(nombrePerfil).trim() : '';
    const nombre = fromRoot || fromPerfil;

    const nested = (raw['usuario'] ?? raw['user']) as Record<string, unknown> | undefined;
    const id = Number(
      raw['id_usuario'] ??
        raw['id'] ??
        raw['usuario_id'] ??
        raw['user_id'] ??
        raw['pk'] ??
        nested?.['id_usuario'] ??
        nested?.['id'] ??
        0
    );
    const idRol = Number(raw['id_rol'] ?? raw['rol_id'] ?? 0);
    const activoVal = raw['activo'];
    let activo = true;
    if (typeof activoVal === 'boolean') {
      activo = activoVal;
    } else if (typeof activoVal === 'number') {
      activo = activoVal !== 0;
    } else if (typeof activoVal === 'string') {
      const s = activoVal.toLowerCase();
      activo = s === 'true' || s === '1' || s === 'si' || s === 'sí';
    } else if (activoVal === null || activoVal === undefined) {
      activo = true;
    }

    return {
      id_usuario: id,
      nombre,
      username: String(raw['username'] ?? ''),
      correo: String(raw['correo'] ?? raw['email'] ?? ''),
      id_rol: idRol,
      activo
    };
  }

  private normalizeRole(roleRaw: any): Rol | null {
    const id = Number(roleRaw?.id_rol ?? roleRaw?.id ?? roleRaw?.rol_id);
    const nombre = String(roleRaw?.nombre ?? roleRaw?.name ?? roleRaw?.rol ?? '').trim();

    if (!id || !nombre) {
      return null;
    }

    return { id_rol: id, nombre };
  }
}
