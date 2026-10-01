import { HttpErrorResponse } from '@angular/common/http';

/** Un error de la API, listo para enseñar: un mensaje general y/o errores por campo. */
export interface ErrorApi {
  mensaje: string | null;
  campos: Record<string, string>;
}

/**
 * Convierte la respuesta de error del backend en algo que se pueda enseñar.
 * El backend responde { message, errores? }; con 400, "errores" dice qué campo falla y por qué.
 */
export function leerErrorApi(error: HttpErrorResponse, porDefecto: string): ErrorApi {
  if (error.status === 0) {
    return { mensaje: 'No se pudo conectar con el servidor. ¿Está arrancado el backend?', campos: {} };
  }
  const cuerpo = error.error as { message?: string; errores?: Record<string, string> } | null;
  if (error.status === 400 && cuerpo?.errores) {
    return { mensaje: null, campos: cuerpo.errores };
  }
  return { mensaje: cuerpo?.message ?? porDefecto, campos: {} };
}
