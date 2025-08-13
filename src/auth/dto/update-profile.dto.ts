import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Langue, Sexe } from 'src/types/enums';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nomUtilisateur?: string;

  @IsOptional()
  @IsString()
  prenomUtilisateur?: string;

  @IsOptional()
  @IsEnum(Sexe)
  sexe?: Sexe;

  @IsOptional()
  @IsEnum(Langue)
  langue?: Langue;
}
