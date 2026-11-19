import { SetMetadata } from '@nestjs/common';
import type { Perfil } from './users/schemas/user.schema.js';

export const ROLES_KEY = 'perfis';

// Uso: @Roles('GESTOR')
export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES_KEY, perfis);
