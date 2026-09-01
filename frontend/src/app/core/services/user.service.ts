import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/users';
  constructor() { }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getById(id:number): Observable<User>{
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(user:User): Observable<User>{
    return this.http.post<User>(this.baseUrl,user);
  }

  updateUser(user:User): Observable<User>{
    return this.http.put<User>(this.baseUrl,user);
  }
}
