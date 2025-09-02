import { Langue, Role, Sexe } from '@prisma/client';

export class Utilisateur {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  NIF: string;
  STAT: string;
  telephone: string;
  password: string;
  role: Role;
  sexe: Sexe;
  langue: Langue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
