import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  function limpiar(): void {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
  }

  beforeEach(() => {
    limpiar();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => limpiar());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should switch between light and dark', () => {
    service.theme.set('light');
    service.toggleTheme();
    expect(service.theme()).toBe('dark');

    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });

  it('should add the dark class to <html> and remember the choice', () => {
    service.theme.set('dark');
    TestBed.flushEffects(); // ejecuta el effect() del servicio

    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should start with the theme saved in localStorage', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('theme', 'dark');

    const nuevo = TestBed.inject(ThemeService);

    expect(nuevo.theme()).toBe('dark');
  });
});
