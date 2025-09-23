import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UtilisateursService } from 'src/utilisateurs/utilisateurs.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UtilisateursService) {
    super({
      jwtFromRequest: (req) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        
        // Si le token commence déjà par "Bearer", on le laisse tel quel
        if (authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }
        
        // Sinon on retourne le token directement
        return authHeader;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'JWT_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    try {
      console.log('Validation JWT - Payload reçu:', payload);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      console.error('Erreur validation JWT:', error);
      throw error;
    }
  }
}
