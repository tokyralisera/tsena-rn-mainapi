/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    /**
     * Créer une nouvelle conversation ou récupérer une existante
     */
    async createConversation(userId: number, dto: CreateConversationDto) {
        // Vérifier que la publication existe et récupérer ses infos
        const publication = await this.prisma.publication.findUnique({
            where: { id: dto.publicationId },
            include: {
                auteur: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
            },
        });

        if (!publication) {
            throw new NotFoundException('Publication non trouvée');
        }

        // Vérifier que la publication est validée
        if (publication.statut !== 'VALIDE') {
            throw new BadRequestException('La publication doit être validée pour initier une conversation');
        }

        const recipientId = publication.auteurId;

        // L'utilisateur ne peut pas créer une conversation avec lui-même
        if (userId === recipientId) {
            throw new BadRequestException('Vous ne pouvez pas créer une conversation avec vous-même');
        }

        // Vérifier si une conversation existe déjà
        const existingConversation = await this.prisma.conversation.findUnique({
            where: {
                publicationId_initiatorId_recipientId: {
                    publicationId: dto.publicationId,
                    initiatorId: userId,
                    recipientId: recipientId,
                },
            },
            include: {
                initiator: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                recipient: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { messages: true },
                },
            },
        });

        if (existingConversation) {
            return existingConversation;
        }

        // Créer une nouvelle conversation
        const conversation = await this.prisma.conversation.create({
            data: {
                titre: publication.titre,
                publicationId: dto.publicationId,
                initiatorId: userId,
                recipientId: recipientId,
            },
            include: {
                initiator: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                recipient: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                messages: true,
                _count: {
                    select: { messages: true },
                },
            },
        });

        return conversation;
    }

    /**
     * Récupérer toutes les conversations d'un utilisateur
     */
    async getUserConversations(userId: number, query: ConversationQueryDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [conversations, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where: {
                    AND: [
                        { isActive: true },
                        {
                            OR: [{ initiatorId: userId }, { recipientId: userId }],
                        },
                    ],
                },
                include: {
                    initiator: {
                        select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                    },
                    recipient: {
                        select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            contenu: true,
                            createdAt: true,
                            senderId: true,
                            isRead: true,
                        },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.conversation.count({
                where: {
                    AND: [
                        { isActive: true },
                        {
                            OR: [{ initiatorId: userId }, { recipientId: userId }],
                        },
                    ],
                },
            }),
        ]);

        // Calculer le nombre de messages non lus pour chaque conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { not: userId },
                        isRead: false,
                    },
                });

                return {
                    ...conv,
                    unreadCount,
                };
            }),
        );

        return {
            data: conversationsWithUnread,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Récupérer une conversation spécifique
     */
    async getConversation(userId: number, conversationId: number) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                initiator: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                recipient: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                _count: {
                    select: { messages: true },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation non trouvée');
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        if (conversation.initiatorId !== userId && conversation.recipientId !== userId) {
            throw new ForbiddenException('Vous n\'avez pas accès à cette conversation');
        }

        // Compter les messages non lus
        const unreadCount = await this.prisma.message.count({
            where: {
                conversationId: conversation.id,
                senderId: { not: userId },
                isRead: false,
            },
        });

        return {
            ...conversation,
            unreadCount,
        };
    }

    /**
     * Récupérer les messages d'une conversation
     */
    async getMessages(userId: number, conversationId: number, query: MessagesQueryDto) {
        // Vérifier l'accès à la conversation
        await this.getConversation(userId, conversationId);

        const { page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { conversationId },
                include: {
                    sender: {
                        select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.message.count({
                where: { conversationId },
            }),
        ]);

        return {
            data: messages,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Envoyer un message
     */
    async sendMessage(userId: number, dto: SendMessageDto) {
        // Vérifier l'accès à la conversation
        const conversation = await this.getConversation(userId, dto.conversationId);

        // Créer le message
        const message = await this.prisma.message.create({
            data: {
                contenu: dto.contenu,
                conversationId: dto.conversationId,
                senderId: userId,
            },
            include: {
                sender: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
            },
        });

        // Mettre à jour la conversation (updatedAt)
        await this.prisma.conversation.update({
            where: { id: dto.conversationId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    /**
     * Marquer les messages d'une conversation comme lus
     */
    async markAsRead(userId: number, conversationId: number) {
        // Vérifier l'accès à la conversation
        await this.getConversation(userId, conversationId);

        // Marquer tous les messages non lus de l'autre utilisateur comme lus
        await this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        // Mettre à jour le timestamp de lecture
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        const updateData =
            conversation.initiatorId === userId
                ? { lastReadByInitiator: new Date() }
                : { lastReadByRecipient: new Date() };

        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: updateData,
        });
    }

    /**
     * Obtenir le nombre total de messages non lus pour un utilisateur
     */
    async getUnreadCount(userId: number): Promise<number> {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [{ initiatorId: userId }, { recipientId: userId }],
                    },
                ],
            },
            select: { id: true },
        });

        const conversationIds = conversations.map((c) => c.id);

        return this.prisma.message.count({
            where: {
                conversationId: { in: conversationIds },
                senderId: { not: userId },
                isRead: false,
            },
        });
    }

    /**
     * Récupérer les détails de la publication liée à une conversation
     */
    async getConversationPublication(userId: number, conversationId: number) {
        const conversation = await this.getConversation(userId, conversationId);

        const publication = await this.prisma.publication.findUnique({
            where: { id: conversation.publicationId },
            include: {
                images: true,
                auteur: {
                    select: { id: true, nomUtilisateur: true, prenomUtilisateur: true },
                },
                ville: {
                    include: { pays: true },
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
                demande: {
                    include: {
                        produits: {
                            include: {
                                categorie: true,
                            },
                        },
                    },
                },
            },
        });

        if (!publication) {
            throw new NotFoundException('Publication liée non trouvée');
        }

        return publication;
    }
}