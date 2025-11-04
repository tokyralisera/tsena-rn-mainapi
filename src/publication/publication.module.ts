import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { PublicationOffreController } from './controllers/publication-offre.controller';
import { PublicationOffreService } from './services/publication-offre.service';
import { PublicationDemandeService } from './services/publication-demande.service';
import { PublicationDemandeController } from './controllers/publication-demande.controller';

@Module({
    imports:[PrismaModule, UploadModule],
    controllers: [PublicationOffreController, PublicationDemandeController],
    providers: [PublicationOffreService, PublicationDemandeService],
    exports: [PublicationOffreService, PublicationDemandeService]
})
export class PublicationModule {}
