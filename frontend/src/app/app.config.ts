import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { servidorLentoInterceptor } from './core/interceptors/servidor-lento.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // authInterceptor añade el token; servidorLentoInterceptor avisa si el servidor tarda en despertar
    provideHttpClient(withInterceptors([authInterceptor, servidorLentoInterceptor])),
  ]
};
