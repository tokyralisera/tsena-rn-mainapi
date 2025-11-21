import { Langue, Sexe } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  nomUtilisateur: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  prenomUtilisateur: string;

  @IsString()
  @MaxLength(12, { message: 'Le numero NIF doit contenir 12 chiffres' })
  NIF: string;

  @IsString()
  @MaxLength(11, { message: 'Le numero STAT doit contenir 11 chiffres' })
  STAT: string;

  @IsEnum(Langue)
  @IsOptional()
  langue: Langue;

  @IsEnum(Sexe)
  @IsOptional()
  sexe: Sexe;

  @IsString()
  @IsOptional()
  @Length(10, 15)
  telephone: string;
}
