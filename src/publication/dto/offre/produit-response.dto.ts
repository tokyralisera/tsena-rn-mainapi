import { UniteMesure } from '@prisma/client';

export class ProduitResponseDto {
  id: number;

  libelle: string;

  prixUnitaire: number;

  quantite: number;

  uniteMesure: UniteMesure;

  categorieId: number;

  categorie?: {
    id: number;
    nom: string;
  };
}
