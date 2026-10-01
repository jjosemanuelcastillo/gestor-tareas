import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { borrarSesionDePrueba, tokenDePrueba, USUARIO_DE_PRUEBA } from '../../core/testing/token-de-prueba';

describe('LoginComponent', () => {
  const url = 'http://localhost:8080/api/auth/login';
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;
  let navigateByUrl: jasmine.Spy;

  beforeEach(async () => {
    borrarSesionDePrueba();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    borrarSesionDePrueba();
  });

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function entrarCon(email: string, password: string): void {
    component.email = email;
    component.password = password;
    component.entrar();
  }

  it('should ask for the fields without calling the server if they are empty', () => {
    entrarCon('', '');
    fixture.detectChanges();

    expect(texto()).toContain('El email es obligatorio');
    expect(texto()).toContain('La contraseña es obligatoria');
    httpMock.expectNone(url);
  });

  it('should log in and go to the boards', () => {
    entrarCon(' ana@example.com ', 'secreto123');

    const req = httpMock.expectOne(url);
    expect(req.request.body).toEqual({ email: 'ana@example.com', password: 'secreto123' });
    req.flush({ token: tokenDePrueba(3600), usuario: USUARIO_DE_PRUEBA });

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should go back to where you were going after logging in', () => {
    fixture.componentRef.setInput('volver', '/boards/3');
    entrarCon('ana@example.com', 'secreto123');
    httpMock.expectOne(url).flush({ token: tokenDePrueba(3600), usuario: USUARIO_DE_PRUEBA });

    expect(navigateByUrl).toHaveBeenCalledWith('/boards/3');
  });

  it('should not go to another website even if "volver" says so', () => {
    fixture.componentRef.setInput('volver', '//web-de-un-atacante.com');
    entrarCon('ana@example.com', 'secreto123');
    httpMock.expectOne(url).flush({ token: tokenDePrueba(3600), usuario: USUARIO_DE_PRUEBA });

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should show the server message when the password is wrong', () => {
    entrarCon('ana@example.com', 'mala12345');
    httpMock.expectOne(url).flush(
      { status: 401, message: 'Email o contraseña incorrectos' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('Email o contraseña incorrectos');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should say the session has expired when coming from an expired session', () => {
    fixture.componentRef.setInput('motivo', 'caducada');
    fixture.detectChanges();

    expect(texto()).toContain('Tu sesión ha caducado');
  });
});
