import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UtilisateursService } from 'src/utilisateurs/utilisateurs.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UtilisateursService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'JWT_SECRET_KEY',
    });
  }
  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    return {
      id: user.id,
      telephone: user.telephone,
      role: user.role,
    };
  }
}
