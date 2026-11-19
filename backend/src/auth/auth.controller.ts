import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { RequestAutenticada } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './roles.decorator.js';
import { AlterarAtivoDto } from './users/dto/alterar-ativo.dto.js';
import { CreateUserDto } from './users/dto/criar.conta.dto.js';
import { LoginDto } from './users/dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Qualquer usuário logado: devolve id, nome e perfil do token
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestAutenticada) {
    return req.user;
  }

  // ----- Gestão de contas: somente GESTOR -----

  @Get('usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GESTOR')
  listarUsuarios() {
    return this.auth.listarUsuarios();
  }

  @Post('usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GESTOR')
  criarUsuario(@Body() dto: CreateUserDto) {
    return this.auth.criarUsuario(dto);
  }

  @Patch('usuarios/:id/ativo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GESTOR')
  alterarAtivo(
    @Param('id') id: string,
    @Body() dto: AlterarAtivoDto,
    @Req() req: RequestAutenticada,
  ) {
    return this.auth.alterarAtivo(id, dto.ativo, req.user.id);
  }
}
