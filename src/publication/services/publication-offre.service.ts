import { UpdatePublicationOffreDto } from './../dto/offre/update-publication-offre.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreatePublicationOffreDto } from '../dto/offre/create-publication-offre.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OffreStatut, PublicationStatut, Role } from '@prisma/client';
import { UpdatePublicationStatutDto } from '../dto/offre/update-publication-statut.dto';
import { UpdateOffreStatutDto } from '../dto/offre/update-offre-statut.dto';

@Injectable()
export class PublicationOffreService {
  private readonly OFFRES_FOLDER = 'RoadMarket/publications/offres';

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  private readonly includeOptions = {
    auteur: {
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        telephone: true,
      },
    },
    offre: {
      include: {
        produits: {
          include: {
            categorie: true,
          },
        },
      },
    },
    images: true,
    ville: {
      include:{
        pays: true,
      }
    }
  };

  async create(
    dto: CreatePublicationOffreDto,
    files: Express.Multer.File[],
    auteurId: number,
  ) {
    //? Validation au moins 1 image
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Au moins 1 image obligatoire pour creer une offre',
      );
    }

    if (files.length > 5) {
      throw new BadRequestException('Au maximum 5 images pour une offre');
    }

    try {
      //? Verification que la ville existe
      const ville = await this.prisma.ville.findUnique({
        where: { id: dto.villeId }
      })

      if(!ville){ throw new BadRequestException("La ville specifiee n\'existe pas")}

      //? Upload des images vers Cloundinary
      const uploadResult = await this.uploadService.uploadMultipleImage(
        files,
        this.OFFRES_FOLDER,
      );

      //? Creation de la publication
      const publication = await this.prisma.publication.create({
        data: {
          titre: dto.titre,
          description: dto.description,
          auteurId,
          villeId: dto.villeId,
          offre: {
            create: {
              statut: OffreStatut.NON_VENDU,
              produits: {
                create: dto.produits.map((produit) => ({
                  libelle: produit.libelle,
                  prixUnitaire: produit.prixUnitaire,
                  quantite: produit.quantite,
                  uniteMesure: produit.uniteMesure,
                  categorieId: produit.categorieId,
                })),
              },
            },
          },
          images: { create: uploadResult.data.urls.map((url) => ({ url })) },
        },
        include: this.includeOptions,
      });
      return {
        success: true,
        statusCode: 201,
        message: 'Publication cree avec succes, en attente de validation',
        data: publication,
      };
    } catch (error) {
    console.log('Prisma error:',error);
      //! Nettoyage Cloudinary en cas d'erreur
      if (error.data?.files) {
        const publicIds = error.data.files.map((file) => file.publicId);
        await this.uploadService.deleteMultipleImage(publicIds).catch(() => {});
      }
      throw new InternalServerErrorException(
        'Erreur lors de la creation de la publication',
      );
    }
  }

  async findAllPublic(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where: {
            statut: PublicationStatut.VALIDE,
            type: 'OFFRE',
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.includeOptions,
        }),
        this.prisma.publication.count({
          where: {
            statut: PublicationStatut.VALIDE,
            type: 'OFFRE',
          },
        }),
      ]);
      return {
        success: true,
        statusCode: 200,
        message: 'Publications recuperes avec succes',
        data: publications,
        meta: {
          total,
          page,
          limit,
          totalPage: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation des publications',
      );
    }
  }

  async findAllForAdmin(
    page: number = 1,
    limit: number = 10,
    statut?: PublicationStatut,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        type: 'OFFRE',
      };

      if (statut) {
        where.statut = statut;
      }

      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: this.includeOptions,
        }),
        this.prisma.publication.count({ where }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Publications recuperes avec succes',
        data: publications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation des publications',
      );
    }
  }

  async findMyPublications(userId: number, page: number = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where: {
            auteurId: userId,
            type: 'OFFRE',
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.includeOptions,
        }),
        this.prisma.publication.count({
          where: {
            auteurId: userId,
            type: 'OFFRE',
          },
        }),
      ]);
      return {
        success: true,
        statusCode: 200,
        message: 'Vos publications recuperees avec succes',
        data: publications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation de vos publications',
      );
    }
  }

  async findOne(id: number, userId?: number, userRole?: Role) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: this.includeOptions,
      });

      if (!publication) {
        throw new NotFoundException('Publication non trouvee');
      }

      if (publication.statut !== PublicationStatut.VALIDE) {
        const isAuthor = userId && publication.auteurId === userId;
        const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPERADMIN;

        if (!isAuthor && !isAdmin) {
          throw new ForbiddenException('Acces refuse a cette publication');
        }
      }

      return {
        sucess: true,
        statusCode: 200,
        message: 'Publication recuperee avec succes',
        data: publication,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la recuperation de la publication',
      );
    }
  }

  async update(
    id: number,
    dto: UpdatePublicationOffreDto,
    files: Express.Multer.File[] | undefined,
    userId: number,
  ) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: {
          offre: {
            include: {
              produits: true,
            },
          },
          images: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Publication non trouvee');
      }

      //Verification pour que seul l'auteur puisse modifier sa publication
      if (publication.auteurId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres publications',
        );
      }

          //? Vérifier la ville si changement
    if (dto.villeId) {
      const ville = await this.prisma.ville.findUnique({
        where: { id: dto.villeId },
      });

      if (!ville) {
        throw new BadRequestException('La ville spécifiée n\'existe pas');
      }
    }

      const updateData: any = {
        statut: PublicationStatut.EN_ATTENTE,
      };

      if (dto.titre !== undefined) {
        updateData.titre = dto.titre;
      }

      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }

          if (dto.villeId !== undefined) {
      updateData.villeId = dto.villeId;
    }

      // Mise à jour des produits si fournis
      if (dto.produits) {
        updateData.offre = {
          update: {
            produits: {
              deleteMany: {}, // Suppression de tous les anciens produits
              create: dto.produits.map((produit) => ({
                libelle: produit.libelle,
                prixUnitaire: produit.prixUnitaire,
                quantite: produit.quantite,
                uniteMesure: produit.uniteMesure,
                categorieId: produit.categorieId,
              })),
            },
          },
        };
      }

      if (files && files.length > 0) {
        if (files.length > 0) {
          throw new BadRequestException('Maximum 5 images par publication');
        }
      }

      const uploadResult = await this.uploadService.uploadMultipleImage(
        files,
        this.OFFRES_FOLDER,
      );

      const oldPublicIds = publication.images
        .map((img) => {
          // Extraction du publicId depuis l'URL Cloudinary
          const matches = img.url.match(
            /RoadMarket\/publications\/offres\/[^.]+/,
          );
          return matches ? matches[0] : null;
        })
        .filter((id) => id !== null);

      updateData.images = {
        deleteMany: {}, // Suppression de toutes les anciennes images
        create: uploadResult.data.urls.map((url) => ({ url })),
      };

      // Suppression des anciennes images sur Cloudinary
      if (oldPublicIds.length > 0) {
        this.uploadService.deleteMultipleImage(oldPublicIds).catch((error) => {
          console.error(
            'Erreur lors de la suppression des anciennes images:',
            error,
          );
        });
      }

      const updatePublication = await this.prisma.publication.update({
        where: { id },
        data: updateData,
        include: this.includeOptions,
      });

      return {
        success: true,
        statusCode: 200,
        message:
          'Publication mise a jour avec succes, en attente de validation',
        data: updatePublication,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise a jour de la publication',
      );
    }
  }

  async updateStatut(id: number, dto: UpdatePublicationStatutDto) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
      });

      if (!publication) {
        throw new NotFoundException('Publication non trouvee');
      }

      // Validation métier : éviter la re-validation
      if (
        publication.statut === PublicationStatut.VALIDE &&
        dto.statut === PublicationStatut.VALIDE
      ) {
        throw new BadRequestException('Publication deja validee');
      }

      const updatePublication = await this.prisma.publication.update({
        where: { id },
        data: {
          statut: dto.statut,
        },
        include: this.includeOptions,
      });

      const message =
        dto.statut === PublicationStatut.VALIDE
          ? 'Publication validee avec succes'
          : 'Publication rejetee';
      return {
        success: true,
        statusCode: 200,
        message,
        data: updatePublication,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise a jour du statut de la publication',
      );
    }
  }

  async updateOffreStatut(
    publicationId: number,
    dto: UpdateOffreStatutDto,
    userId: number,
  ) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id: publicationId },
        include: {
          offre: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Publication non trouvee');
      }
      if (!publication.offre) {
        throw new NotFoundException('Offre non trouvee pour cette publication');
      }

      //Verification pour que seul l'auteur puisse modifier le statut de l'offre
      if (publication.auteurId !== userId) {
        throw new ForbiddenException(
          'Seul l auteur peut modifier le statut de son offre',
        );
      }

      // Validation métier : la publication doit être validée
      if (publication.statut !== PublicationStatut.VALIDE) {
        throw new BadRequestException(
          "Le statut de l'offre ne peut être modifié que si la publication est validée",
        );
      }

      await this.prisma.offre.update({
        where: { id: publication.offre.id },
        data: {
          statut: dto.statut,
        },
      });

      // Récupération de la publication mise à jour
      const updatedPublication = await this.prisma.publication.findUnique({
        where: { id: publicationId },
        include: this.includeOptions,
      });

      return {
        success: true,
        statusCode: 200,
        message: "Statut de l'offre mis à jour avec succès",
        data: updatedPublication,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Erreur lors de la mise à jour du statut de l'offre",
      );
    }
  }

  async delete(id: number, userId: number, userRole: Role) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Publication non trouvee');
      }

      const isOwner = publication.auteurId === userId;
      const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPERADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          "Vous n'avez pas les droits pour supprimer cette publication",
        );
      }

      // Extraction des publicIds des images pour suppression sur Cloudinary
      const publicIds = publication.images
        .map((img) => {
          const matches = img.url.match(
            /RoadMarket\/publications\/offres\/[^.]+/,
          );
          return matches ? matches[0] : null;
        })
        .filter((id) => id !== null);

      //Suppression en base
      await this.prisma.publication.delete({ where: { id } });

      //Suppresion des images sur Cloudinary
      if (publicIds.length > 0) {
        this.uploadService.deleteMultipleImage(publicIds).catch((error) => {
          console.error(
            'Erreur lors de la suppression des images sur Cloudinary:',
            error,
          );
        });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Publication supprimee avec succes',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression de la publication',
      );
    }
  }

  async getStatistics() {
    try {
      const [total, enAttente, valide, rejete, vendu, nonVendu] =
        await Promise.all([
          this.prisma.publication.count({
            where: { type: 'OFFRE' },
          }),
          this.prisma.publication.count({
            where: { type: 'OFFRE', statut: PublicationStatut.EN_ATTENTE },
          }),
          this.prisma.publication.count({
            where: { type: 'OFFRE', statut: PublicationStatut.VALIDE },
          }),
          this.prisma.publication.count({
            where: { type: 'OFFRE', statut: PublicationStatut.REJETE },
          }),
          this.prisma.offre.count({
            where: { statut: 'VENDU' },
          }),
          this.prisma.offre.count({
            where: { statut: 'NON_VENDU' },
          }),
        ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Statistiques recuperees avec succes',
        data: {
          totalPublications: total,
          publications: {
            enAttente,
            valide,
            rejete,
          },
          offres: {
            vendu,
            nonVendu,
          },
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des statistiques',
      );
    }
  }

  async findAllWithFilters(filters: {
    statut?: PublicationStatut;
    offreStatut?: string;
    categorieId?: number;
      villeId?: number; 
  paysId?: number; 
    search?: string;
    auteurId?: number;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'titre';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        statut,
        offreStatut,
        categorieId,
              villeId,
      paysId, 
        search,
        auteurId,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      //? Construction dynamique des conditions WHERE
      const where: any = {
        type: 'OFFRE',
      };

      //? Filtre par statut de publication
      if (statut) {
        where.statut = statut;
      } else {
        // Par défaut, seules les publications validées sont visibles pour le public
        where.statut = PublicationStatut.VALIDE;
      }

      //? Filtre par statut d'offre
      if (offreStatut) {
        where.offre = {
          statut: offreStatut,
        };
      }

      //? Filtre par catégorie de produit
      if (categorieId) {
        where.offre = {
          ...where.offre,
          produits: {
            some: {
              categorieId: categorieId,
            },
          },
        };
      }

          //? Filtre par ville
    if (villeId) {
      where.villeId = villeId;
    }

    //? Filtre par pays
    if (paysId) {
      where.ville = {
        paysId: paysId,
      };
    }

      //? Filtre par auteur
      if (auteurId) {
        where.auteurId = auteurId;
      }

      //? Recherche textuelle dans titre et description
      if (search) {
        where.OR = [
          {
            titre: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      //? Construction de l'ordre de tri
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      //? Exécution des requêtes en parallèle
      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: this.includeOptions,
        }),
        this.prisma.publication.count({ where }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Publications récupérées avec succès',
        data: publications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: {
            statut: statut || PublicationStatut.VALIDE,
            offreStatut,
            categorieId,
            villeId,
            paysId,
            search,
            auteurId,
            sortBy,
            sortOrder,
          },
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des publications avec filtres',
      );
    }
  }
}
