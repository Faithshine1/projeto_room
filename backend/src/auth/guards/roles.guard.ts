import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../roles.decorator.js';
import type { RequestAutenticada } from './jwt-auth.guard.js';
import type { Perfil } from '../users/schemas/user.schema.js';

// Use sempre depois do JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Perfil[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permitidos || permitidos.length === 0) return true;

    const req = context.switchToHttp().getRequest<RequestAutenticada>();
    if (!permitidos.includes(req.user.perfil)) {
      throw new ForbiddenException('Acesso negado para este perfil.');
    }
    return true;
  }
}
