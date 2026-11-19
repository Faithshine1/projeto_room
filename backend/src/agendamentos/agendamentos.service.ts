import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { UsuarioLogado } from '../auth/guards/jwt-auth.guard.js';

import {
  Agendamento,
  AgendamentoDocument,
  StatusAgendamento,
} from './schemas/agendamento.schema.js';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

@Injectable()
export class AgendamentosService {
  constructor(
    @InjectModel(Agendamento.name)
    private readonly agendamentoModel: Model<AgendamentoDocument>,
  ) {}

  private paraDto(a: AgendamentoDocument) {
    return {
      id: a._id.toString(),
      sala: a.sala,
      materia: a.materia,
      dia: a.dia,
      data: a.data,
      hora: a.hora,
      status: a.status,
      professor: a.professor,
      professorId: a.professorId,
      criadaEm: a.criadaEm,
    };
  }

  // Aceita só ids no formato do MongoDB (24 caracteres hexadecimais)
  private validarId(id: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new BadRequestException('ID do agendamento inválido.');
    }
  }

  async listar() {
    const lista = await this.agendamentoModel
      .find()
      .sort({ data: 1, hora: 1 })
      .exec();

    return lista.map((a) => this.paraDto(a));
  }

  // Só as reservas do usuário logado
  async listarMinhas(usuario: UsuarioLogado) {
    const lista = await this.agendamentoModel
      .find({ professorId: usuario.id })
      .sort({ data: 1, hora: 1 })
      .exec();

    return lista.map((a) => this.paraDto(a));
  }

  async criar(
    dados: {
      sala?: string;
      data?: string;
      hora?: string;
      materia?: string;
    },
    usuario: UsuarioLogado,
  ) {
    const sala = String(dados?.sala ?? '').trim();
    const data = String(dados?.data ?? '').trim();
    const hora = String(dados?.hora ?? '').trim();

    if (!sala) {
      throw new BadRequestException('Informe a sala.');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new BadRequestException('Data inválida. Use o formato AAAA-MM-DD.');
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new BadRequestException('Hora inválida. Use o formato HH:MM.');
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    if (
      dataLocal.getFullYear() !== ano ||
      dataLocal.getMonth() !== mes - 1 ||
      dataLocal.getDate() !== dia
    ) {
      throw new BadRequestException('Essa data não existe.');
    }

    // Não deixa duas reservas ativas (pendente/aprovada) na mesma sala, data e hora
    const jaReservado = await this.agendamentoModel
      .exists({ sala, data, hora, status: { $ne: 'REJEITADO' } })
      .exec();

    if (jaReservado) {
      throw new ConflictException(
        'Esse horário já está reservado para essa sala.',
      );
    }

    // O status NUNCA vem do cliente: toda reserva começa PENDENTE
    const criado = await this.agendamentoModel.create({
      sala,
      data,
      hora,
      materia: String(dados?.materia ?? '').trim() || 'Agendado',
      dia: DIAS[dataLocal.getDay()],
      // Professor e id vêm do token, nunca do que o cliente enviar
      professor: usuario.nome,
      professorId: usuario.id,
      status: 'PENDENTE',
    });

    return {
      message: 'Solicitação enviada! Aguardando aprovação do administrador.',
      dados: this.paraDto(criado),
    };
  }

  private async alterarStatus(id: string, status: StatusAgendamento) {
    this.validarId(id);

    const agendamento = await this.agendamentoModel.findById(id).exec();

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (agendamento.status !== 'PENDENTE') {
      throw new ConflictException('Esta reserva já foi analisada.');
    }

    agendamento.status = status;
    await agendamento.save();

    return {
      message:
        status === 'APROVADO'
          ? 'Reserva aprovada!'
          : 'Reserva recusada!',
      dados: this.paraDto(agendamento),
    };
  }

  aprovar(id: string) {
    return this.alterarStatus(id, 'APROVADO');
  }

  recusar(id: string) {
    return this.alterarStatus(id, 'REJEITADO');
  }

  // Professor só remove a própria reserva; GESTOR remove qualquer uma
  async remover(id: string, usuario: UsuarioLogado) {
    this.validarId(id);

    const existente = await this.agendamentoModel.findById(id).exec();

    if (!existente) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (usuario.perfil !== 'GESTOR' && existente.professorId !== usuario.id) {
      throw new ForbiddenException('Você só pode remover as suas reservas.');
    }

    const removido = await this.agendamentoModel.findByIdAndDelete(id).exec();

    if (!removido) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return {
      message: 'Agendamento removido com sucesso!',
      dados: this.paraDto(removido),
    };
  }

  // Remove todas as reservas do usuário logado
  async removerMinhas(usuario: UsuarioLogado) {
    const resultado = await this.agendamentoModel
      .deleteMany({ professorId: usuario.id })
      .exec();

    return {
      message: 'Suas reservas foram removidas!',
      total: resultado.deletedCount,
    };
  }

  async removerTodos() {
    const resultado = await this.agendamentoModel.deleteMany({}).exec();

    return {
      message: 'Todos os agendamentos foram removidos!',
      total: resultado.deletedCount,
    };
  }
}
