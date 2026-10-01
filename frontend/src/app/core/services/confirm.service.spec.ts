import { TestBed } from '@angular/core/testing';

import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmService);
  });

  it('should have no open request at the start', () => {
    expect(service.peticion()).toBeNull();
  });

  it('should resolve true when the user confirms', async () => {
    const respuesta = service.pedir({ titulo: 'Borrar tarea', mensaje: '¿Seguro?' });
    expect(service.peticion()?.titulo).toBe('Borrar tarea');

    service.responder(true);

    expect(await respuesta).toBeTrue();
    expect(service.peticion()).toBeNull();
  });

  it('should resolve false when the user cancels', async () => {
    const respuesta = service.pedir({ titulo: 'Borrar tarea', mensaje: '¿Seguro?' });

    service.responder(false);

    expect(await respuesta).toBeFalse();
  });

  it('should cancel the previous request if a new one is opened', async () => {
    const primera = service.pedir({ titulo: 'Primera', mensaje: '' });
    service.pedir({ titulo: 'Segunda', mensaje: '' });

    expect(await primera).toBeFalse();
    expect(service.peticion()?.titulo).toBe('Segunda');
  });
});
