import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { ServidorService } from './core/services/servidor.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  theme = inject(ThemeService);
  auth = inject(AuthService);
  servidor = inject(ServidorService);
  menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  cambiarTema(): void {
    this.theme.toggleTheme();
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.menuAbierto.set(false);
    this.auth.logout();
  }
}
