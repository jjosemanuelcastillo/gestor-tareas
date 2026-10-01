/**
 * Solo para los tests: fabrica un token con la forma de un JWT (cabecera.datos.firma).
 * La firma es falsa; al frontend solo le importa leer "exp" para saber si ha caducado.
 */
export function tokenDePrueba(segundosHastaCaducar: number): string {
  const base64url = (datos: object) =>
    btoa(JSON.stringify(datos)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + segundosHastaCaducar;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: '1', exp })}.firma-de-prueba`;
}

export const USUARIO_DE_PRUEBA = { id: 1, nombre: 'Ana', email: 'ana@example.com' };

/** Deja guardada una sesión en localStorage, como si el usuario ya hubiera entrado. */
export function guardarSesionDePrueba(segundosHastaCaducar = 3600): void {
  localStorage.setItem('token', tokenDePrueba(segundosHastaCaducar));
  localStorage.setItem('usuario', JSON.stringify(USUARIO_DE_PRUEBA));
}

export function borrarSesionDePrueba(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}
