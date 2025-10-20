import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateProduitDto } from './create-produit.dto';

export class CreatePublicationOffreDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  titre: string;

  @IsString()
  @IsNotEmpty({ message: 'La description est requise' })
  description: string;

  @IsInt()
  @IsPositive({ message: "L'ID de la ville doit être positif" })
  @Type(() => Number)
  villeId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Au moins un produit est requis' })
  @Type(() => CreateProduitDto)
  produits: CreateProduitDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
