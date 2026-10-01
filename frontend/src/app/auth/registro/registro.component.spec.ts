import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { RegistroComponent } from './registro.component';
import { borrarSesionDePrueba, tokenDePrueba, USUARIO_DE_PRUEBA } from '../../core/testing/token-de-prueba';

describe('RegistroComponent', () => {
  const url = 'http://localhost:8080/api/auth/register';
  let fixture: ComponentFixture<RegistroComponent>;
  let component: RegistroComponent;
  let httpMock: HttpTestingController;
  let navigateByUrl: jasmine.Spy;

  beforeEach(async () => {
    borrarSesionDePrueba();
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
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

  function crearCuentaCon(nombre: string, email: string, password: string): void {
    component.nombre = nombre;
    component.email = email;
    component.password = password;
    component.crearCuenta();
  }

  it('should check the data before calling the server', () => {
    crearCuentaCon('', 'esto-no-es-un-email', 'corta');
    fixture.detectChanges();

    expect(texto()).toContain('El nombre es obligatorio');
    expect(texto()).toContain('El email no tiene un formato válido');
    expect(texto()).toContain('La contraseña debe tener al menos 8 caracteres');
    httpMock.expectNone(url);
  });

  it('should create the account and go straight to the boards', () => {
    crearCuentaCon('Ana', 'ana@example.com', 'secreto123');

    const req = httpMock.expectOne(url);
    expect(req.request.body).toEqual({ nombre: 'Ana', email: 'ana@example.com', password: 'secreto123' });
    req.flush({ token: tokenDePrueba(3600), usuario: USUARIO_DE_PRUEBA }, { status: 201, statusText: 'Created' });

    expect(localStorage.getItem('token')).not.toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should show a repeated email next to the email field', () => {
    crearCuentaCon('Ana', 'ana@example.com', 'secreto123');
    httpMock.expectOne(url).flush(
      { status: 409, message: 'Ya existe una cuenta con ese email' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    const errorEmail = (fixture.nativeElement as HTMLElement).querySelector('#email-error');
    expect(errorEmail?.textContent).toContain('Ya existe una cuenta con ese email');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show the field errors that the server sends back', () => {
    crearCuentaCon('Ana', 'ana@example.com', 'secreto123');
    httpMock.expectOne(url).flush(
      { status: 400, message: 'Hay datos no válidos', errores: { nombre: 'El nombre no puede tener más de 100 caracteres' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('El nombre no puede tener más de 100 caracteres');
  });
});
