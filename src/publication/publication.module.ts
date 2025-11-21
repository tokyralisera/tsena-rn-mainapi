import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { PublicationOffreController } from './controllers/publication-offre.controller';
import { PublicationOffreService } from './services/publication-offre.service';
import { PublicationDemandeService } from './services/publication-demande.service';
import { PublicationDemandeController } from './controllers/publication-demande.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { PublicationDemandeSchedulerService } from './services/publication-demande-scheduler.service';
import { PublicationInfoController } from './controllers/publication-infos.controller';
import { PublicationInfosService } from './services/publication-infos.service';

@Module({
    imports: [PrismaModule, UploadModule, ScheduleModule.forRoot()],
    controllers: [PublicationOffreController, PublicationDemandeController, PublicationInfoController],
    providers: [PublicationOffreService, PublicationDemandeService, PublicationDemandeSchedulerService, PublicationInfosService
    ],
    exports: [PublicationOffreService, PublicationDemandeService, PublicationInfosService]
})
export class PublicationModule {}
