import { OffreStatut } from '@prisma/client';
import { ProduitResponseDto } from './produit-response.dto';

export class OffreResponseDto {
  id: number;

  statut: OffreStatut;

  produits: ProduitResponseDto[];
}
