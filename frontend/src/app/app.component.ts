import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { UserService } from './core/services/user.service';
import { User } from './core/models/user.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  theme = inject(ThemeService);
  menuAbierto = signal(false);
  private userService = inject(UserService);
  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  ngOnInit(): void {
    //this.userService.getAll().subscribe(users => console.log(users));
    //this.userService.getById(1).subscribe(users => console.log(users));
  }
}
