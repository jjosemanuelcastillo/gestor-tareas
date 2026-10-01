import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { leerErrorApi } from '../../core/utils/error-api';

const PASSWORD_MINIMA = 8;

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly passwordMinima = PASSWORD_MINIMA;

  nombre = '';
  email = '';
  password = '';
  mostrarPassword = signal(false);
  enviando = signal(false);
  error = signal<string | null>(null);
  errores = signal<Record<string, string>>({});

  crearCuenta(): void {
    this.error.set(null);

    // Las mismas reglas que el backend, para avisar al momento
    const errores: Record<string, string> = {};
    if (!this.nombre.trim()) errores['nombre'] = 'El nombre es obligatorio';
    if (!this.email.trim()) errores['email'] = 'El email es obligatorio';
    else if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) errores['email'] = 'El email no tiene un formato válido';
    if (this.password.length < PASSWORD_MINIMA) errores['password'] = `La contraseña debe tener al menos ${PASSWORD_MINIMA} caracteres`;
    this.errores.set(errores);
    if (Object.keys(errores).length > 0) return;

    this.enviando.set(true);
    this.auth.registro({ nombre: this.nombre.trim(), email: this.email.trim(), password: this.password }).subscribe({
      // Al registrarse ya queda la sesión iniciada: directo a sus tableros
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        const { mensaje, campos } = leerErrorApi(err, 'No se pudo crear la cuenta.');
        // El email repetido (409) se enseña junto al campo email
        if (err.status === 409 && mensaje) {
          this.errores.set({ email: mensaje });
        } else {
          this.error.set(mensaje);
          this.errores.set(campos);
        }
      },
    });
  }
}
