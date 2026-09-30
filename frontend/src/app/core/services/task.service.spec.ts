import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TaskService } from './task.service';
import { Task } from '../models/task.model';

describe('TaskService', () => {
  const baseUrl = 'http://localhost:8080/api/tasks';
  const tarea: Task = {
    id: 5,
    titulo: 'Diseñar wireframes',
    descripcion: '',
    estado: 'pendiente',
    board: { id: 2, nombre: 'Proyecto DAW', descripcion: '' },
  };

  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get only the tasks of one board', () => {
    let recibidas: Task[] = [];
    service.getAll(2).subscribe((tasks) => (recibidas = tasks));

    const req = httpMock.expectOne(`${baseUrl}?boardId=2`);
    expect(req.request.method).toBe('GET');
    req.flush([tarea]);

    expect(recibidas).toEqual([tarea]);
  });

  it('should get all the tasks when no board is given', () => {
    service.getAll().subscribe();

    httpMock.expectOne(baseUrl).flush([]);
  });

  it('should create a task with POST', () => {
    service.create(tarea).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(tarea);
    req.flush(tarea);
  });

  it('should update a task with PUT', () => {
    service.update(5, tarea).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(tarea);
    req.flush(tarea);
  });

  it('should delete a task with DELETE', () => {
    service.delete(5).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
