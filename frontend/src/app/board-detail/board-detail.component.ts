import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../core/services/board.service';
import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';
import { TaskService } from '../core/services/task.service';

@Component({
  selector: 'app-board-detail',
  imports: [FormsModule, RouterLink],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.css',
})
export class BoardDetailComponent implements OnInit {
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  id = input.required<string>();
  board = signal<Board | null>(null);
  tasks = signal<Task[]>([]);
  nuevoTitulo = '';
  nuevaDescripcion = '';

  ngOnInit(): void {
    this.boardService.getById(Number(this.id())).subscribe({
      next: (board) => this.board.set(board),
    });

    this.taskService.getAll(Number(this.id())).subscribe({
      next: (tasks) => this.tasks.set(tasks),
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
}
