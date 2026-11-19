
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AdminService } from './admin.service.js';

// Login obrigatório em tudo; cada rota abaixo exige GESTOR, exceto listar salas
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('GESTOR')
  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('salas')
  listarSalas() {
    return this.adminService.listarSalas();
  }

  @Roles('GESTOR')
  @Post('salas')
  criarSala(
    @Body()
    body: {
      nome: string;
      localizacao?: string;
      capacidade: number;
      recursos?: string[];
    },
  ) {
    return this.adminService.criarSala(body);
  }

  @Roles('GESTOR')
  @Delete('salas/:id')
  removerSala(@Param('id') id: string) {
    return this.adminService.removerSala(id);
  }

  @Roles('GESTOR')
  @Get('solicitacoes')
  listarSolicitacoes() {
    return this.adminService.listarSolicitacoes();
  }

  @Roles('GESTOR')
  @Post('solicitacoes')
  criarSolicitacao(
    @Body()
    body: {
      nomeSala: string;
      solicitante: string;
      justificativa?: string;
    },
  ) {
    return this.adminService.criarSolicitacao(body);
  }

  @Roles('GESTOR')
  @Patch('solicitacoes/:id/aprovar')
  aprovar(@Param('id',) id: string) {
    return this.adminService.aprovar(id);
  }

  @Roles('GESTOR')
  @Patch('solicitacoes/:id/recusar')
  recusar(@Param('id',) id: string) {
    return this.adminService.recusar(id);
  }
}
