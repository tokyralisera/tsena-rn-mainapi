import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UniteMesure } from '@prisma/client';

export class CreateDemandeProduitDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est obligatoire' })
  nom: string;

  @IsInt({ message: 'La quantité doit être un nombre entier' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  @IsOptional()
  @Type(() => Number)
  quantite?: number;

  @IsEnum(UniteMesure, {
    message: 'Unité de mesure invalide. Valeurs acceptées: PIECE, TONNE, KILOGRAMME, LITRE, KILOMETRE, HECTARE'
  })
  @IsOptional()
  uniteMesure?: UniteMesure;

  @IsInt({ message: 'L\'ID de la catégorie doit être un nombre entier' })
  @IsNotEmpty({ message: 'La catégorie est obligatoire' })
  @Type(() => Number)
  categorieId: number;
}