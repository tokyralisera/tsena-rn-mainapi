import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVilleDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de la ville est requis' })
  nom: string;

  @IsOptional()
  @IsString({ message: 'Le code postal doit être une chaîne de caractères' })
  codePostal?: string;

  @IsInt({ message: 'L\'ID du pays doit être un nombre entier' })
  @IsPositive({ message: 'L\'ID du pays doit être positif' })
  @Type(() => Number)
  paysId: number;
}