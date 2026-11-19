import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { Perfil } from '../schemas/user.schema.js';

// Usado pelo GESTOR para criar contas
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // Opcional: se não vier, a conta é criada como PROFESSOR
  @IsOptional()
  @IsIn(['PROFESSOR', 'GESTOR'])
  perfil?: Perfil;
}
