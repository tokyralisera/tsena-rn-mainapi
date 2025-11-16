/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utilisateur } from './entitites/user.entity';
import { Langue, Role, Sexe } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UtilisateursService {
  constructor(private readonly prismaService: PrismaService) { }

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

  async findById(id: number): Promise<Omit<Utilisateur, 'password'> | null> {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        NIF: true,
        STAT: true,
        telephone: true,
        role: true,
        sexe: true,
        langue: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur non trouvee`);
    }
    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id: userId }
    });
    if (!user) { throw new NotFoundException('Utilisateur non trouvee') }

    // Vérifier si le numéro téléphone a été déjà assigné à un utilisateur
    if (updateProfileDto.telephone && updateProfileDto.telephone !== user.telephone) {
      const existingUser = await this.prismaService.utilisateur.findUnique({ where: { telephone: updateProfileDto.telephone } });
      if (existingUser) { throw new ConflictException('Numero de telephone deja utilisee') }
    }

    // Vérifier si le numéro NIF a été déjà assigné à un utilisateur
    if (updateProfileDto.NIF && updateProfileDto.NIF !== user.NIF) {
      const existingUser = await this.prismaService.utilisateur.findUnique({ where: { NIF: updateProfileDto.NIF } });
      if (existingUser) { throw new ConflictException('Numero NIF deja utilisee') }
    }

    // Vérifier si le numéro STAT a été déjà assigné à un utilisateur
    if (updateProfileDto.STAT && updateProfileDto.STAT !== user.STAT) {
      const existingUser = await this.prismaService.utilisateur.findUnique({ where: { STAT: updateProfileDto.STAT } });
      if (existingUser) { throw new ConflictException('Numero STAT deja utilisee') }
    }

    const updateUser = await this.prismaService.utilisateur.update({
      where: { id: userId },
      data: updateProfileDto
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updateUser;
    return result;
  }

  /**
   * Récupérer tous les utilisateurs avec pagination et filtres
   */
  async findAll(query: GetUsersQueryDto) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    // Construire les conditions de recherche
    const where: any = {};

    if (search) {
      where.OR = [
        { nomUtilisateur: { contains: search, mode: 'insensitive' } },
        { prenomUtilisateur: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
        { NIF: { contains: search } },
        { STAT: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Récupérer les utilisateurs avec comptage des publications
    const [users, total] = await Promise.all([
      this.prismaService.utilisateur.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nomUtilisateur: true,
          prenomUtilisateur: true,
          NIF: true,
          STAT: true,
          telephone: true,
          role: true,
          sexe: true,
          langue: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          publications: {
            select: {
              id: true,
              offre: {
                select: {
                  id: true,
                },
              },
              demande: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.utilisateur.count({ where }),
    ]);

    // Transformer les données pour avoir le bon format avec _count
    const usersWithCount = users.map(user => {
      const offresCount = user.publications.filter(pub => pub.offre !== null).length;
      const demandesCount = user.publications.filter(pub => pub.demande !== null).length;

      // Retirer publications et ajouter _count
      const { publications, ...userWithoutPublications } = user;

      return {
        ...userWithoutPublications,
        _count: {
          offres: offresCount,
          demandes: demandesCount,
        },
      };
    });

    return {
      data: usersWithCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Changer le rôle d'un utilisateur
   */
  async updateUserRole(userId: number, updateRoleDto: UpdateRoleDto, adminId: number) {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (userId === adminId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier votre propre rôle');
    }

    const updatedUser = await this.prismaService.utilisateur.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        NIF: true,
        STAT: true,
        telephone: true,
        role: true,
        sexe: true,
        langue: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId: number, adminId: number) {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (userId === adminId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }

    // Supprimer l'utilisateur (cascade delete géré par Prisma)
    await this.prismaService.utilisateur.delete({
      where: { id: userId },
    });

    return { deleted: true };
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUsersStats() {
    const [totalUsers, usersByRole, recentUsers] = await Promise.all([
      // Total d'utilisateurs
      this.prismaService.utilisateur.count(),

      // Répartition par rôle
      this.prismaService.utilisateur.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      }),

      // Utilisateurs récents (derniers 5)
      this.prismaService.utilisateur.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          nomUtilisateur: true,
          prenomUtilisateur: true,
          telephone: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    // Formater les données par rôle
    const formattedUsersByRole = usersByRole.map((item) => ({
      role: item.role,
      count: item._count.id,
    }));

    return {
      totalUsers,
      usersByRole: formattedUsersByRole,
      activeUsers: totalUsers,
      inactiveUsers: 0,
      recentUsers,
    };
  }

  /**
  * Récupérer un utilisateur par ID avec comptage des publications
  */
  async findByIdWithCount(id: number) {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        NIF: true,
        STAT: true,
        telephone: true,
        role: true,
        sexe: true,
        langue: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        publications: {
          select: {
            id: true,
            offre: {
              select: {
                id: true,
              },
            },
            demande: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur non trouvé`);
    }

    // Compter les offres et demandes
    const offresCount = user.publications.filter(pub => pub.offre !== null).length;
    const demandesCount = user.publications.filter(pub => pub.demande !== null).length;

    // Retirer publications et ajouter _count
    const { publications, ...userWithoutPublications } = user;

    return {
      ...userWithoutPublications,
      _count: {
        offres: offresCount,
        demandes: demandesCount,
      },
    };
  }
}