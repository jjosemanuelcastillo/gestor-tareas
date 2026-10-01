import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ServidorService } from '../services/servidor.service';
import { environment } from '../../../environments/environment';

/** A partir de cuánto tiempo una petición se considera "lenta" (el servidor está despertando). */
export const ESPERA_ANTES_DEL_AVISO_MS = 4000;

/**
 * Si una petición a la API tarda más de ESPERA_ANTES_DEL_AVISO_MS, avisa a ServidorService
 * (que enseña el aviso) y, cuando termina, bien o mal, lo quita.
 */
export const servidorLentoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const servidor = inject(ServidorService);
  let esLenta = false;
  const temporizador = setTimeout(() => {
    esLenta = true;
    servidor.empiezaPeticionLenta();
  }, ESPERA_ANTES_DEL_AVISO_MS);

  return next(req).pipe(
    finalize(() => {
      clearTimeout(temporizador);
      if (esLenta) servidor.terminaPeticionLenta();
    })
  );
};
