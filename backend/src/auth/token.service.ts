import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import type { Perfil } from './users/schemas/user.schema.js';

export interface TokenPayload {
  sub: string; // id do usuário
  nome: string;
  perfil: Perfil;
}

const UM_DIA_EM_SEGUNDOS = 60 * 60 * 24;

// Cria e confere o token de login (JWT). O segredo vem do JWT_SECRET no .env.
@Injectable()
export class TokenService {
  private readonly segredo: string;

  constructor(config: ConfigService) {
    // Sem JWT_SECRET o servidor nem sobe, em vez de usar um segredo fraco
    this.segredo = config.getOrThrow<string>('JWT_SECRET');
  }

  assinar(payload: TokenPayload): string {
    return jwt.sign(payload, this.segredo, {
      algorithm: 'HS256',
      expiresIn: UM_DIA_EM_SEGUNDOS,
    });
  }

  // Lança erro se o token for inválido ou estiver expirado
  verificar(token: string): TokenPayload {
    return jwt.verify(token, this.segredo, {
      algorithms: ['HS256'],
    }) as unknown as TokenPayload;
  }
}
