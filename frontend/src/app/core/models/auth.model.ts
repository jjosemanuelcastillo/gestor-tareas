/** El usuario que ha iniciado sesión (lo que devuelve /api/auth/me). */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

/** Respuesta de /api/auth/login y /api/auth/register. */
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
}
