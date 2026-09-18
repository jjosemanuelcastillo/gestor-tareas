import { Routes } from '@angular/router';
import { BoardListComponent } from './board-list/board-list.component';
import { BoardDetailComponent } from './board-detail/board-detail.component';

export const routes: Routes = [
  { path: '', component: BoardListComponent },
  { path: 'boards/:id', component: BoardDetailComponent },
  { path: '**', redirectTo: '' }
];
