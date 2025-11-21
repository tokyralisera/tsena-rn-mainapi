import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDemandeProduitDto } from './create-demande-produit.dto';

export class CreatePublicationDemandeDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  titre: string;

  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  description: string;

  @IsInt({ message: 'L\'ID de la ville doit être un nombre entier' })
  @IsNotEmpty({ message: 'La ville est obligatoire' })
  @Type(() => Number)
  villeId: number;

  @IsDateString(
    {},
    { message: 'La date limite doit être une date valide (format ISO 8601)' },
  )
  @IsOptional()
  deadline?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le budget minimum doit être un nombre valide' },
  )
  @Min(0, { message: 'Le budget minimum doit être positif' })
  @IsOptional()
  @Type(() => Number)
  budgetMin?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le budget maximum doit être un nombre valide' },
  )
  @Min(0, { message: 'Le budget maximum doit être positif' })
  @IsOptional()
  @Type(() => Number)
  budgetMax?: number;

  @IsArray({ message: 'Les produits doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un produit est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateDemandeProduitDto)
  produits: CreateDemandeProduitDto[];
}