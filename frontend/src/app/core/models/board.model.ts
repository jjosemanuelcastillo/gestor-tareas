import { User } from "./user.model";

export interface Board {
  id?: number;
  nombre: string;
  descripcion: string;
  owner?: User;
}
