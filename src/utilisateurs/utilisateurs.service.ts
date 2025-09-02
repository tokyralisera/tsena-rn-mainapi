import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utilisateur } from './entitites/user.entity';
import { Langue, Role, Sexe } from '@prisma/client';

@Injectable()
export class UtilisateursService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByTelephone(telephone: string): Promise<Utilisateur | null> {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { telephone },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }
    return user;
  }

  async createUtilisateur(userData: {
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
  }): Promise<Utilisateur> {
    return this.prismaService.utilisateur.create({ data: userData });
  }

  async findById(id: number): Promise<Utilisateur | null> {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }
    return user;
  }
}
