import { PublicationStatut } from '@prisma/client';
import { AuteurResponseDto } from './auteur-response-dto';
import { OffreResponseDto } from './offre-response.dto';
import { PublicationImageResponseDto } from './publication-image-response.dto';

export class PublicationOffreResponseDto {
  id: number;

  titre: string;

  description: string;

  statut: PublicationStatut;

  createdAt: Date;

  updatedAt: Date;

  auteur: AuteurResponseDto;

  offre?: OffreResponseDto;

  images: PublicationImageResponseDto[];
}
