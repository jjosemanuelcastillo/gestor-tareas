import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user.service';
import { User } from '../models/user.model';

describe('UserService', () => {
  const baseUrl = 'http://localhost:8080/api/users';
  const persona: User = { id: 1, nombre: 'Ana', email: 'ana@example.com' };

  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all the people', () => {
    let recibidas: User[] = [];
    service.getAll().subscribe((users) => (recibidas = users));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([persona]);

    expect(recibidas).toEqual([persona]);
  });

  it('should get one person by id', () => {
    service.getById(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(persona);
  });

  it('should create a person with POST', () => {
    const nueva: User = { nombre: 'Carmen', email: 'carmen@example.com' };
    service.createUser(nueva).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nueva);
    req.flush({ ...nueva, id: 2 });
  });
});
