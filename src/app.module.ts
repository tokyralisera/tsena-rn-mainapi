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
import { CategorieModule } from './categorie/categorie.module';
import { PaysModule } from './pays/pays.module';
import { VilleModule } from './ville/ville.module';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ChatModule } from './chat/chat.module';

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
    CategorieModule,
    PaysModule,
    VilleModule,
    ChatModule,
  ],
  controllers: [UtilisateursController, UploadController, ChatController],
  providers: [UtilisateursService, ChatService],
})
export class AppModule {}
