import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCategorieDto {
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de la catégorie ne peut etre vide' })
  nom?: string;
}
