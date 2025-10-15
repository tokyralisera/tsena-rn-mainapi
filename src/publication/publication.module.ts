import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { PublicationOffreController } from './controllers/publication-offre.controller';
import { PublicationOffreService } from './services/publication-offre.service';

@Module({
    imports:[PrismaModule, UploadModule],
    controllers: [PublicationOffreController],
    providers: [PublicationOffreService],
    exports: [PublicationOffreService]
})
export class PublicationModule {}
