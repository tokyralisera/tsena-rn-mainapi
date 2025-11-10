import { IsString, IsNotEmpty } from 'class-validator';


export class CreateInfoPublicationDto {
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  title: string;

  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  content: string;
}