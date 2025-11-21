import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategorieDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis' })
  nom: string;
}
