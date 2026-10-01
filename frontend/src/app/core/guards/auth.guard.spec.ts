import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard, invitadoGuard } from './auth.guard';
import { borrarSesionDePrueba, guardarSesionDePrueba } from '../testing/token-de-prueba';

describe('Guards de sesión', () => {
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = (url: string) => ({ url }) as RouterStateSnapshot;

  beforeEach(() => {
    borrarSesionDePrueba();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => borrarSesionDePrueba());

  function ejecutar(guard: typeof authGuard, url = '/'): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => guard(ruta, estado(url))) as boolean | UrlTree;
  }

  function comoTexto(resultado: boolean | UrlTree): string {
    return resultado instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultado) : String(resultado);
  }

  describe('authGuard', () => {
    it('should send you to /login (remembering where you were going) if there is no session', () => {
      expect(comoTexto(ejecutar(authGuard, '/boards/3'))).toBe('/login?volver=%2Fboards%2F3');
    });

    it('should let you in with a valid session', () => {
      guardarSesionDePrueba();
      expect(ejecutar(authGuard)).toBeTrue();
    });

    it('should say the session has expired if the token is too old', () => {
      guardarSesionDePrueba(-60);

      expect(comoTexto(ejecutar(authGuard, '/'))).toBe('/login?volver=%2F&motivo=caducada');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('invitadoGuard', () => {
    it('should let you see /login if you are not logged in', () => {
      expect(ejecutar(invitadoGuard)).toBeTrue();
    });

    it('should send you to your boards if you are already logged in', () => {
      guardarSesionDePrueba();
      expect(comoTexto(ejecutar(invitadoGuard))).toBe('/');
    });
  });
});
