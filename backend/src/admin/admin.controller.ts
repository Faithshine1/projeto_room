
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
} from '@nestjs/common';

import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('salas')
  listarSalas() {
    return this.adminService.listarSalas();
  }

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

  @Delete('salas/:id')
  removerSala(@Param('id') id: string) {
    return this.adminService.removerSala(id);
  }

  @Get('solicitacoes')
  listarSolicitacoes() {
    return this.adminService.listarSolicitacoes();
  }

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

  @Patch('solicitacoes/:id/aprovar')
  aprovar(@Param('id',) id: string) {
    return this.adminService.aprovar(id);
  }

  @Patch('solicitacoes/:id/recusar')
  recusar(@Param('id',) id: string) {
    return this.adminService.recusar(id);
  }
}
