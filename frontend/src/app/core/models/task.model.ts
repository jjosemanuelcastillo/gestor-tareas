import { Board } from "./board.model";
import { User } from "./user.model";

export interface Task {
  id?: number;
  titulo: string;
  descripcion: string;
  estado: string;
  board?: Board;
  assignedUser?: User;
}
