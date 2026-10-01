import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  theme = inject(ThemeService);
  menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  cambiarTema(): void {
    this.theme.toggleTheme();
    this.menuAbierto.set(false);
  }
}
