import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { leerErrorApi } from '../../core/utils/error-api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Vienen de la URL (?motivo=caducada&volver=/boards/3) gracias a withComponentInputBinding
  motivo = input<string>();
  volver = input<string>();

  email = '';
  password = '';
  mostrarPassword = signal(false);
  enviando = signal(false);
  error = signal<string | null>(null);
  errores = signal<Record<string, string>>({});

  entrar(): void {
    this.error.set(null);

    // Comprobación rápida en el navegador, antes de molestar al servidor
    const errores: Record<string, string> = {};
    if (!this.email.trim()) errores['email'] = 'El email es obligatorio';
    if (!this.password) errores['password'] = 'La contraseña es obligatoria';
    this.errores.set(errores);
    if (Object.keys(errores).length > 0) return;

    this.enviando.set(true);
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(this.destino()),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        const { mensaje, campos } = leerErrorApi(err, 'No se pudo iniciar sesión.');
        this.error.set(mensaje);
        this.errores.set(campos);
      },
    });
  }

  /** A dónde ir después de entrar: donde ibas, pero solo si es una ruta de esta app. */
  private destino(): string {
    const volver = this.volver();
    return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}
