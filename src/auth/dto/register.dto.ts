import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Langue, Role, Sexe } from 'src/types/enums';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nomUtilisateur: string;

  @IsString()
  prenomUtilisateur: string;

  @IsString()
  @MaxLength(12, { message: 'Le numero NIF doit contenir 12 chiffres' })
  NIF: string;

  @IsString()
  @MaxLength(11, { message: 'Le numero STAT doit contenir 11 chiffres' })
  STAT: string;

  @IsString()
  telephone: string;

  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caracteres',
  })
  password: string;

  @IsEnum(Sexe)
  sexe: Sexe;

  @IsOptional()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsEnum(Langue)
  langue: Langue;

  @IsBoolean()
  isActive: boolean
}
