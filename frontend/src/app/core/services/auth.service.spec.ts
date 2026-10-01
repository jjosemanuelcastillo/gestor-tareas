import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService, tokenCaducado } from './auth.service';
import {
  borrarSesionDePrueba, guardarSesionDePrueba, tokenDePrueba, USUARIO_DE_PRUEBA,
} from '../testing/token-de-prueba';

describe('AuthService', () => {
  const api = 'http://localhost:8080/api/auth';
  let httpMock: HttpTestingController;

  beforeEach(() => {
    borrarSesionDePrueba();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    borrarSesionDePrueba();
  });

  it('should save the session after logging in', () => {
    const auth = TestBed.inject(AuthService);
    const token = tokenDePrueba(3600);

    auth.login({ email: 'ana@example.com', password: 'secreto123' }).subscribe();
    const req = httpMock.expectOne(`${api}/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token, usuario: USUARIO_DE_PRUEBA });

    expect(auth.usuario()).toEqual(USUARIO_DE_PRUEBA);
    expect(auth.token()).toBe(token);
    expect(auth.estaAutenticado()).toBeTrue();
  });

  it('should save the session after registering', () => {
    const auth = TestBed.inject(AuthService);

    auth.registro({ nombre: 'Ana', email: 'ana@example.com', password: 'secreto123' }).subscribe();
    httpMock.expectOne(`${api}/register`).flush({ token: tokenDePrueba(3600), usuario: USUARIO_DE_PRUEBA });

    expect(auth.estaAutenticado()).toBeTrue();
  });

  it('should not save anything if the login fails', () => {
    const auth = TestBed.inject(AuthService);

    auth.login({ email: 'ana@example.com', password: 'mala' }).subscribe({ error: () => {} });
    httpMock.expectOne(`${api}/login`).flush({ message: 'Email o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.usuario()).toBeNull();
    expect(auth.token()).toBeNull();
  });

  it('should keep the session after reloading the page', () => {
    guardarSesionDePrueba();

    const auth = TestBed.inject(AuthService); // el servicio se crea de nuevo, como al recargar

    expect(auth.usuario()?.nombre).toBe('Ana');
    expect(auth.estaAutenticado()).toBeTrue();
  });

  it('should not restore a session whose token has expired', () => {
    guardarSesionDePrueba(-60); // caducó hace un minuto

    const auth = TestBed.inject(AuthService);

    expect(auth.usuario()).toBeNull();
    expect(auth.estaAutenticado()).toBeFalse();
  });

  it('should clear the session and go to /login when logging out', () => {
    guardarSesionDePrueba();
    const auth = TestBed.inject(AuthService);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    auth.logout('caducada');

    expect(auth.usuario()).toBeNull();
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { motivo: 'caducada' } });
  });

  it('should know when a token has expired', () => {
    expect(tokenCaducado(tokenDePrueba(3600))).toBeFalse();
    expect(tokenCaducado(tokenDePrueba(-1))).toBeTrue();
    expect(tokenCaducado('esto-no-es-un-token')).toBeTrue();
  });
});
