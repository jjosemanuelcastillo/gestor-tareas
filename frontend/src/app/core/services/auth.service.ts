import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegistroRequest, Usuario } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

/** Lee la parte del medio del token (los datos) para saber cuándo caduca. */
export function tokenCaducado(token: string): boolean {
  try {
    const datos = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(datos)) as { exp?: number };
    return !exp || exp * 1000 <= Date.now(); // exp va en segundos; Date.now(), en milisegundos
  } catch {
    return true; // si no se puede leer, no es un token válido
  }
}

function leerUsuarioGuardado(): Usuario | null {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const usuario = localStorage.getItem(CLAVE_USUARIO);
  if (!token || !usuario || tokenCaducado(token)) {
    return null;
  }
  try {
    return JSON.parse(usuario) as Usuario;
  } catch {
    return null;
  }
}

/**
 * La sesión del usuario. Guarda el token en localStorage para que la sesión
 * se mantenga al recargar la página.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/auth`;

  private usuarioActual = signal<Usuario | null>(leerUsuarioGuardado());
  /** El usuario que ha iniciado sesión, o null si no hay sesión. */
  readonly usuario = this.usuarioActual.asReadonly();

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta))
    );
  }

  registro(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta))
    );
  }

  /** Cierra la sesión y lleva a /login. Con motivo 'caducada' se avisa al usuario. */
  logout(motivo?: 'caducada'): void {
    this.borrarSesion();
    this.router.navigate(['/login'], { queryParams: motivo ? { motivo } : {} });
  }

  token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /** Hay sesión si hay usuario y un token que no ha caducado. */
  estaAutenticado(): boolean {
    const token = this.token();
    return this.usuarioActual() !== null && token !== null && !tokenCaducado(token);
  }

  /** Olvida la sesión sin navegar (lo usa el guard cuando el token ha caducado). */
  borrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  private guardarSesion(respuesta: AuthResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuarioActual.set(respuesta.usuario);
  }
}
