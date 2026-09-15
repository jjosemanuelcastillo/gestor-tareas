import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/boards';
  constructor() { }

  geAll(): Observable<Board[]>{
    return this.http.get<Board[]>(this.baseUrl);
  }
  getById(id: number): Observable<Board>{
    return this.http.get<Board>(`${this.baseUrl}/${id}`);
  }
  createBoard(board: Board): Observable<Board>{
    return this.http.post<Board>(this.baseUrl,board);
  }
  updateBoard(id:number, board: Board): Observable<Board>{
    return this.http.put<Board>(`${this.baseUrl}/${id}`,board);
  }
  deleteBoard(id: number): Observable<Board>{
    return this.http.delete<Board>(`${this.baseUrl}/${id}`);
  }
}
