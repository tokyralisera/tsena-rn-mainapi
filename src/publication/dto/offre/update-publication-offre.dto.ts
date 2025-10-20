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
import { Type } from 'class-transformer';

export class UpdatePublicationOffreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le titre ne peut pas être vide' })
  titre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La description ne peut pas être vide' })
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive({ message: "L'ID de la ville doit être positif" })
  @Type(() => Number)
  villeId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un produit est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateProduitDto)
  produits?: CreateProduitDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
