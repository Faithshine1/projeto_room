import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { TokenService } from '../token.service.js';
import { UsersService } from '../users/users.service.js';
import type { Perfil } from '../users/schemas/user.schema.js';

export interface UsuarioLogado {
  id: string;
  nome: string;
  perfil: Perfil;
}

export type RequestAutenticada = Request & { user: UsuarioLogado };

// Exige login: header Authorization: Bearer <token>
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestAutenticada>();
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token não informado.');

    let idDoUsuario: string;
    try {
      idDoUsuario = this.tokens.verificar(token).sub;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    // Confere no banco a cada chamada: conta desativada ou com perfil
    // alterado vale na hora, sem esperar o token expirar.
    const usuario = await this.users.buscarPorId(idDoUsuario);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuário inválido ou desativado.');
    }

    req.user = {
      id: usuario.id as string,
      nome: usuario.nome,
      perfil: usuario.perfil,
    };
    return true;
  }
}
