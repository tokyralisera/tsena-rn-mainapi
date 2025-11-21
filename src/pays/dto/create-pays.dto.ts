import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreatePaysDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom du pays est requis' })
  nom: string;

  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le code du pays est requis' })
  @Length(2, 3, { message: 'Le code doit contenir 2 ou 3 caractères' })
  @Matches(/^[A-Z]{2,3}$/, {
    message: 'Le code doit être en majuscules (ex: MG, FR, USA)',
  })
  code: string;
}
