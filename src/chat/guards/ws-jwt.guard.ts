import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userInfo?: {
    id: number;
    nomUtilisateur: string;
    prenomUtilisateur: string;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException('Token manquant');
      }

      // Vérifier et décoder le token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'JWT_SECRET_KEY',
      });

      // Attacher les infos utilisateur au socket
      client.userId = payload.sub || payload.id;
      client.userInfo = {
        id: payload.sub || payload.id,
        nomUtilisateur: payload.nomUtilisateur,
        prenomUtilisateur: payload.prenomUtilisateur,
      };

      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication error: ${error.message}`);
      throw new WsException('Authentification échouée');
    }
  }

  /**
   * Extraire le token du handshake
   */
  private extractTokenFromHandshake(client: AuthenticatedSocket): string | null {
    // Méthode 1: Token dans les headers d'authentification
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Méthode 2: Token dans l'auth query
    const token = client.handshake?.auth?.token;
    if (token) {
      return token;
    }

    // Méthode 3: Token dans les query params
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}