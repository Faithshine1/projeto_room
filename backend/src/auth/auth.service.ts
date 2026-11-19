import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from './users/dto/criar.conta.dto.js';
import { TokenService } from './token.service.js';
import { LoginDto } from './users/dto/login.dto.js';
import { UsersService } from './users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  // Só chega aqui um GESTOR logado (protegido no controller).
  // Se o perfil não for informado, a conta é de PROFESSOR.
  criarUsuario(dto: CreateUserDto) {
    return this.users.criar(dto, dto.perfil ?? 'PROFESSOR');
  }

  listarUsuarios() {
    return this.users.listar();
  }

  alterarAtivo(id: string, ativo: boolean, idDoGestor: string) {
    if (id === idDoGestor && !ativo) {
      throw new BadRequestException('Você não pode desativar a própria conta.');
    }
    return this.users.alterarAtivo(id, ativo);
  }

  async login(dto: LoginDto) {
    const usuario = await this.users.buscarPorEmailComSenha(dto.email);
    const senhaOk =
      usuario && (await bcrypt.compare(dto.password, usuario.senha));

    if (!usuario || !senhaOk || !usuario.ativo) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const token = this.tokens.assinar({
      sub: usuario.id as string,
      nome: usuario.nome,
      perfil: usuario.perfil,
    });

    return {
      token,
      usuario: {
        id: usuario.id as string,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }
}
