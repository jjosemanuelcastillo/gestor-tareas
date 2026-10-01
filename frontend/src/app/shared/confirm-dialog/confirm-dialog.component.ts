import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
  private dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    // Abre o cierra el <dialog> según haya una petición pendiente
    effect(() => {
      const dialogo = this.dialogo().nativeElement;
      if (this.confirm.peticion()) {
        if (!dialogo.open) dialogo.showModal();
      } else if (dialogo.open) {
        dialogo.close();
      }
    });
  }

  /** Pulsar fuera de la ventana (en el fondo oscuro) cuenta como cancelar. */
  alPulsarFondo(event: MouseEvent): void {
    if (event.target === this.dialogo().nativeElement) {
      this.confirm.responder(false);
    }
  }

  /** La tecla Escape cierra el <dialog> por su cuenta; aquí lo tratamos como cancelar. */
  alCancelar(event: Event): void {
    event.preventDefault();
    this.confirm.responder(false);
  }
}
