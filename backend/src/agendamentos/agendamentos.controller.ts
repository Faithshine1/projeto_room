import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { AgendamentosService } from './agendamentos.service.js';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @Get()
  listarTodos() {
    return this.agendamentosService.listar();
  }

  @Post()
  criar(@Body() dto: any) {
    return this.agendamentosService.criar(dto);
  }

  // Remove TODAS as reservas
  @Delete()
  removerTodos() {
    return this.agendamentosService.removerTodos();
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.agendamentosService.remover(id);
  }

  // Usados pela área de ADMIN
  @Patch(':id/aprovar')
  aprovar(@Param('id') id: string) {
    return this.agendamentosService.aprovar(id);
  }

  @Patch(':id/recusar')
  recusar(@Param('id') id: string) {
    return this.agendamentosService.recusar(id);
  }
}
