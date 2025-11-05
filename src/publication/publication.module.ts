import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { PublicationOffreController } from './controllers/publication-offre.controller';
import { PublicationOffreService } from './services/publication-offre.service';
import { PublicationDemandeService } from './services/publication-demande.service';
import { PublicationDemandeController } from './controllers/publication-demande.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { PublicationDemandeSchedulerService } from './services/publication-demande-scheduler.service';

@Module({
    imports:[PrismaModule, UploadModule, ScheduleModule.forRoot()],
    controllers: [PublicationOffreController, PublicationDemandeController],
    providers: [PublicationOffreService, PublicationDemandeService, PublicationDemandeSchedulerService
    ],
    exports: [PublicationOffreService, PublicationDemandeService]
})
export class PublicationModule {}
