import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BoardService } from '../core/services/board.service';
import { Board } from '../core/models/board.model';

@Component({
  selector: 'app-board-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css'
})
export class BoardListComponent implements OnInit {
  private boardService = inject(BoardService);

  boards = signal<Board[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  nuevoNombre = '';
  nuevaDescripcion = '';

  ngOnInit(): void {
    this.cargarBoards();
  }

  cargarBoards(): void {
    this.cargando.set(true);
    this.boardService.getAll().subscribe({
      next: boards => {
        this.boards.set(boards);
        this.error.set(null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor. ¿Está arrancado el backend?');
        this.cargando.set(false);
      }
    });
  }

  crearBoard(): void {
    const nombre = this.nuevoNombre.trim();
    if (!nombre) return;

    this.boardService.createBoard({ nombre, descripcion: this.nuevaDescripcion.trim() }).subscribe({
      next: board => {
        this.boards.update(boards => [...boards, board]);
        this.nuevoNombre = '';
        this.nuevaDescripcion = '';
      },
      error: () => this.error.set('No se pudo crear el tablero.')
    });
  }

  borrarBoard(board: Board, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!board.id || !confirm(`¿Borrar el tablero "${board.nombre}" y todas sus tareas?`)) return;

    this.boardService.deleteBoard(board.id).subscribe({
      next: () => this.boards.update(boards => boards.filter(b => b.id !== board.id)),
      error: () => this.error.set('No se pudo borrar el tablero.')
    });
  }
}
