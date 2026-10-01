import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ESPERA_ANTES_DEL_AVISO_MS, servidorLentoInterceptor } from './servidor-lento.interceptor';
import { ServidorService } from '../services/servidor.service';
import { environment } from '../../../environments/environment';

describe('servidorLentoInterceptor', () => {
  const url = `${environment.apiUrl}/boards`;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let servidor: ServidorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([servidorLentoInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    servidor = TestBed.inject(ServidorService);
  });

  afterEach(() => httpMock.verify());

  // fakeAsync + tick: el test controla el reloj, así no hay que esperar 4 segundos de verdad

  it('should not show the notice if the API answers quickly', fakeAsync(() => {
    http.get(url).subscribe();
    tick(1000);
    httpMock.expectOne(url).flush([]);
    tick(ESPERA_ANTES_DEL_AVISO_MS);

    expect(servidor.despertando()).toBeFalse();
  }));

  it('should show the notice while a request is slow and hide it when it answers', fakeAsync(() => {
    http.get(url).subscribe();
    tick(ESPERA_ANTES_DEL_AVISO_MS + 1);
    expect(servidor.despertando()).toBeTrue();

    httpMock.expectOne(url).flush([]);
    expect(servidor.despertando()).toBeFalse();
  }));

  it('should also hide the notice if the slow request fails', fakeAsync(() => {
    http.get(url).subscribe({ error: () => {} });
    tick(ESPERA_ANTES_DEL_AVISO_MS + 1);

    httpMock.expectOne(url).error(new ProgressEvent('error'));

    expect(servidor.despertando()).toBeFalse();
  }));

  it('should keep the notice until every slow request has answered', fakeAsync(() => {
    http.get(`${url}/1`).subscribe();
    http.get(`${url}/2`).subscribe();
    tick(ESPERA_ANTES_DEL_AVISO_MS + 1);

    httpMock.expectOne(`${url}/1`).flush({});
    expect(servidor.despertando()).toBeTrue();

    httpMock.expectOne(`${url}/2`).flush({});
    expect(servidor.despertando()).toBeFalse();
  }));

  it('should ignore requests to other websites', fakeAsync(() => {
    http.get('https://otra-web.com/datos').subscribe();
    tick(ESPERA_ANTES_DEL_AVISO_MS + 1);

    expect(servidor.despertando()).toBeFalse();
    httpMock.expectOne('https://otra-web.com/datos').flush({});
  }));
});
