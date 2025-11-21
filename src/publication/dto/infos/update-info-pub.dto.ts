import { IsString, IsOptional, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';


export class UpdateInfoPublicationDto {

  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre ne peut pas être vide' })
  title?: string;


  @IsOptional()
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu ne peut pas être vide' })
  content?: string;


  @IsOptional()
  @IsArray({ message: 'Les images doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins une image est obligatoire si fourni' })
  @IsString({ each: true, message: 'Chaque image doit être une chaîne de caractères' })
  @IsNotEmpty({ each: true, message: 'Les URLs d\'images ne peuvent pas être vides' })
  images?: string[];
}