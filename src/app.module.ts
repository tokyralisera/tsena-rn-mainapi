import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UtilisateursService } from './utilisateurs/utilisateurs.service';
import { UtilisateursController } from './utilisateurs/utilisateurs.controller';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { ConfigModule } from '@nestjs/config';
import { PublicationModule } from './publication/publication.module';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PublicationModule,
    UploadModule,
  ],
  controllers: [UtilisateursController, UploadController],
  providers: [UtilisateursService],
})
export class AppModule {}
