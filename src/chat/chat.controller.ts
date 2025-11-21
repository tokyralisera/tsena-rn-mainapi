// src/chat/chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) 
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation créée ou récupérée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const userId = req.user?.id;
    return this.chatService.createConversation(userId, createConversationDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Récupérer toutes les conversations de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des conversations récupérée avec succès',
  })
  async getUserConversations(
    @Request() req,
    @Query() query: ConversationQueryDto,
  ) {
    const userId = req.user?.id;
    return this.chatService.getUserConversations(userId, query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Récupérer une conversation spécifique' })
  @ApiResponse({ status: 200, description: 'Conversation récupérée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé à cette conversation' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async getConversation(
    @Request() req,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const userId = req.user?.id;
    return this.chatService.getConversation(userId, conversationId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Récupérer les messages d\'une conversation' })
  @ApiResponse({ status: 200, description: 'Messages récupérés avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async getMessages(
    @Request() req,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() query: MessagesQueryDto,
  ) {
    const userId = req.user?.id;
    return this.chatService.getMessages(userId, conversationId, query);
  }

  @Get('conversations/:id/publication')
  @ApiOperation({ summary: 'Récupérer la publication liée à une conversation' })
  @ApiResponse({
    status: 200,
    description: 'Publication récupérée avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Publication non trouvée' })
  async getConversationPublication(
    @Request() req,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const userId = req.user?.id;
    return this.chatService.getConversationPublication(userId, conversationId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user?.id;
    return this.chatService.sendMessage(userId, sendMessageDto);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer une conversation comme lue' })
  @ApiResponse({
    status: 200,
    description: 'Conversation marquée comme lue avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async markAsRead(
    @Request() req,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const userId = req.user?.id;
    return this.chatService.markAsRead(userId, conversationId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Récupérer le nombre total de messages non lus' })
  @ApiResponse({
    status: 200,
    description: 'Nombre de messages non lus récupéré avec succès',
  })
  async getUnreadCount(@Request() req) {
    const userId = req.user?.id;
    const count = await this.chatService.getUnreadCount(userId);
    return { count };
  }
}