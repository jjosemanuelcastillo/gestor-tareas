// Configuración para desarrollo (ng serve) y para los tests.
// Al compilar para producción (ng build), Angular lo cambia por environment.prod.ts
// (ver "fileReplacements" en angular.json).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
