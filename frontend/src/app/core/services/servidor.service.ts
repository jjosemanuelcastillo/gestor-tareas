import { computed, Injectable, signal } from '@angular/core';

/**
 * Sabe si hay peticiones a la API que están tardando mucho. En el plan gratuito de Render,
 * el backend se "duerme" tras 15 minutos sin visitas y tarda hasta un minuto en despertar:
 * mientras tanto, la app enseña un aviso en vez de parecer rota.
 */
@Injectable({
  providedIn: 'root'
})
export class ServidorService {
  private peticionesLentas = signal(0);

  /** true mientras haya al menos una petición que tarda más de lo normal. */
  readonly despertando = computed(() => this.peticionesLentas() > 0);

  empiezaPeticionLenta(): void {
    this.peticionesLentas.update((n) => n + 1);
  }

  terminaPeticionLenta(): void {
    this.peticionesLentas.update((n) => Math.max(0, n - 1));
  }
}
