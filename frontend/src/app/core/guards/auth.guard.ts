import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Rutas de la app: solo con sesión. Si no, a /login (y luego se vuelve a donde ibas). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  // Había sesión pero el token ha caducado: avisar
  const caducada = auth.token() !== null;
  auth.borrarSesion();
  return router.createUrlTree(['/login'], {
    queryParams: { volver: state.url, ...(caducada ? { motivo: 'caducada' } : {}) },
  });
};

/** /login y /registro: solo SIN sesión. Si ya has entrado, a tus tableros. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() ? router.createUrlTree(['/']) : true;
};
