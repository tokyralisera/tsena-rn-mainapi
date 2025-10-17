import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVilleDto } from './dto/create-ville.dto';
import { UpdateVilleDto } from './dto/update-ville.dto';

@Injectable()
export class VilleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVilleDto) {
    try {
      //? Verifier si le pays existe
      const pays = await this.prisma.pays.findUnique({
        where: { id: dto.paysId },
      });
      if (!pays) {
        throw new BadRequestException("Ce pays n'existe pas");
      }

      //? Verifier si le pays existe deja
      const existingVille = await this.prisma.ville.findUnique({
        where: {
          nom_paysId: {
            nom: dto.nom,
            paysId: dto.paysId,
          },
        },
      });
      if (existingVille) {
        throw new ConflictException('Cette ville existe deja dans ce pays');
      }

      const ville = await this.prisma.ville.create({
        data: {
          nom: dto.nom,
          codePostal: dto.codePostal,
          paysId: dto.paysId,
        },
        include: {
          pays: true,
        },
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Ville cree avec succes',
        data: ville,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la creation de la ville',
      );
    }
  }

  async findAll(paysId: number) {
    try {
      const where = paysId ? { paysId } : {};

      const villes = await this.prisma.ville.findMany({
        where,
        orderBy: [{ pays: { nom: 'asc' } }, { nom: 'asc' }],
        include: {
          pays: true,
          _count: {
            select: {
              publications: true,
            },
          },
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Villes recuperees avec succes',
        data: villes,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation des villes',
      );
    }
  }

  async findByPays(paysId: number) {
    try {
      //? Verifier si le pays existe
      const pays = await this.prisma.pays.findUnique({
        where: { id: paysId },
      });
      if (!pays) {
        throw new BadRequestException('Pays non trouvee');
      }

      const villes = await this.prisma.ville.findMany({
        where: { paysId },
        orderBy: {
          nom: 'asc',
        },
        include: {
          _count: {
            select: {
              publications: true,
            },
          },
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Villes du pays recuperees avec succes',
        data: villes,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des villes du pays',
      );
    }
  }

  async findOne(id: number) {
    try {
      const ville = await this.prisma.ville.findUnique({
        where: {
          id,
        },
        include: {
          pays: true,
          _count: {
            select: {
              publications: true,
            },
          },
        },
      });

      if (!ville) {
        throw new NotFoundException('Ville non trouvee');
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Ville recupere avec succes',
        data: ville,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la récupération de la ville',
      );
    }
  }

  async update(id: number, dto: UpdateVilleDto) {
    try {
      //? Vérifier si la ville existe
      const existingVille = await this.prisma.ville.findUnique({
        where: { id },
      });

      if (!existingVille) {
        throw new NotFoundException('Ville non trouvée');
      }

      //? Vérifier les doublons si modification du nom
      if (dto.nom && dto.nom !== existingVille.nom) {
        const duplicateVille = await this.prisma.ville.findUnique({
          where: {
            nom_paysId: {
              nom: dto.nom,
              paysId: existingVille.paysId,
            },
          },
        });

        if (duplicateVille) {
          throw new ConflictException(
            `La ville "${dto.nom}" existe déjà dans ce pays`,
          );
        }
      }

      const ville = await this.prisma.ville.update({
        where: {
          id,
        },
        data: dto,
        include: {
          pays: true,
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Ville mis a jour avec succes',
        data: ville,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour de la ville',
      );
    }
  }

  async delete(id: number) {
    try {
      const ville = await this.prisma.ville.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              publications: true,
            },
          },
        },
      });
      if (!ville) {
        throw new NotFoundException('Ville non trouvee');
      }
      //? Empêcher la suppression si des publications sont liées
      if (ville._count.publications > 0) {
        throw new ConflictException(
          `Impossible de supprimer cette ville car ${ville._count.publications} publication(s) y sont liées`,
        );
      }

      await this.prisma.ville.delete({
        where: { id },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Ville supprimee avec succes',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression de la ville',
      );
    }
  }
}
