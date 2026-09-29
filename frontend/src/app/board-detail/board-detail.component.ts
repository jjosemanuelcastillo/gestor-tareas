import { User } from './../core/models/user.model';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../core/services/board.service';
import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';
import { TaskService } from '../core/services/task.service';
import { UserService } from '../core/services/user.service';

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

  id = input.required<string>();
  board = signal<Board | null>(null);
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);

  nuevoTitulo = '';
  nuevaDescripcion = '';

  ngOnInit(): void {
    this.boardService.getById(Number(this.id())).subscribe({
      next: (board) => this.board.set(board),
    });

    this.taskService.getAll(Number(this.id())).subscribe({
      next: (tasks) => this.tasks.set(tasks),
    });

    this.userService.getAll().subscribe({
      next: (users) => this.users.set(users),
    });
  }

  crearTarea() {
    const titulo = this.nuevoTitulo.trim();

    if (!titulo) return;

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
    });
  }

  cambiarEstado(task: Task, estado: string): void {
    const actualizada: Task = { ...task, estado };

    this.taskService.update(task.id!, actualizada).subscribe({
      next: (guardada) =>
        this.tasks.update((lista) =>
          lista.map((t) => (t.id === guardada.id ? guardada : t)),
        ),
    });
  }

  borrarTarea(task: Task): void {
    if (!confirm(`¿Borrar la tarea "${task.titulo}"?`)) return;

    this.taskService.delete(task.id!).subscribe({
      next: () =>
        this.tasks.update((lista) => lista.filter((t) => t.id !== task.id)),
    });
  }

  asignarPersona(task: Task, userId: string): void {
    const persona = this.users().find((u) => u.id == Number(userId));
    const actualizada: Task = { ...task, assignedUser: persona };

    //actualizar tarea
    this.taskService.update(task.id!, actualizada).subscribe({
      next: (guardada) =>
        this.tasks.update((lista) =>
          lista.map((t) => (t.id === guardada.id ? guardada : t)),
        ),
    });
  }
}
