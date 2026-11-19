import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { RequestAutenticada } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AgendamentosService } from './agendamentos.service.js';

// Login obrigatório em tudo. Aprovar, recusar e apagar tudo: só GESTOR.
@Controller('agendamentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  // Agenda geral (todos veem os horários ocupados)
  @Get()
  listarTodos() {
    return this.agendamentosService.listar();
  }

  // Somente as reservas de quem está logado
  @Get('minhas')
  listarMinhas(@Req() req: RequestAutenticada) {
    return this.agendamentosService.listarMinhas(req.user);
  }

  @Post()
  criar(@Body() dto: any, @Req() req: RequestAutenticada) {
    return this.agendamentosService.criar(dto, req.user);
  }

  // Remove as reservas de quem está logado (declarada antes de ':id')
  @Delete('minhas')
  removerMinhas(@Req() req: RequestAutenticada) {
    return this.agendamentosService.removerMinhas(req.user);
  }

  // Remove TODAS as reservas de todos: só GESTOR
  @Roles('GESTOR')
  @Delete()
  removerTodos() {
    return this.agendamentosService.removerTodos();
  }

  @Delete(':id')
  remover(@Param('id') id: string, @Req() req: RequestAutenticada) {
    return this.agendamentosService.remover(id, req.user);
  }

  // Usados pela área de ADMIN
  @Roles('GESTOR')
  @Patch(':id/aprovar')
  aprovar(@Param('id') id: string) {
    return this.agendamentosService.aprovar(id);
  }

  @Roles('GESTOR')
  @Patch(':id/recusar')
  recusar(@Param('id') id: string) {
    return this.agendamentosService.recusar(id);
  }
}
