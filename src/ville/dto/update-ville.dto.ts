import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateVilleDto {
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  nom?: string;

  @IsOptional()
  @IsString({ message: 'Le code postal doit être une chaîne de caractères' })
  codePostal?: string;
}
