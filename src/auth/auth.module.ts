import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UtilisateursService } from 'src/utilisateurs/utilisateurs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'JWT_SECRET_KEY',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  providers: [
    AuthService,
    UtilisateursService,
    PrismaService,
    JwtStrategy,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
