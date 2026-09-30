import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

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
});
