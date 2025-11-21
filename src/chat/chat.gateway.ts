import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {  Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userInfo?: {
    id: number;
    nomUtilisateur: string;
    prenomUtilisateur: string;
  };
}

@WebSocketGateway({
  namespace: 'chat', 
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Map pour suivre les utilisateurs connectés et leurs sockets
  private userSockets = new Map<number, Set<string>>();
  
  // Map pour suivre les utilisateurs dans chaque conversation
  private conversationUsers = new Map<number, Set<number>>();

  constructor(private readonly chatService: ChatService) {}

  /**
   * Gestion de la connexion d'un client
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Client connecting: ${client.id}`);
      
      // Extraire le token et décoder (temporairement sans guard strict)
      const token = this.extractTokenFromClient(client);
      
      if (token) {
        try {
          // Tentative de décodage simple du token (sans vérification stricte pour le test)
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          
          client.userId = payload.sub || payload.id;
          client.userInfo = {
            id: payload.sub || payload.id,
            nomUtilisateur: payload.nomUtilisateur || 'User',
            prenomUtilisateur: payload.prenomUtilisateur || 'Test',
          };
          
          this.logger.log(`Client pre-authenticated from token: User ${client.userId}`);
        } catch (err) {
          this.logger.warn(`Token decode failed: ${err.message}`);
        }
      } else {
        this.logger.warn(`No token provided for client ${client.id}`);
      }
      
      client.emit('connected', { 
        message: 'Connecté au serveur de chat',
        authenticated: !!client.userId
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.emit('error', { message: error.message });
      // NE PAS déconnecter le client ici
    }
  }

  /**
   * Extraire le token du client
   */
  private extractTokenFromClient(client: AuthenticatedSocket): string | null {
    // Méthode 1: Query params
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Méthode 2: Auth object
    const authToken = client.handshake?.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Méthode 3: Headers
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Gestion de la déconnexion d'un client
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    if (client.userId) {
      // Retirer le socket de la map des utilisateurs
      const userSocketsSet = this.userSockets.get(client.userId);
      if (userSocketsSet) {
        userSocketsSet.delete(client.id);
        if (userSocketsSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }

      // Notifier les conversations que l'utilisateur était en ligne
      this.conversationUsers.forEach((users, conversationId) => {
        if (users.has(client.userId)) {
          users.delete(client.userId);
          this.server.to(`conversation:${conversationId}`).emit('user_offline', {
            userId: client.userId,
            conversationId,
          });
        }
      });
    }
  }

  /**
   * Authentifier l'utilisateur et enregistrer sa connexion
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: number; userInfo: any },
  ) {
    try {
      client.userId = data.userId;
      client.userInfo = data.userInfo;

      // Ajouter le socket à la map des utilisateurs
      if (!this.userSockets.has(data.userId)) {
        this.userSockets.set(data.userId, new Set());
      }
      this.userSockets.get(data.userId).add(client.id);

      this.logger.log(`User authenticated: ${data.userId} (${client.id})`);

      client.emit('authenticated', {
        success: true,
        userId: data.userId,
      });
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      client.emit('error', { message: 'Échec de l\'authentification' });
    }
  }

  /**
   * Rejoindre une conversation (room)
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Non authentifié' });
        return;
      }

      const { conversationId } = data;

      // Vérifier que l'utilisateur a accès à cette conversation
      await this.chatService.getConversation(client.userId, conversationId);

      // Rejoindre la room Socket.io
      const roomName = `conversation:${conversationId}`;
      client.join(roomName);

      // Suivre l'utilisateur dans cette conversation
      if (!this.conversationUsers.has(conversationId)) {
        this.conversationUsers.set(conversationId, new Set());
      }
      this.conversationUsers.get(conversationId).add(client.userId);

      this.logger.log(`User ${client.userId} joined conversation ${conversationId}`);

      // Notifier les autres participants
      client.to(roomName).emit('user_joined', {
        userId: client.userId,
        userInfo: client.userInfo,
        conversationId,
      });

      client.emit('joined_conversation', {
        conversationId,
        success: true,
      });

      // Marquer la conversation comme lue
      await this.chatService.markAsRead(client.userId, conversationId);
    } catch (error) {
      this.logger.error(`Join conversation error: ${error.message}`);
      client.emit('error', {
        message: 'Impossible de rejoindre la conversation',
        error: error.message,
      });
    }
  }

  /**
   * Quitter une conversation (room)
   */
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const { conversationId } = data;
      const roomName = `conversation:${conversationId}`;
      
      client.leave(roomName);

      // Retirer l'utilisateur du suivi de la conversation
      const users = this.conversationUsers.get(conversationId);
      if (users) {
        users.delete(client.userId);
      }

      this.logger.log(`User ${client.userId} left conversation ${conversationId}`);

      // Notifier les autres participants
      client.to(roomName).emit('user_left', {
        userId: client.userId,
        conversationId,
      });

      client.emit('left_conversation', {
        conversationId,
        success: true,
      });
    } catch (error) {
      this.logger.error(`Leave conversation error: ${error.message}`);
    }
  }

  /**
   * Envoyer un message en temps réel
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Non authentifié' });
        return;
      }

      // Sauvegarder le message via le service
      const message = await this.chatService.sendMessage(client.userId, data);

      const roomName = `conversation:${data.conversationId}`;

      // Émettre le message à tous les participants de la conversation
      this.server.to(roomName).emit('message_received', {
        message,
        conversationId: data.conversationId,
      });

      // Confirmation d'envoi au sender
      client.emit('message_sent', {
        success: true,
        message,
      });

      // Notifier les utilisateurs qui ne sont pas dans la room (notifications)
      await this.notifyOfflineUsers(data.conversationId, client.userId, message);

      this.logger.log(`Message sent in conversation ${data.conversationId} by user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('error', {
        message: 'Erreur lors de l\'envoi du message',
        error: error.message,
      });
    }
  }

  /**
   * Indicateur "en train d'écrire"
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number; isTyping: boolean },
  ) {
    try {
      if (!client.userId) return;

      const roomName = `conversation:${data.conversationId}`;

      // Notifier les autres participants
      client.to(roomName).emit('user_typing', {
        userId: client.userId,
        userInfo: client.userInfo,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      this.logger.error(`Typing error: ${error.message}`);
    }
  }

  /**
   * Marquer les messages comme lus
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      if (!client.userId) return;

      await this.chatService.markAsRead(client.userId, data.conversationId);

      const roomName = `conversation:${data.conversationId}`;

      // Notifier l'autre participant
      client.to(roomName).emit('messages_read', {
        userId: client.userId,
        conversationId: data.conversationId,
      });

      client.emit('marked_as_read', {
        success: true,
        conversationId: data.conversationId,
      });
    } catch (error) {
      this.logger.error(`Mark as read error: ${error.message}`);
    }
  }

  /**
   * Notifier les utilisateurs hors ligne (non connectés à la room)
   */
  private async notifyOfflineUsers(
    conversationId: number,
    senderId: number,
    message: any,
  ) {
    try {
      const conversation = await this.chatService.getConversation(
        senderId,
        conversationId,
      );

      // Déterminer le destinataire
      const recipientId =
        conversation.initiatorId === senderId
          ? conversation.recipientId
          : conversation.initiatorId;

      // Vérifier si le destinataire est connecté mais pas dans la room
      const recipientSockets = this.userSockets.get(recipientId);
      const usersInRoom = this.conversationUsers.get(conversationId);

      if (recipientSockets && (!usersInRoom || !usersInRoom.has(recipientId))) {
        // L'utilisateur est connecté mais pas dans cette conversation
        recipientSockets.forEach((socketId) => {
          this.server.to(socketId).emit('new_message_notification', {
            conversationId,
            message,
            sender: message.sender,
          });
        });
      }
    } catch (error) {
      this.logger.error(`Notify offline users error: ${error.message}`);
    }
  }

  /**
   * Méthode utilitaire pour envoyer une notification à un utilisateur spécifique
   */
  sendNotificationToUser(userId: number, event: string, data: any) {
    const userSocketsSet = this.userSockets.get(userId);
    if (userSocketsSet) {
      userSocketsSet.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}