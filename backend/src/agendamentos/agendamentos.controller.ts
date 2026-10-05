import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateAgendamentoDto } from '../auth/users/dto/create-agendamento.dto.js';

@Controller('agendamentos')
export class AgendamentosController {
  
  private agendamentos: any[] = [];

  @Get()
  listarTodos() {
    return this.agendamentos;
  }

  @Post()
  criar(@Body() dto: CreateAgendamentoDto) {
    // Função auxiliar para descobrir o dia da semana
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const [ano, mes, dia] = dto.data.split('-');
    const diaSemana = dias[new Date(+ano, +mes - 1, +dia).getDay()];

    const novoAgendamento = {
      id: Date.now(),
      sala: dto.sala,
      materia: dto.materia || 'Reservado',
      dia: diaSemana,
      hora: dto.hora,
      dataOriginal: dto.data
    };

    this.agendamentos.push(novoAgendamento);

    return {
      message: 'Agendamento criado com sucesso!',
      dados: novoAgendamento
    };
  }
}