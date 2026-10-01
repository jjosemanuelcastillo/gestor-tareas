import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BoardListComponent } from './board-list.component';
import { Board } from '../core/models/board.model';
import { ConfirmService } from '../core/services/confirm.service';

describe('BoardListComponent', () => {
  const baseUrl = 'http://localhost:8080/api/boards';
  const tableros: Board[] = [
    { id: 1, nombre: 'Proyecto DAW', descripcion: 'Tareas del proyecto final' },
    { id: 2, nombre: 'Casa', descripcion: '' },
  ];

  let component: BoardListComponent;
  let fixture: ComponentFixture<BoardListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // lanza ngOnInit, que pide los tableros
  });

  afterEach(() => httpMock.verify());

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('should create', () => {
    httpMock.expectOne(baseUrl).flush([]);
    expect(component).toBeTruthy();
  });

  it('should show the boards returned by the API', () => {
    httpMock.expectOne(baseUrl).flush(tableros);
    fixture.detectChanges();

    expect(texto()).toContain('Proyecto DAW');
    expect(texto()).toContain('Casa');
  });

  it('should show an error when the backend does not answer', () => {
    httpMock.expectOne(baseUrl).error(new ProgressEvent('error')); // como si estuviera apagado
    fixture.detectChanges();

    expect(texto()).toContain('No se pudo conectar con el servidor');
  });

  it('should create a board and add it to the list', () => {
    httpMock.expectOne(baseUrl).flush([]);

    component.nuevoNombre = '  Portfolio  ';
    component.crearBoard();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Portfolio', descripcion: '' });
    req.flush({ id: 3, nombre: 'Portfolio', descripcion: '' });

    expect(component.boards().map((b) => b.nombre)).toEqual(['Portfolio']);
    expect(component.nuevoNombre).toBe('');
  });

  it('should not create a board without a name', () => {
    httpMock.expectOne(baseUrl).flush([]);

    component.nuevoNombre = '   ';
    component.crearBoard();

    httpMock.expectNone(baseUrl);
  });

  it('should delete a board after confirming', async () => {
    httpMock.expectOne(baseUrl).flush(tableros);
    // el usuario pulsa "Borrar" en la ventana de confirmación
    const pedir = spyOn(TestBed.inject(ConfirmService), 'pedir').and.resolveTo(true);

    await component.borrarBoard(tableros[0], new Event('click'));

    expect(pedir).toHaveBeenCalledWith(jasmine.objectContaining({ peligro: true }));
    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(component.boards().map((b) => b.id)).toEqual([2]);
  });

  it('should not delete a board if the user cancels', async () => {
    httpMock.expectOne(baseUrl).flush(tableros);
    spyOn(TestBed.inject(ConfirmService), 'pedir').and.resolveTo(false); // pulsa "Cancelar"

    await component.borrarBoard(tableros[0], new Event('click'));

    httpMock.expectNone(`${baseUrl}/1`);
    expect(component.boards().length).toBe(2);
  });
});
