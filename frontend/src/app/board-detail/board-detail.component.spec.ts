import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BoardDetailComponent } from './board-detail.component';
import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';
import { User } from '../core/models/user.model';

describe('BoardDetailComponent', () => {
  const api = 'http://localhost:8080/api';

  const tablero: Board = { id: 2, nombre: 'Proyecto DAW', descripcion: 'Tareas del proyecto final' };
  const ana: User = { id: 1, nombre: 'Ana', email: 'ana@example.com' };
  const jose: User = { id: 2, nombre: 'José', email: 'jose@example.com' };
  const tareas: Task[] = [
    { id: 10, titulo: 'Diseñar wireframes', descripcion: '', estado: 'pendiente', board: tablero, assignedUser: ana },
    { id: 11, titulo: 'Añadir login', descripcion: '', estado: 'pendiente', board: tablero },
    { id: 12, titulo: 'Cambiar estado', descripcion: '', estado: 'en_progreso', board: tablero, assignedUser: jose },
  ];

  let component: BoardDetailComponent;
  let fixture: ComponentFixture<BoardDetailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetailComponent);
    fixture.componentRef.setInput('id', '2'); // como si la URL fuera /boards/2
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // lanza ngOnInit: pide tablero, tareas y personas
  });

  afterEach(() => httpMock.verify());

  /** Responde a las tres peticiones de ngOnInit con los datos de prueba. */
  function cargar(): void {
    httpMock.expectOne(`${api}/boards/2`).flush(tablero);
    httpMock.expectOne(`${api}/tasks?boardId=2`).flush(tareas);
    httpMock.expectOne(`${api}/users`).flush([ana, jose]);
    fixture.detectChanges();
  }

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  /** Busca el desplegable ("Estado" o "Persona asignada") de la tarjeta con ese título. */
  function desplegable(titulo: string, etiqueta: string): HTMLSelectElement {
    const encabezados = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h4'));
    const tarjeta = encabezados.find((h) => h.textContent?.trim() === titulo)!.parentElement!;
    return tarjeta.querySelector<HTMLSelectElement>(`select[aria-label="${etiqueta}"]`)!;
  }

  /** Simula que el usuario elige una opción del desplegable. */
  function elegir(select: HTMLSelectElement, valor: string): void {
    select.value = valor;
    select.dispatchEvent(new Event('change'));
  }

  it('should create', () => {
    cargar();
    expect(component).toBeTruthy();
  });

  it('should split the tasks into columns by status', () => {
    cargar();

    expect(component.columnas().map((c) => c.tareas.length)).toEqual([2, 1, 0]);
    expect(texto()).toContain('Sin tareas');
  });

  it('should say the board does not exist when the API answers 404', () => {
    httpMock
      .expectOne(`${api}/boards/2`)
      .flush({ message: 'Board no encontrado' }, { status: 404, statusText: 'Not Found' });
    httpMock.expectOne(`${api}/tasks?boardId=2`).flush([]);
    httpMock.expectOne(`${api}/users`).flush([]);
    fixture.detectChanges();

    expect(texto()).toContain('Este tablero no existe.');
  });

  it('should keep the connection error even if other requests fail after it', () => {
    // Con el backend apagado fallan las tres. Antes se quedaba el mensaje de la última.
    httpMock.expectOne(`${api}/boards/2`).error(new ProgressEvent('error'));
    httpMock.expectOne(`${api}/tasks?boardId=2`).error(new ProgressEvent('error'));
    httpMock.expectOne(`${api}/users`).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(component.error()).toBe('No se pudo conectar con el servidor. ¿Está arrancado el backend?');
  });

  it('should create a pending task in the current board', () => {
    cargar();

    component.nuevoTitulo = 'Escribir tests';
    component.crearTarea();

    const req = httpMock.expectOne(`${api}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ titulo: 'Escribir tests', estado: 'pendiente', board: tablero }),
    );
    req.flush({ ...req.request.body, id: 13 });

    expect(component.tasks().length).toBe(4);
    expect(component.nuevoTitulo).toBe('');
  });

  it('should send the whole task when changing its status', () => {
    cargar();

    elegir(desplegable('Diseñar wireframes', 'Estado'), 'completada');

    const req = httpMock.expectOne(`${api}/tasks/10`);
    expect(req.request.method).toBe('PUT');
    // Todo igual (título, tablero, persona…) salvo el estado: si faltara algo, el backend lo borraría
    expect(req.request.body).toEqual({ ...tareas[0], estado: 'completada' });
    req.flush({ ...tareas[0], estado: 'completada' });
    fixture.detectChanges();

    expect(component.columnas()[2].tareas.map((t) => t.id)).toEqual([10]);
  });

  it('should put the status back in the select if saving fails', () => {
    cargar();
    const select = desplegable('Diseñar wireframes', 'Estado');

    elegir(select, 'completada');
    httpMock.expectOne(`${api}/tasks/10`).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(select.value).toBe('pendiente');
    expect(texto()).toContain('No se pudo cambiar el estado.');
  });

  it('should assign a person to a task', () => {
    cargar();

    elegir(desplegable('Añadir login', 'Persona asignada'), '2');

    const req = httpMock.expectOne(`${api}/tasks/11`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.assignedUser).toEqual(jose);
    req.flush({ ...tareas[1], assignedUser: jose });
  });

  it('should leave a task unassigned when choosing "Sin asignar"', () => {
    cargar();

    elegir(desplegable('Diseñar wireframes', 'Persona asignada'), '');

    const req = httpMock.expectOne(`${api}/tasks/10`);
    expect(req.request.body.assignedUser).toBeUndefined();
    req.flush({ ...tareas[0], assignedUser: null });
  });

  it('should delete a task after confirming', () => {
    cargar();
    spyOn(window, 'confirm').and.returnValue(true);

    component.borrarTarea(tareas[1]);

    const req = httpMock.expectOne(`${api}/tasks/11`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(component.tasks().map((t) => t.id)).toEqual([10, 12]);
  });

  it('should not delete a task if the user cancels', () => {
    cargar();
    spyOn(window, 'confirm').and.returnValue(false);

    component.borrarTarea(tareas[1]);

    httpMock.expectNone(`${api}/tasks/11`);
    expect(component.tasks().length).toBe(3);
  });
});
