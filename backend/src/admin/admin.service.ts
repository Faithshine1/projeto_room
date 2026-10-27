
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

import { Sala, SalaDocument } from './schemas/sala.schema.js';
import {
  Solicitacao,
  SolicitacaoDocument,
} from './schemas/solicitacao.schema.js';

type StatusSolicitacao = 'PENDENTE' | 'APROVADA' | 'RECUSADA';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Sala.name)
    private readonly salaModel: Model<SalaDocument>,

    @InjectModel(Solicitacao.name)
    private readonly solicitacaoModel: Model<SolicitacaoDocument>,
  ) {}

  async dashboard() {
    const [totalSalas, pendentes, aprovadas, recusadas] =
      await Promise.all([
        this.salaModel.countDocuments().exec(),
        this.solicitacaoModel
          .countDocuments({ status: 'PENDENTE' })
          .exec(),
        this.solicitacaoModel
          .countDocuments({ status: 'APROVADA' })
          .exec(),
        this.solicitacaoModel
          .countDocuments({ status: 'RECUSADA' })
          .exec(),
      ]);

    return {
      totalSalas,
      pendentes,
      aprovadas,
      recusadas,
    };
  }

  async listarSalas() {
    const salas = await this.salaModel.find().sort({ createdAt: -1 }).exec();

    return salas.map((sala) => ({
      id: sala._id.toString(),
      nome: sala.nome,
      localizacao: sala.localizacao,
      capacidade: sala.capacidade,
      recursos: sala.recursos,
    }));
  }

  async criarSala(dados: {
    nome: string;
    localizacao?: string;
    capacidade: number;
    recursos?: string[];
  }) {
    const sala = await this.salaModel.create({
      nome: dados.nome,
      localizacao: dados.localizacao ?? '',
      capacidade: dados.capacidade,
      recursos: dados.recursos ?? [],
    });

    return {
      id: sala._id.toString(),
      nome: sala.nome,
      localizacao: sala.localizacao,
      capacidade: sala.capacidade,
      recursos: sala.recursos,
    };
  }

  async removerSala(id: string) {
    // Aceita só ids no formato do MongoDB (24 caracteres hexadecimais)
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new BadRequestException('ID da sala inválido.');
    }

    const removida = await this.salaModel.findByIdAndDelete(id).exec();

    if (!removida) {
      throw new NotFoundException('Sala não encontrada.');
    }

    return {
      message: 'Sala removida com sucesso!',
      id: removida._id.toString(),
      nome: removida.nome,
    };
  }

  async listarSolicitacoes() {
    const solicitacoes = await this.solicitacaoModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return solicitacoes.map((solicitacao) => ({
      id: solicitacao._id.toString(),
      nomeSala: solicitacao.nomeSala,
      solicitante: solicitacao.solicitante,
      justificativa: solicitacao.justificativa,
      status: solicitacao.status,
      criadaEm: solicitacao.criadaEm,
    }));
  }

  async criarSolicitacao(dados: {
    nomeSala: string;
    solicitante: string;
    justificativa?: string;
  }) {
    const solicitacao = await this.solicitacaoModel.create({
      nomeSala: dados.nomeSala,
      solicitante: dados.solicitante,
      justificativa: dados.justificativa ?? '',
      status: 'PENDENTE',
    });

    return {
      id: solicitacao._id.toString(),
      nomeSala: solicitacao.nomeSala,
      solicitante: solicitacao.solicitante,
      justificativa: solicitacao.justificativa,
      status: solicitacao.status,
      criadaEm: solicitacao.criadaEm,
    };
  }

  private async alterarStatus(
    id: string,
    status: StatusSolicitacao,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID da solicitação inválido.');
    }

    const solicitacao = await this.solicitacaoModel
      .findById(id)
      .exec();

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (solicitacao.status !== 'PENDENTE') {
      throw new ConflictException(
        'Esta solicitação já foi analisada.',
      );
    }

    solicitacao.status = status;
    await solicitacao.save();

    return {
      id: solicitacao._id.toString(),
      nomeSala: solicitacao.nomeSala,
      solicitante: solicitacao.solicitante,
      justificativa: solicitacao.justificativa,
      status: solicitacao.status,
      criadaEm: solicitacao.criadaEm,
    };
  }

  aprovar(id: string) {
    return this.alterarStatus(id, 'APROVADA');
  }

  recusar(id: string) {
    return this.alterarStatus(id, 'RECUSADA');
  }
}
