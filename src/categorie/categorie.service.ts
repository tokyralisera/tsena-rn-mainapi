import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategorieService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategorieDto) {
    try {
      const existingCategory = await this.prisma.categorie.findUnique({
        where: { nom: dto.nom },
      });

      if (existingCategory) {
        throw new ConflictException('Cette categorie existe deja');
      }

      const categorie = await this.prisma.categorie.create({
        data: {
          nom: dto.nom,
        },
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Categorie cree avec succes',
        data: categorie,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la creation de la categorie',
      );
    }
  }

  async findAll() {
    try {
      const categories = await this.prisma.categorie.findMany({
        orderBy: { nom: 'asc' },
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Categories recuperees avec succes',
        data: categories,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation des categories',
      );
    }
  }

  async findOne(id: number) {
    try {
      const categorie = await this.prisma.categorie.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
      });

      if (!categorie) {
        throw new NotFoundException('Categorie non trouvee');
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Categorie recuperees avec succes',
        data: categorie,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation de la categorie',
      );
    }
  }

  async update(id: number, dto: UpdateCategorieDto) {
    try {
      const existingCategory = await this.prisma.categorie.findUnique({
        where: { id },
      });
      if (!existingCategory) {
        throw new NotFoundException('Categorie non trouvee');
      }

      if (dto.nom && dto.nom !== existingCategory.nom) {
        const duplicateCategorie = await this.prisma.categorie.findUnique({
          where: { nom: dto.nom },
        });
        if (duplicateCategorie) {
          throw new ConflictException('Une categorie avec ce nom existe deja');
        }
      }

      const categorie = await this.prisma.categorie.update({
        where: { id },
        data: dto,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Categorie mis a jour avec succes',
        data: categorie,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour de la catégorie',
      );
    }
  }

  async delete(id: number) {
    try {
      const categorie = await this.prisma.categorie.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
      });
      if (!categorie) {
        throw new NotFoundException('Categorie non trouvee');
      }

      if (categorie._count.produits > 0) {
        throw new ConflictException(
          "Impossible de supprimer cette catégorie car ${categorie._count.produits} produit(s) l'utilisent",
        );
      }

      await this.prisma.categorie.delete({
        where: { id },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Categorie supprimee avec succes',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression de la catégorie',
      );
    }
  }
}
