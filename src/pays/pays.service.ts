import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaysDto } from './dto/create-pays.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePaysDto } from './dto/update-pays.dto';

@Injectable()
export class PaysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaysDto) {
    try {
      const existingByNom = await this.prisma.pays.findUnique({
        where: { nom: dto.nom },
      });
      if (existingByNom) {
        throw new ConflictException('Un pays avec ce nom existe deja');
      }

      const existingByCode = await this.prisma.pays.findUnique({
        where: { code: dto.code },
      });
      if (existingByCode) {
        throw new ConflictException('Un pays avec ce code existe deja');
      }

      const pays = await this.prisma.pays.create({
        data: {
          nom: dto.nom,
          code: dto.code.toUpperCase(),
        },
      });
      return {
        success: true,
        statusCode: 201,
        message: 'Pays cree avec succes',
        data: pays,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la creation de pays',
      );
    }
  }

  async findAll() {
    try {
      const pays = await this.prisma.pays.findMany({
        orderBy: {
          nom: 'asc',
        },
        include: {
          _count: {
            select: {
              villes: true,
            },
          },
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Pays recuperes avec succes',
        data: pays,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation des pays',
      );
    }
  }

  async findOne(id: number) {
    try {
      const pays = await this.prisma.pays.findUnique({
        where: { id },
        include: {
          villes: {
            orderBy: {
              nom: 'asc',
            },
          },
          _count: {
            select: {
              villes: true,
            },
          },
        },
      });

      if (!pays) {
        throw new NotFoundException('Pays non trouvee');
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Pays recupere avec succes',
        data: pays,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation du pays',
      );
    }
  }

  async update(id: number, dto: UpdatePaysDto) {
    try {
      const existingPays = await this.prisma.pays.findUnique({
        where: { id },
      });

      if (!existingPays) {
        throw new NotFoundException('Pays non trouvé');
      }

      if (dto.nom && dto.nom !== existingPays.nom) {
        const duplicateByNom = await this.prisma.pays.findUnique({
          where: { nom: dto.nom },
        });

        if (duplicateByNom) {
          throw new ConflictException('Un pays avec ce nom existe déjà');
        }
      }

      if (dto.code && dto.code !== existingPays.code) {
        const duplicateByCode = await this.prisma.pays.findUnique({
          where: { code: dto.code },
        });

        if (duplicateByCode) {
          throw new ConflictException('Un pays avec ce code existe déjà');
        }
      }

      const pays = await this.prisma.pays.update({
        where: {
          id,
        },
        data: {
          ...(dto.nom && { nom: dto.nom }),
          ...(dto.code && { code: dto.code }),
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Pays mis a jour avec succes',
        data: pays,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du pays',
      );
    }
  }

  async delete(id: number) {
    try {
      const pays = await this.prisma.pays.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              villes: true,
            },
          },
        },
      });
      if (!pays) {
        throw new NotFoundException('Pays non trouvee');
      }

      //? Empêcher la suppression si des villes sont liées
      if (pays._count.villes > 0) {
        throw new ConflictException(
          `Impossible de supprimer ce pays car ${pays._count.villes} ville(s) y sont liées`,
        );
      }

      await this.prisma.pays.delete({
        where: { id },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Pays supprimé avec succès',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression du pays',
      );
    }
  }
}
