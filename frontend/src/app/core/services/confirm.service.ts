import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligro?: boolean; // botón rojo para acciones como borrar
}

interface Peticion extends ConfirmOptions {
  resolver: (ok: boolean) => void;
}

/**
 * Sustituye al confirm() del navegador. Cualquier componente llama a
 * pedir() y espera la respuesta; la ventana la pinta ConfirmDialogComponent,
 * que está una sola vez en AppComponent.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private peticionActual = signal<Peticion | null>(null);
  readonly peticion = this.peticionActual.asReadonly();

  /** Abre la ventana y devuelve true si el usuario confirma, false si cancela. */
  pedir(opciones: ConfirmOptions): Promise<boolean> {
    this.responder(false); // si ya había una abierta, se cancela
    return new Promise((resolver) => this.peticionActual.set({ ...opciones, resolver }));
  }

  responder(ok: boolean): void {
    const peticion = this.peticionActual();
    if (!peticion) return;
    this.peticionActual.set(null);
    peticion.resolver(ok);
  }
}
