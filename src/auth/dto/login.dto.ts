import { IsInt, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsInt()
  telephone: number;

  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caracteres',
  })
  password: string;
}
