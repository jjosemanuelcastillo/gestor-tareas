import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API = 'http://localhost:8080/api/';
const RUTAS_PUBLICAS = [`${API}auth/login`, `${API}auth/register`];

/**
 * Se ejecuta en TODAS las peticiones HTTP de la app:
 * 1. Añade "Authorization: Bearer <token>" a las peticiones a nuestra API.
 * 2. Si la API responde 401 (token caducado o falso), cierra la sesión y lleva a /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const esNuestraApi = req.url.startsWith(API);
  const esPublica = RUTAS_PUBLICAS.includes(req.url);
  const token = auth.token();

  const peticion = esNuestraApi && !esPublica && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // En el login, un 401 es "contraseña incorrecta": eso lo enseña el propio formulario
      if (error.status === 401 && esNuestraApi && !esPublica) {
        auth.logout('caducada');
      }
      return throwError(() => error);
    })
  );
};
