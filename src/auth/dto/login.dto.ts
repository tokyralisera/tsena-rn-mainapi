import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caracteres',
  })
  password: string;
}
