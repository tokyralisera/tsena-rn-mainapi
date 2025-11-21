import { UniteMesure } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateProduitDto {
  @IsString()
  @IsNotEmpty({ message: 'Le libellé du produit est requis' })
  libelle: string;

  @IsNumber()
  @IsPositive({ message: 'Le prix unitaire doit être positif' })
  prixUnitaire: number;

  @IsInt()
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantite: number;

  @IsEnum(UniteMesure, { message: 'Unité de mesure invalide' })
  uniteMesure: UniteMesure;

  @IsInt()
  @Min(1, { message: 'La catégorie est requise' })
  categorieId: number;
}
