import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BoardService } from './board.service';
import { Board } from '../models/board.model';

describe('BoardService', () => {
  const baseUrl = 'http://localhost:8080/api/boards';
  const tablero: Board = { id: 2, nombre: 'Proyecto DAW', descripcion: 'Tareas del proyecto final' };

  let service: BoardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Comprueba que ningún test deja peticiones sin responder
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all the boards', () => {
    let recibidos: Board[] = [];
    service.getAll().subscribe((boards) => (recibidos = boards));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([tablero]);

    expect(recibidos).toEqual([tablero]);
  });

  it('should get one board by id', () => {
    service.getById(2).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('GET');
    req.flush(tablero);
  });

  it('should create a board with POST', () => {
    const nuevo: Board = { nombre: 'Casa', descripcion: '' };
    service.createBoard(nuevo).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevo);
    req.flush({ ...nuevo, id: 3 });
  });

  it('should update a board with PUT', () => {
    service.updateBoard(2, tablero).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(tablero);
    req.flush(tablero);
  });

  it('should delete a board with DELETE', () => {
    service.deleteBoard(2).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
