import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmService } from '../../core/services/confirm.service';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let service: ConfirmService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    service = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  afterEach(() => service.responder(false)); // que ningún test deje la ventana abierta

  function dialogo(): HTMLDialogElement {
    return (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
  }

  function boton(texto: string): HTMLButtonElement {
    const botones = Array.from(dialogo().querySelectorAll('button'));
    return botones.find((b) => b.textContent?.trim() === texto)!;
  }

  function abrir(): Promise<boolean> {
    const respuesta = service.pedir({
      titulo: 'Borrar tarea',
      mensaje: 'Se borrará la tarea "Login".',
      textoConfirmar: 'Borrar',
      peligro: true,
    });
    fixture.detectChanges();
    return respuesta;
  }

  it('should be closed when nothing is asked', () => {
    expect(dialogo().open).toBeFalse();
  });

  it('should open with the title, the message and the buttons', () => {
    abrir();

    expect(dialogo().open).toBeTrue();
    expect(dialogo().textContent).toContain('Borrar tarea');
    expect(dialogo().textContent).toContain('Se borrará la tarea "Login".');
    expect(boton('Borrar').className).toContain('bg-red-600');
  });

  it('should answer true and close when pressing the confirm button', async () => {
    const respuesta = abrir();

    boton('Borrar').click();
    fixture.detectChanges();

    expect(await respuesta).toBeTrue();
    expect(dialogo().open).toBeFalse();
  });

  it('should answer false when pressing Cancelar', async () => {
    const respuesta = abrir();

    boton('Cancelar').click();

    expect(await respuesta).toBeFalse();
  });

  it('should answer false when pressing Escape', async () => {
    const respuesta = abrir();

    dialogo().dispatchEvent(new Event('cancel', { cancelable: true })); // lo que lanza el navegador con Escape

    expect(await respuesta).toBeFalse();
  });
});
