import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';

import { RolesGuard } from './roles.guard.js';

function contexto(perfil: string): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: { perfil } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('libera quando a rota não exige perfil', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(contexto('PROFESSOR'))).toBe(true);
  });

  it('libera o GESTOR em rota de gestor', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GESTOR']);

    expect(guard.canActivate(contexto('GESTOR'))).toBe(true);
  });

  it('bloqueia o PROFESSOR em rota de gestor', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GESTOR']);

    expect(() => guard.canActivate(contexto('PROFESSOR'))).toThrow(
      ForbiddenException,
    );
  });
});
