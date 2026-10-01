import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { ServidorService } from './core/services/servidor.service';
import { borrarSesionDePrueba, guardarSesionDePrueba } from './core/testing/token-de-prueba';

describe('AppComponent', () => {
  beforeEach(async () => {
    borrarSesionDePrueba();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => borrarSesionDePrueba());

  function textoDelMenuAbierto(): string {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.menuAbierto.set(true);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the title as a link to the home page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('h1 a');
    expect(link?.textContent).toContain('Gestor de tareas');
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('should close the menu after changing the theme', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.menuAbierto.set(true);
    app.cambiarTema();
    expect(app.menuAbierto()).toBeFalse();
  });

  it('should show who is logged in and the "Cerrar sesión" option', () => {
    guardarSesionDePrueba();

    const texto = textoDelMenuAbierto();

    expect(texto).toContain('Ana');
    expect(texto).toContain('Cerrar sesión');
  });

  it('should not show "Cerrar sesión" without a session', () => {
    expect(textoDelMenuAbierto()).not.toContain('Cerrar sesión');
  });

  it('should log out and close the menu', () => {
    guardarSesionDePrueba();
    const fixture = TestBed.createComponent(AppComponent);
    const logout = spyOn(TestBed.inject(AuthService), 'logout');
    fixture.componentInstance.menuAbierto.set(true);

    fixture.componentInstance.cerrarSesion();

    expect(logout).toHaveBeenCalled();
    expect(fixture.componentInstance.menuAbierto()).toBeFalse();
  });

  it('should show the "waking up the server" notice only while the server is slow', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const servidor = TestBed.inject(ServidorService);
    const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    fixture.detectChanges();
    expect(texto()).not.toContain('Despertando el servidor');

    servidor.empiezaPeticionLenta();
    fixture.detectChanges();
    expect(texto()).toContain('Despertando el servidor');

    servidor.terminaPeticionLenta();
    fixture.detectChanges();
    expect(texto()).not.toContain('Despertando el servidor');
  });
});
