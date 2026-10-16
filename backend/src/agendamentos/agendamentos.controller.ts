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
  criar(@Body() dto: any) { // Usamos any aqui para capturar todos os campos que o frontend envia
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const [ano, mes, dia] = dto.data.split('-');
    const diaSemana = dias[new Date(+ano, +mes - 1, +dia).getDay()];

    const novoAgendamento = {
      id: Date.now(),
      sala: dto.sala,
      materia: dto.materia || 'Reservado',
      dia: diaSemana,
      hora: dto.hora,
      data: dto.data, // MUDANÇA CRUCIAL: Tem de se chamar "data" e não "dataOriginal"
      status: dto.status || 'APROVADO', // MUDANÇA CRUCIAL: O frontend precisa do status
      professor: dto.professor || 'Professor'
    };

    this.agendamentos.push(novoAgendamento);

    return {
      message: 'Agendamento criado com sucesso!',
      dados: novoAgendamento
    };
  }
}