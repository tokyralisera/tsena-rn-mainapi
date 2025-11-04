import { UpdatePublicationDemandeDto } from './../dto/demande/update-publication-demande.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreatePublicationDemandeDto } from '../dto/demande/create-publication-demande.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PublicationStatut, Role, StatutDemande } from '@prisma/client';
import { UpdatePublicationStatutDto } from '../dto/offre/update-publication-statut.dto';
import { UpdateDemandeStatutDto } from '../dto/demande/update-demande-statut.dto';

@Injectable()
export class PublicationDemandeService {
  private readonly DEMANDES_FOLDER = 'RoadMarket/publications/demandes';

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) { }

  private readonly includeOptions = {
    auteur: {
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        telephone: true,
      },
    },
    demande: {
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
      include: {
        pays: true,
      },
    },
  };

  /**
   * Créer une publication de demande
   */
  async create(
    dto: CreatePublicationDemandeDto,
    files: Express.Multer.File[] | undefined,
    auteurId: number,
  ) {
    //? Validation max 5 images (optionnelles)
    if (files && files.length > 5) {
      throw new BadRequestException('Au maximum 5 images pour une demande');
    }

    //? Validation budgetMax >= budgetMin
    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMax < dto.budgetMin
    ) {
      throw new BadRequestException(
        'Le budget maximum doit être supérieur ou égal au budget minimum',
      );
    }

    //? Validation deadline dans le futur
    if (dto.deadline) {
      const deadlineDate = new Date(dto.deadline);
      if (deadlineDate <= new Date()) {
        throw new BadRequestException(
          'La date limite doit être dans le futur',
        );
      }
    }

    try {
      //? Vérification que la ville existe
      const ville = await this.prisma.ville.findUnique({
        where: { id: dto.villeId },
      });

      if (!ville) {
        throw new BadRequestException("La ville spécifiée n'existe pas");
      }

      //? Upload des images vers Cloudinary (optionnel)
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        const uploadResult = await this.uploadService.uploadMultipleImage(
          files,
          this.DEMANDES_FOLDER,
        );
        imageUrls = uploadResult.data.urls;
      }

      //? Création de la publication
      const publication = await this.prisma.publication.create({
        data: {
          titre: dto.titre,
          description: dto.description,
          type: 'DEMANDE',
          auteurId,
          villeId: dto.villeId,
          demande: {
            create: {
              statutDemande: StatutDemande.NON_TROUVEE,
              deadline: dto.deadline ? new Date(dto.deadline) : null,
              budgetMin: dto.budgetMin,
              budgetMax: dto.budgetMax,
              produits: {
                create: dto.produits.map((produit) => ({
                  nom: produit.nom,
                  quantite: produit.quantite,
                  uniteMesure: produit.uniteMesure,
                  categorieId: produit.categorieId,
                })),
              },
            },
          },
          images:
            imageUrls.length > 0
              ? { create: imageUrls.map((url) => ({ url })) }
              : undefined,
        },
        include: this.includeOptions,
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Demande créée avec succès, en attente de validation',
        data: publication,
      };
    } catch (error) {
      console.log('Prisma error:', error);

      //! Nettoyage Cloudinary en cas d'erreur
      if (files && files.length > 0) {
        // Tentative de nettoyage silencieuse
        const publicIds = files.map(
          (file) => `${this.DEMANDES_FOLDER}/${file.filename}`,
        );
        await this.uploadService.deleteMultipleImage(publicIds).catch(() => { });
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erreur lors de la création de la demande',
      );
    }
  }

  /**
   * Récupérer toutes les demandes validées (public)
   */
  async findAllPublic(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where: {
            statut: PublicationStatut.VALIDE,
            type: 'DEMANDE',
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.includeOptions,
        }),
        this.prisma.publication.count({
          where: {
            statut: PublicationStatut.VALIDE,
            type: 'DEMANDE',
          },
        }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Demandes récupérées avec succès',
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
        'Erreur lors de la récupération des demandes',
      );
    }
  }

  /**
   * Récupérer toutes les demandes pour admin (avec filtres)
   */
  async findAllForAdmin(
    page: number = 1,
    limit: number = 10,
    statut?: PublicationStatut,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        type: 'DEMANDE',
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
        message: 'Demandes récupérées avec succès',
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
        'Erreur lors de la récupération des demandes',
      );
    }
  }

  /**
   * Récupérer mes demandes (utilisateur connecté)
   */
  async findMyPublications(userId: number, page: number = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [publications, total] = await Promise.all([
        this.prisma.publication.findMany({
          where: {
            auteurId: userId,
            type: 'DEMANDE',
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.includeOptions,
        }),
        this.prisma.publication.count({
          where: {
            auteurId: userId,
            type: 'DEMANDE',
          },
        }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Vos demandes récupérées avec succès',
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
        'Erreur lors de la récupération de vos demandes',
      );
    }
  }

  /**
   * Récupérer une demande par ID
   */
  async findOne(id: number, userId?: number, userRole?: Role) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: this.includeOptions,
      });

      if (!publication) {
        throw new NotFoundException('Demande non trouvée');
      }

      //? Vérifier que c'est bien une demande
      if (publication.type !== 'DEMANDE') {
        throw new BadRequestException('Cette publication n\'est pas une demande');
      }

      //? Si la demande n'est pas validée, seul l'auteur ou admin peut la voir
      if (publication.statut !== PublicationStatut.VALIDE) {
        const isAuthor = userId && publication.auteurId === userId;
        const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPERADMIN;

        if (!isAuthor && !isAdmin) {
          throw new ForbiddenException('Accès refusé à cette demande');
        }
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Demande récupérée avec succès',
        data: publication,
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
        'Erreur lors de la récupération de la demande',
      );
    }
  }

  /**
   * Modifier une demande
   */
  async update(
    id: number,
    dto: UpdatePublicationDemandeDto,
    files: Express.Multer.File[] | undefined,
    userId: number,
  ) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: {
          demande: {
            include: {
              produits: true,
            },
          },
          images: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Demande non trouvée');
      }

      if (publication.type !== 'DEMANDE') {
        throw new BadRequestException('Cette publication n\'est pas une demande');
      }

      //? Vérification que seul l'auteur peut modifier
      if (publication.auteurId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres demandes',
        );
      }

      //? Validation max 5 images
      if (files && files.length > 5) {
        throw new BadRequestException('Maximum 5 images par demande');
      }

      //? Vérifier la ville si changement
      if (dto.villeId) {
        const ville = await this.prisma.ville.findUnique({
          where: { id: dto.villeId },
        });

        if (!ville) {
          throw new BadRequestException("La ville spécifiée n'existe pas");
        }
      }

      //? Validation budgetMax >= budgetMin
      const newBudgetMin = dto.budgetMin ?? publication.demande?.budgetMin;
      const newBudgetMax = dto.budgetMax ?? publication.demande?.budgetMax;

      if (
        newBudgetMin !== undefined &&
        newBudgetMin !== null &&
        newBudgetMax !== undefined &&
        newBudgetMax !== null &&
        newBudgetMax < newBudgetMin
      ) {
        throw new BadRequestException(
          'Le budget maximum doit être supérieur ou égal au budget minimum',
        );
      }

      //? Validation deadline dans le futur
      if (dto.deadline) {
        const deadlineDate = new Date(dto.deadline);
        if (deadlineDate <= new Date()) {
          throw new BadRequestException(
            'La date limite doit être dans le futur',
          );
        }
      }

      const updateData: any = {
        statut: PublicationStatut.EN_ATTENTE, // Repasse en attente après modification
        type: 'DEMANDE',
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

      //? Mise à jour de la demande et des produits
      updateData.demande = {
        update: {
          ...(dto.deadline !== undefined && {
            deadline: dto.deadline ? new Date(dto.deadline) : null,
          }),
          ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
          ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
          ...(dto.produits && {
            produits: {
              deleteMany: {}, // Suppression de tous les anciens produits
              create: dto.produits.map((produit) => ({
                nom: produit.nom,
                quantite: produit.quantite,
                uniteMesure: produit.uniteMesure,
                categorieId: produit.categorieId,
              })),
            },
          }),
        },
      };

      //? Gestion des images
      if (files && files.length > 0) {
        const uploadResult = await this.uploadService.uploadMultipleImage(
          files,
          this.DEMANDES_FOLDER,
        );

        const oldPublicIds = publication.images
          .map((img) => {
            const matches = img.url.match(
              /RoadMarket\/publications\/demandes\/[^.]+/,
            );
            return matches ? matches[0] : null;
          })
          .filter((id) => id !== null);

        updateData.images = {
          deleteMany: {},
          create: uploadResult.data.urls.map((url) => ({ url })),
        };

        // Suppression des anciennes images sur Cloudinary
        if (oldPublicIds.length > 0) {
          this.uploadService
            .deleteMultipleImage(oldPublicIds)
            .catch((error) => {
              console.error(
                'Erreur lors de la suppression des anciennes images:',
                error,
              );
            });
        }
      }

      const updatedPublication = await this.prisma.publication.update({
        where: { id },
        data: updateData,
        include: this.includeOptions,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Demande mise à jour avec succès, en attente de validation',
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
        'Erreur lors de la mise à jour de la demande',
      );
    }
  }

  /**
   * Modifier le statut de publication (admin)
   */
  async updateStatut(id: number, dto: UpdatePublicationStatutDto) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
      });

      if (!publication) {
        throw new NotFoundException('Demande non trouvée');
      }

      if (publication.type !== 'DEMANDE') {
        throw new BadRequestException('Cette publication n\'est pas une demande');
      }

      // Validation métier : éviter la re-validation
      if (
        publication.statut === PublicationStatut.VALIDE &&
        dto.statut === PublicationStatut.VALIDE
      ) {
        throw new BadRequestException('Demande déjà validée');
      }

      const updatedPublication = await this.prisma.publication.update({
        where: { id },
        data: {
          statut: dto.statut,
        },
        include: this.includeOptions,
      });

      const message =
        dto.statut === PublicationStatut.VALIDE
          ? 'Demande validée avec succès'
          : 'Demande rejetée';

      return {
        success: true,
        statusCode: 200,
        message,
        data: updatedPublication,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du statut de la demande',
      );
    }
  }

  /**
   * Modifier le statut de la demande (TROUVEE/NON_TROUVEE/EXPIREE) - Utilisateur
   */
  async updateDemandeStatut(
    publicationId: number,
    dto: UpdateDemandeStatutDto,
    userId: number,
  ) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id: publicationId },
        include: {
          demande: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Demande non trouvée');
      }

      if (publication.type !== 'DEMANDE') {
        throw new BadRequestException('Cette publication n\'est pas une demande');
      }

      if (!publication.demande) {
        throw new NotFoundException(
          'Demande non trouvée pour cette publication',
        );
      }

      //? Vérification que seul l'auteur peut modifier le statut
      if (publication.auteurId !== userId) {
        throw new ForbiddenException(
          "Seul l'auteur peut modifier le statut de sa demande",
        );
      }

      //? Validation métier : la publication doit être validée
      if (publication.statut !== PublicationStatut.VALIDE) {
        throw new BadRequestException(
          'Le statut de la demande ne peut être modifié que si la publication est validée',
        );
      }

      await this.prisma.demande.update({
        where: { id: publication.demande.id },
        data: {
          statutDemande: dto.statut,
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
        message: 'Statut de la demande mis à jour avec succès',
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
        'Erreur lors de la mise à jour du statut de la demande',
      );
    }
  }

  /**
   * Supprimer une demande
   */
  async delete(id: number, userId: number, userRole: Role) {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

      if (!publication) {
        throw new NotFoundException('Demande non trouvée');
      }

      if (publication.type !== 'DEMANDE') {
        throw new BadRequestException('Cette publication n\'est pas une demande');
      }

      const isOwner = publication.auteurId === userId;
      const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPERADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          "Vous n'avez pas les droits pour supprimer cette demande",
        );
      }

      // Extraction des publicIds des images pour suppression sur Cloudinary
      const publicIds = publication.images
        .map((img) => {
          const matches = img.url.match(
            /RoadMarket\/publications\/demandes\/[^.]+/,
          );
          return matches ? matches[0] : null;
        })
        .filter((id) => id !== null);

      // Suppression en base
      await this.prisma.publication.delete({ where: { id } });

      // Suppression des images sur Cloudinary
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
        message: 'Demande supprimée avec succès',
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
        'Erreur lors de la suppression de la demande',
      );
    }
  }

  /**
   * Statistiques des demandes (admin)
   */
  async getStatistics() {
    try {
      const [
        total,
        enAttente,
        valide,
        rejete,
        trouvee,
        nonTrouvee,
        expiree,
      ] = await Promise.all([
        this.prisma.publication.count({
          where: { type: 'DEMANDE' },
        }),
        this.prisma.publication.count({
          where: { type: 'DEMANDE', statut: PublicationStatut.EN_ATTENTE },
        }),
        this.prisma.publication.count({
          where: { type: 'DEMANDE', statut: PublicationStatut.VALIDE },
        }),
        this.prisma.publication.count({
          where: { type: 'DEMANDE', statut: PublicationStatut.REJETE },
        }),
        this.prisma.demande.count({
          where: { statutDemande: 'TROUVEE' },
        }),
        this.prisma.demande.count({
          where: { statutDemande: 'NON_TROUVEE' },
        }),
        this.prisma.demande.count({
          where: { statutDemande: 'EXPIREE' },
        }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Statistiques récupérées avec succès',
        data: {
          totalPublications: total,
          publications: {
            enAttente,
            valide,
            rejete,
          },
          demandes: {
            trouvee,
            nonTrouvee,
            expiree,
          },
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des statistiques',
      );
    }
  }

  /**
   * Récupérer les demandes avec filtres avancés
   */
  async findAllWithFilters(filters: {
    statut?: PublicationStatut;
    demandeStatut?: StatutDemande;
    categorieId?: number;
    villeId?: number;
    paysId?: number;
    search?: string;
    auteurId?: number;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'titre' | 'deadline';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        statut,
        demandeStatut,
        categorieId,
        villeId,
        paysId,
        search,
        auteurId,
        budgetMin,
        budgetMax,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      //? Construction dynamique des conditions WHERE
      const where: any = {
        type: 'DEMANDE',
      };

      //? Filtre par statut de publication
      if (statut) {
        where.statut = statut;
      } else {
        // Par défaut, seules les demandes validées sont visibles
        where.statut = PublicationStatut.VALIDE;
      }

      //? Filtre par statut de demande
      if (demandeStatut) {
        where.demande = {
          statutDemande: demandeStatut,
        };
      }

      //? Filtre par catégorie de produit
      if (categorieId) {
        where.demande = {
          ...where.demande,
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

      //? Filtre par budget
      if (budgetMin !== undefined || budgetMax !== undefined) {
        where.demande = {
          ...where.demande,
          ...(budgetMin !== undefined && {
            budgetMax: { gte: budgetMin },
          }),
          ...(budgetMax !== undefined && {
            budgetMin: { lte: budgetMax },
          }),
        };
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
      let orderBy: any = {};
      if (sortBy === 'deadline') {
        orderBy = {
          demande: {
            deadline: sortOrder,
          },
        };
      } else {
        orderBy[sortBy] = sortOrder;
      }

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
        message: 'Demandes récupérées avec succès',
        data: publications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: {
            statut: statut || PublicationStatut.VALIDE,
            demandeStatut,
            categorieId,
            villeId,
            paysId,
            search,
            auteurId,
            budgetMin,
            budgetMax,
            sortBy,
            sortOrder,
          },
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des demandes avec filtres',
      );
    }
  }
}
