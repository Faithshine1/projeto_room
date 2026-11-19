import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { TokenService } from './token.service.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAuthGuard, RolesGuard],
  // Exportados para proteger rotas de outros módulos (admin, agendamentos...)
  exports: [TokenService, UsersModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
