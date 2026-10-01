import { User } from '../core/models/user.model';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Component,
  inject,
  input,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { BoardService } from '../core/services/board.service';
import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';
import { TaskService } from '../core/services/task.service';
import { UserService } from '../core/services/user.service';
import { ConfirmService } from '../core/services/confirm.service';

@Component({
  selector: 'app-board-detail',
  imports: [FormsModule, RouterLink],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.css',
})
export class BoardDetailComponent implements OnInit {
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private confirm = inject(ConfirmService);

  id = input.required<string>();
  board = signal<Board | null>(null);
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  error = signal<string | null>(null);

  columnas = computed(() =>
    [
      { estado: 'pendiente', titulo: 'Pendiente' },
      { estado: 'en_progreso', titulo: 'En progreso' },
      { estado: 'completada', titulo: 'Completada' },
    ].map((col) => ({
      ...col,
      tareas: this.tasks().filter((t) => t.estado === col.estado),
    })),
  );

  nuevoTitulo = '';
  nuevaDescripcion = '';

  ngOnInit(): void {
    this.boardService.getById(Number(this.id())).subscribe({
      next: (board) => this.board.set(board),
      error: (err) =>
        this.error.set(
          err.status === 404
            ? 'Este tablero no existe.'
            : 'No se pudo conectar con el servidor. ¿Está arrancado el backend?',
        ),
    });

    this.taskService.getAll(Number(this.id())).subscribe({
      next: (tasks) => this.tasks.set(tasks),
      // "e ?? ..." : solo pone este mensaje si no hay ya otro error más importante
      error: () =>
        this.error.update((e) => e ?? 'No se pudieron cargar las tareas.'),
    });

    this.userService.getAll().subscribe({
      next: (users) => this.users.set(users),
      error: () =>
        this.error.update((e) => e ?? 'No se pudieron cargar las personas.'),
    });
  }

  crearTarea(): void {
    const titulo = this.nuevoTitulo.trim();

    if (!titulo) return;

    this.error.set(null);

    const nueva: Task = {
      titulo,
      descripcion: this.nuevaDescripcion.trim(),
      estado: 'pendiente',
      board: this.board()!,
    };

    this.taskService.create(nueva).subscribe({
      next: (creada) => {
        this.tasks.update((lista) => [...lista, creada]); // añadir a la caja
        this.nuevoTitulo = ''; // vaciar el formulario
        this.nuevaDescripcion = '';
      },
      error: () => this.error.set('No se pudo crear la tarea.'),
    });
  }

  cambiarEstado(task: Task, select: HTMLSelectElement): void {
    const actualizada: Task = { ...task, estado: select.value };

    this.error.set(null);
    this.taskService.update(task.id!, actualizada).subscribe({
      next: (guardada) =>
        this.tasks.update((lista) =>
          lista.map((t) => (t.id === guardada.id ? guardada : t)),
        ),
      error: () => {
        this.error.set('No se pudo cambiar el estado.');
        select.value = task.estado; // el desplegable vuelve al estado real
      },
    });
  }

  async borrarTarea(task: Task): Promise<void> {
    const ok = await this.confirm.pedir({
      titulo: 'Borrar tarea',
      mensaje: `Se borrará la tarea "${task.titulo}". Esto no se puede deshacer.`,
      textoConfirmar: 'Borrar',
      peligro: true,
    });
    if (!ok) return;

    this.error.set(null);
    this.taskService.delete(task.id!).subscribe({
      next: () =>
        this.tasks.update((lista) => lista.filter((t) => t.id !== task.id)),
      error: () => this.error.set('No se pudo borrar la tarea.'),
    });
  }

  asignarPersona(task: Task, select: HTMLSelectElement): void {
    const persona = this.users().find((u) => u.id === Number(select.value));
    const actualizada: Task = { ...task, assignedUser: persona };

    this.error.set(null);
    this.taskService.update(task.id!, actualizada).subscribe({
      next: (guardada) =>
        this.tasks.update((lista) =>
          lista.map((t) => (t.id === guardada.id ? guardada : t)),
        ),
      error: () => {
        this.error.set('No se pudo asignar la persona.');
        select.value = String(task.assignedUser?.id ?? ''); // vuelve a la persona real
      },
    });
  }
}
