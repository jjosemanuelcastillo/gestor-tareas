import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { borrarSesionDePrueba, guardarSesionDePrueba } from '../testing/token-de-prueba';

describe('authInterceptor', () => {
  const api = 'http://localhost:8080/api';
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    guardarSesionDePrueba();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    borrarSesionDePrueba();
  });

  it('should add the token to requests to our API', () => {
    http.get(`${api}/boards`).subscribe();

    const req = httpMock.expectOne(`${api}/boards`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${localStorage.getItem('token')}`);
    req.flush([]);
  });

  it('should not add the token to the login request', () => {
    http.post(`${api}/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${api}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not send the token to other websites', () => {
    http.get('https://otra-web.com/datos').subscribe();

    const req = httpMock.expectOne('https://otra-web.com/datos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should log out when the API answers 401 (expired token)', () => {
    const logout = spyOn(TestBed.inject(AuthService), 'logout');

    http.get(`${api}/boards`).subscribe({ error: () => {} });
    httpMock.expectOne(`${api}/boards`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalledWith('caducada');
  });

  it('should NOT log out when the login answers 401 (wrong password)', () => {
    const logout = spyOn(TestBed.inject(AuthService), 'logout');

    http.post(`${api}/auth/login`, {}).subscribe({ error: () => {} });
    httpMock.expectOne(`${api}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
  });
});
