import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UtilisateursService } from './utilisateurs/utilisateurs.service';
import { UtilisateursController } from './utilisateurs/utilisateurs.controller';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [UtilisateursController],
  providers: [UtilisateursService],
})
export class AppModule {}
