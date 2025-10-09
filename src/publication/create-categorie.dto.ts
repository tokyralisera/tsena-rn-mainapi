import { IsString } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  nom: string;
}
