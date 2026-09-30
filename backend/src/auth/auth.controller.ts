import { IsEmail, IsString, MinLength } from 'class-validator'; // tem que instalar o class-validator e class-transformer para funcionar a validação dos DTOs

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
