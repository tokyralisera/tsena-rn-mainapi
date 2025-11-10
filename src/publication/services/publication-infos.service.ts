// src/modules/info-publication/services/info-publication.service.ts

import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UploadService } from 'src/upload/upload.service';
import { CreateInfoPublicationDto } from '../dto/infos/create-info-pub.dto';
import { UpdateInfoPublicationDto } from '../dto/infos/update-info-pub.dto';

@Injectable()
export class PublicationInfosService {
    private readonly INFOS_FOLDER = 'RoadMarket/publications/actualites';
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    /**
     * 1. Créer une publication d'info utile avec upload d'images
     */
    async createInfoPublication(
        data: CreateInfoPublicationDto,
        files: Express.Multer.File[],
        authorId: number,
    ) {
        // Vérifier que l'utilisateur est admin ou superadmin
        const user = await this.prisma.utilisateur.findUnique({
            where: { id: authorId },
            select: { role: true },
        });

        if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)) {
            throw new ForbiddenException(
                'Seuls les administrateurs peuvent créer des publications d\'informations',
            );
        }

        // Valider les champs obligatoires
        if (!data.title || !data.content) {
            throw new BadRequestException('Le titre et le contenu sont obligatoires');
        }

        // Valider qu'il y a au moins une image
        if (!files || files.length === 0) {
            throw new BadRequestException('Au moins une image est obligatoire');
        }

        // Uploader les images sur Cloudinary
        let imageUrls: string[] = [];
        try {
            const uploadPromises = files.map(file =>
                this.uploadService.uploadImage(file, this.INFOS_FOLDER)
            );
            const uploadResults = await Promise.all(uploadPromises);
            imageUrls = uploadResults.map(result => result.url);
        } catch (error) {
            throw new BadRequestException('Erreur lors de l\'upload des images: ' + error.message);
        }

        // Créer la publication avec les URLs des images
        const infoPublication = await this.prisma.infoPublication.create({
            data: {
                title: data.title,
                content: data.content,
                images: imageUrls,
                authorId: authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        nomUtilisateur: true,
                        prenomUtilisateur: true,
                        role: true,
                    },
                },
            },
        });

        return infoPublication;
    }

    /**
     * 2. Modifier une publication avec possibilité d'upload de nouvelles images
     */
    async updateInfoPublication(
        publicationId: number,
        data: UpdateInfoPublicationDto,
        userId: number,
        files?: Express.Multer.File[],
    ) {
        // Vérifier que la publication existe
        const existingPublication = await this.prisma.infoPublication.findUnique({
            where: { id: publicationId },
            include: {
                author: {
                    select: { role: true },
                },
            },
        });

        if (!existingPublication) {
            throw new NotFoundException('Publication non trouvée');
        }

        // Vérifier que l'utilisateur est admin/superadmin
        const user = await this.prisma.utilisateur.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)) {
            throw new ForbiddenException(
                'Seuls les administrateurs peuvent modifier des publications',
            );
        }

        // Vérifier les permissions
        if (existingPublication.authorId !== userId && user.role !== Role.SUPERADMIN) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres publications');
        }

        let imageUrls: string[] | undefined;

        // Si de nouveaux fichiers sont fournis, les uploader
        if (files && files.length > 0) {
            try {
                // Supprimer les anciennes images de Cloudinary
                await this.deleteImagesFromCloudinary(existingPublication.images);

                // Uploader les nouvelles images
                const uploadPromises = files.map(file =>
                    this.uploadService.uploadImage(file, this.INFOS_FOLDER)
                );
                const uploadResults = await Promise.all(uploadPromises);
                imageUrls = uploadResults.map(result => result.url);
            } catch (error) {
                throw new BadRequestException('Erreur lors de l\'upload des images: ' + error.message);
            }
        }

        // Si aucun fichier mais qu'on veut garder les images existantes
        // On ne met pas à jour le champ images
        if (imageUrls && imageUrls.length === 0) {
            throw new BadRequestException('Au moins une image est obligatoire');
        }

        const updatedPublication = await this.prisma.infoPublication.update({
            where: { id: publicationId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(imageUrls && { images: imageUrls }),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        nomUtilisateur: true,
                        prenomUtilisateur: true,
                        role: true,
                    },
                },
            },
        });

        return updatedPublication;
    }

    /**
     * 3. Supprimer une publication (avec suppression des images Cloudinary)
     */
    async deleteInfoPublication(publicationId: number, userId: number) {
    // Vérifier que la publication existe
        const existingPublication = await this.prisma.infoPublication.findUnique({
            where: { id: publicationId },
        });

        if (!existingPublication) {
            throw new NotFoundException('Publication non trouvée');
        }

        // Vérifier que l'utilisateur est admin/superadmin
        const user = await this.prisma.utilisateur.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)) {
            throw new ForbiddenException(
                'Seuls les administrateurs peuvent supprimer des publications',
            );
        }

        // SuperAdmin peut tout supprimer, Admin seulement ses propres publications
        if (existingPublication.authorId !== userId && user.role !== Role.SUPERADMIN) {
            throw new ForbiddenException('Vous ne pouvez supprimer que vos propres publications');
        }

        // Supprimer les images de Cloudinary
        try {
            await this.deleteImagesFromCloudinary(existingPublication.images);
        } catch (error) {
            console.error('Erreur lors de la suppression des images Cloudinary:', error);
            // On continue même si la suppression Cloudinary échoue
        }

        await this.prisma.infoPublication.delete({
            where: { id: publicationId },
        });

        return { message: 'Publication supprimée avec succès' };
    }

    /**
     * 4. Récupérer toutes les publications d'infos (tous les utilisateurs)
     */
    async getAllInfoPublications(userId?: number, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [publications, total] = await Promise.all([
            this.prisma.infoPublication.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            nomUtilisateur: true,
                            prenomUtilisateur: true,
                            role: true,
                        },
                    },
                    likes: userId
                        ? {
                            where: { userId },
                            select: { id: true },
                        }
                        : false,
                    _count: {
                        select: { likes: true },
                    },
                },
            }),
            this.prisma.infoPublication.count(),
        ]);

        // Formatter les résultats pour inclure isLikedByUser
        const formattedPublications = publications.map((pub) => ({
            id: pub.id,
            title: pub.title,
            content: pub.content,
            images: pub.images,
            authorId: pub.authorId,
            likeCount: pub.likeCount,
            createdAt: pub.createdAt,
            updatedAt: pub.updatedAt,
            author: pub.author,
            isLikedByUser: userId ? pub.likes && pub.likes.length > 0 : false,
            likesCount: pub._count.likes,
        }));

        return {
            publications: formattedPublications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Récupérer une publication spécifique
     */
    async getInfoPublicationById(userId: number, publicationId: number, ) {
        const publication = await this.prisma.infoPublication.findUnique({
            where: { id: publicationId },
            include: {
                author: {
                    select: {
                        id: true,
                        nomUtilisateur: true,
                        prenomUtilisateur: true,
                        role: true,
                    },
                },
                likes: userId
                    ? {
                        where: { userId },
                        select: { id: true },
                    }
                    : false,
                _count: {
                    select: { likes: true },
                },
            },
        });

        if (!publication) {
            throw new NotFoundException('Publication non trouvée');
        }

        return {
            id: publication.id,
            title: publication.title,
            content: publication.content,
            images: publication.images,
            authorId: publication.authorId,
            likeCount: publication.likeCount,
            createdAt: publication.createdAt,
            updatedAt: publication.updatedAt,
            author: publication.author,
            isLikedByUser: userId ? publication.likes && publication.likes.length > 0 : false,
            likesCount: publication._count.likes,
        };
    }

    /**
     * 5. Liker/Unliker une publication (tous les utilisateurs)
     */
    async toggleLikeInfoPublication(publicationId: number, userId: number) {
        // Vérifier que la publication existe
        const publication = await this.prisma.infoPublication.findUnique({
            where: { id: publicationId },
        });

        if (!publication) {
            throw new NotFoundException('Publication non trouvée');
        }

        // Vérifier si l'utilisateur a déjà liké
        const existingLike = await this.prisma.infoPublicationLike.findUnique({
            where: {
                publicationId_userId: {
                    publicationId,
                    userId,
                },
            },
        });

        if (existingLike) {
            // Unlike : supprimer le like et décrémenter le compteur
            await this.prisma.$transaction([
                this.prisma.infoPublicationLike.delete({
                    where: { id: existingLike.id },
                }),
                this.prisma.infoPublication.update({
                    where: { id: publicationId },
                    data: { likeCount: { decrement: 1 } },
                }),
            ]);

            return {
                liked: false,
                message: 'Like retiré avec succès',
                likeCount: Math.max(0, publication.likeCount - 1),
            };
        } else {
            // Like : créer le like et incrémenter le compteur
            await this.prisma.$transaction([
                this.prisma.infoPublicationLike.create({
                    data: {
                        publicationId,
                        userId,
                    },
                }),
                this.prisma.infoPublication.update({
                    where: { id: publicationId },
                    data: { likeCount: { increment: 1 } },
                }),
            ]);

            return {
                liked: true,
                message: 'Publication likée avec succès',
                likeCount: publication.likeCount + 1,
            };
        }
    }

    /**
     * Méthode utilitaire pour supprimer les images de Cloudinary
     */
    private async deleteImagesFromCloudinary(imageUrls: string[]): Promise<void> {
        if (!imageUrls || imageUrls.length === 0) return;

        const deletePromises = imageUrls.map(url => {
            // Extraire le public_id de l'URL Cloudinary
            const publicId = this.extractPublicIdFromUrl(url);
            if (publicId) {
                return this.uploadService.deleteImage(publicId);
            }
            return Promise.resolve();
        });

        await Promise.allSettled(deletePromises);
    }

    /**
     * Extraire le public_id d'une URL Cloudinary
     * Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
     */
    private extractPublicIdFromUrl(url: string): string | null {
        try {
            // Extraire la partie après /upload/
            const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
            if (matches && matches[1]) {
                // Le public_id inclut le chemin du dossier
                return matches[1];
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de l\'extraction du public_id:', error);
            return null;
        }
    }
}