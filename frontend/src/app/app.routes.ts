import { Routes } from '@angular/router';
import { BoardListComponent } from './board-list/board-list.component';
import { BoardDetailComponent } from './board-detail/board-detail.component';
import { LoginComponent } from './auth/login/login.component';
import { RegistroComponent } from './auth/registro/registro.component';
import { authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [invitadoGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [invitadoGuard] },
  { path: '', component: BoardListComponent, canActivate: [authGuard] },
  { path: 'boards/:id', component: BoardDetailComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
